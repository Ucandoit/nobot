import {
  executeConcurrent,
  getFinalPage,
  makePostMobileRequest,
  nobotUtils,
  NOBOT_MOBILE_URL,
  Service
} from '@nobot-core/commons';
import { AccountConfigRepository, AccountRepository } from '@nobot-core/database';
import encoding from 'encoding-japanese';
import he from 'he';
import { inject } from 'inversify';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
import ManageCardService from '../card/manage-card-service';
import { ResourceCost, Training } from '../types';
import VillageService from '../village/village-service';
import trainingConfig from './training-config';

interface TrainingTask {
  start: boolean;
  interval?: NodeJS.Timeout;
}

@Service()
export default class TrainingService {
  private logger = getLogger(TrainingService.name);

  @inject(VillageService)
  private villageService: VillageService;

  @inject(ManageCardService)
  private manageCardService: ManageCardService;

  private accountRepository: AccountRepository;

  private accountConfigRepository: AccountConfigRepository;

  private trainingTasks = new Map<number, TrainingTask>();

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.accountConfigRepository = connection.getCustomRepository(AccountConfigRepository);
  }

  trainingSample = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccountsByStatus('TRAINING');
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        const atkCard = await this.manageCardService.findAccountCardByNumber(2088, login);
        if (atkCard.id > 0) {
          const cardInfo = await this.getCardInfo(atkCard.id, login);
          let training: Training = 'fire';
          if (cardInfo.fire === 20) {
            training = 'earth';
            if (cardInfo.earth === 20) {
              training = 'wind';
            }
          }
          this.start(login, atkCard.id, training);
        }
        const healCard = await this.manageCardService.findAccountCardByNumber(2103, login);
        if (healCard.id > 0) {
          const cardInfo = await this.getCardInfo(healCard.id, login);
          let training: Training = 'water';
          if (cardInfo.water === 20) {
            training = 'sky';
            if (cardInfo.sky === 20) {
              training = 'earth';
            }
          }
          this.start(login, healCard.id, training);
        }
      },
      10
    );
  };

  start = async (login: string, cardId: number, training: Training, targetLevel = 20): Promise<void> => {
    const task = this.trainingTasks.get(cardId);
    if (task && task.start) {
      this.logger.info('Training task is already in progress for card %d', cardId);
    } else {
      this.trainingTasks.set(cardId, { start: true });
      this.logger.info('Start to train for card %s', cardId);
      await this.startTraining(login, cardId, training, targetLevel);
    }
  };

  startTraining = async (login: string, cardId: number, training: Training, targetLevel = 20): Promise<void> => {
    const page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
    const cardInfo = await this.getCardInfo(cardId, login);
    if (cardInfo.inAction) {
      this.logger.info('Card %s is still in action for %s', cardInfo.name, login);
      const cardName = he.encode(encoding.toHankanaCase(cardInfo.name as string));
      const commandInfos = page('.sp_village_command_info');
      let seconds = -1;
      for (let i = 0; i < commandInfos.length; i++) {
        const commandInfo = commandInfos.eq(i);
        if (commandInfo.html()?.includes(cardName)) {
          seconds = nobotUtils.getSeconds(commandInfo.find('span[id^=cmd]').text());
          break;
        }
      }
      if (seconds > 0) {
        this.logger.info('Wait %d seconds to complete training card %s of %s', seconds, cardInfo.name, login);
        const interval = setTimeout(() => {
          this.startTraining(login, cardId, training, targetLevel);
        }, seconds * 1000);
        const task = this.trainingTasks.get(cardId) as TrainingTask;
        this.trainingTasks.set(cardId, {
          ...task,
          interval
        });
        return;
      }
    }
    if (cardInfo.refineCurrent < cardInfo.refineMax) {
      const currentLevel = cardInfo[training];
      if (currentLevel < targetLevel) {
        const trainingCost = trainingConfig.getTrainingCostMap().get(training)?.get(cardInfo[training]) as ResourceCost;
        const resourceInfo = this.villageService.getResourceInfo(page);
        const newUser = page('#new-player-button').length > 0;
        if (this.villageService.costEnough(trainingCost, resourceInfo)) {
          const areas = this.villageService.getMapInfo(page);
          const area = areas.find((a) => !a.running && a.building && a.building.facility === training);
          if (area && (area.level + 1) * 2 > currentLevel) {
            this.logger.info(
              'Training level %d %s for card %s of %s',
              currentLevel + 1,
              training,
              cardInfo.name,
              login
            );
            await makePostMobileRequest(
              NOBOT_MOBILE_URL.TRAINING,
              login,
              `chara_id=${cardId}&buildIdx=${parseInt(area.mapId.replace('map', ''), 10)}&catev=0`
            );
            const seconds = newUser ? trainingCost.reducedSeconds : trainingCost.seconds;
            this.logger.info('Wait %d seconds to complete training card %s of %s', seconds, cardInfo.name, login);
            const interval = setTimeout(() => {
              this.startTraining(login, cardId, training, targetLevel);
            }, seconds * 1000);
            const task = this.trainingTasks.get(cardId) as TrainingTask;
            this.trainingTasks.set(cardId, {
              ...task,
              interval
            });
            return;
          }
          this.logger.info('No available %s training facility for card %s of %s', training, cardInfo.name, login);
        } else {
          this.logger.info('Not enough resources for training card %s of %s', cardInfo.name, login);
        }
      } else {
        this.logger.info('Level %d reached. Training finish for card %s of %s', targetLevel, cardInfo.name, login);
      }
    } else {
      this.logger.info(
        'Refine max %d reached. Training finish for card %s of %s',
        cardInfo.refineMax,
        cardInfo.name,
        login
      );
    }
    const task = this.trainingTasks.get(cardId) as TrainingTask;
    this.trainingTasks.set(cardId, {
      ...task,
      start: false
    });
  };

  checkNeedTraining = async (): Promise<void> => {
    this.logger.info('Start checking accounts training status.');
    const accounts = await this.accountRepository.getMobileAccountsByStatus('TRAINING');
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        let training = false;
        const atkCard = await this.manageCardService.findAccountCardByNumber(2088, login);
        if (atkCard.id > 0) {
          const cardInfo = await this.getCardInfo(atkCard.id, login);
          if (cardInfo.refineCurrent < cardInfo.refineMax) {
            training = true;
          }
        }
        const healCard = await this.manageCardService.findAccountCardByNumber(2103, login);
        if (healCard.id > 0) {
          const cardInfo = await this.getCardInfo(healCard.id, login);
          if (cardInfo.refineCurrent < cardInfo.refineMax) {
            training = true;
          }
        }
        if (!training) {
          this.logger.info('Account %s has finished training all.', login);
          await this.accountConfigRepository.update(login, { status: 'FINISH' });
        }
      },
      10
    );
    this.logger.info('Finish checking accounts training status.');
    await this.trainingSample();
  };

  getCardInfo = async (cardId: number, login: string): Promise<any> => {
    const page = await makePostMobileRequest(NOBOT_MOBILE_URL.CARD_DETAIL, login, `cardid=${cardId}&button=1`);
    const refineTotalText =
      page('.card-refine-total').length > 0
        ? page('.card-refine-total b').text()
        : page('.card-refine-total-left b').text();
    const [current, max] = refineTotalText.split('/');
    return {
      id: cardId,
      name: page('.card-name').text(),
      refineCurrent: parseInt(current.replace('Lv', ''), 10),
      refineMax: parseInt(max, 10),
      fire: parseInt(page('.card-refine-atk').text().replace('Lv', ''), 10),
      earth: parseInt(page('.card-refine-def').text().replace('Lv', ''), 10),
      wind: parseInt(page('.card-refine-spd').text().replace('Lv', ''), 10),
      water: parseInt(page('.card-refine-vir').text().replace('Lv', ''), 10),
      sky: parseInt(page('.card-refine-stg').text().replace('Lv', ''), 10),
      inAction: page('.card').attr('class')?.includes('is-action')
    };
  };
}
