import {
  asyncForEach,
  executeConcurrent,
  getFinalPage,
  makeMobileRequest,
  makePostMobileRequest,
  nobotUtils,
  NOBOT_MOBILE_URL,
  regexUtils,
  Service
} from '@nobot-core/commons';
import { AccountConfigRepository, AccountRepository, DeckConfigRepository } from '@nobot-core/database';
import encoding from 'encoding-japanese';
import he from 'he';
import { inject } from 'inversify';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
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

  private accountRepository: AccountRepository;

  private accountConfigRepository: AccountConfigRepository;

  private deckConfigRepository: DeckConfigRepository;

  private trainingTasks = new Map<number, TrainingTask>();

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.accountConfigRepository = connection.getCustomRepository(AccountConfigRepository);
    this.deckConfigRepository = connection.getCustomRepository(DeckConfigRepository);
  }

  trainingSample = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccountsByStatus('TRAINING');
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        const deckConfig = await this.deckConfigRepository.findOne(login);
        const favoriteCardIds = deckConfig?.favoriteCardIds?.split(',') ?? [];
        if (favoriteCardIds.length === 0) {
          this.logger.warn('No favorite cards found for %s.', login);
          return;
        }

        await asyncForEach(favoriteCardIds, async (cardId: string) => {
          const cardInfo = await this.getCardInfo(parseInt(cardId, 10), login);
          let training: Training | undefined;
          if (cardInfo.propertyCode === 0) {
            training = 'fire';
            if (cardInfo.fire === 20) {
              training = 'earth';
              if (cardInfo.earth === 20) {
                training = 'wind';
                if (cardInfo.wind === 20) {
                  training = 'sky';
                }
              }
            }
          } else if (cardInfo.propertyCode === 3) {
            training = 'water';
            if (cardInfo.water === 20) {
              training = 'sky';
              if (cardInfo.sky === 20) {
                training = 'earth';
                if (cardInfo.earth === 20) {
                  training = 'wind';
                }
              }
            }
          }
          if (training) {
            await this.start(login, cardInfo.id, training);
          }
        });
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
        const deckConfig = await this.deckConfigRepository.findOne(login);
        const favoriteCardIds = deckConfig?.favoriteCardIds?.split(',') ?? [];
        if (favoriteCardIds.length === 0) {
          this.logger.warn('No favorite cards found for %s.', login);
          return;
        }

        await asyncForEach(favoriteCardIds, async (cardId: string) => {
          const cardInfo = await this.getCardInfo(parseInt(cardId, 10), login);
          if (cardInfo.refineCurrent < cardInfo.refineMax) {
            training = true;
          }
        });

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
      inAction: page('.card').attr('class')?.includes('is-action'),
      propertyCode: regexUtils.catchByRegex(
        page('.card-property').attr('src'),
        /(?<=elements_0)[0-9]/,
        'integer'
      ) as number
    };
  };

  cancelSample = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        this.logger.info('Start cancel training for %s.', login);
        let page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
        const commandInfos = page('.sp_village_command_info');
        await commandInfos.each(async (index) => {
          const commandInfo = commandInfos.eq(index);
          if (commandInfo.html()?.includes(he.encode('修練'))) {
            const url = commandInfo.find('a').first().attr('href');
            if (url) {
              page = await makeMobileRequest(url, login, false);
              const form = page('#main form');
              if (form.length > 0) {
                await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
                this.logger.info('Cancel training succeed for %s.', login);
              } else {
                this.logger.error('Unable to find cancel form for %s.', login);
              }
            } else {
              this.logger.error('Unable to find cancel url for %s.', login);
            }
          }
        });
      },
      10
    );
  };
}
