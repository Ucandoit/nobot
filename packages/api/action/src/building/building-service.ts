import {
  executeConcurrent,
  getFinalPage,
  makePostMobileRequest,
  nobotUtils,
  NOBOT_MOBILE_URL,
  Service
} from '@nobot-core/commons';
import { AccountConfigRepository, AccountRepository } from '@nobot-core/database';
import he from 'he';
import { inject } from 'inversify';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm/connection/Connection';
import { MapArea, ResourceCost } from '../types';
import VillageService from '../village/village-service';
import buildConfig from './build-config';

interface BuildTarget {
  type: number;
  mapId: number;
  upgrade: boolean;
  facility: string;
  seconds: number;
}

interface BuildTask {
  start: boolean;
  interval?: NodeJS.Timeout;
}

interface BuildStatus {
  login: string;
  status: boolean;
}

@Service()
export default class BuildingService {
  private logger = getLogger(BuildingService.name);

  @inject(VillageService)
  private villageService: VillageService;

  private buildOrder: { facility: string; max: number }[] = [
    { facility: 'storage', max: 3 },
    { facility: 'food', max: 3 },
    { facility: 'paddy', max: 3 },
    { facility: 'market', max: 1 },
    { facility: 'fire', max: 1 },
    { facility: 'water', max: 1 },
    { facility: 'sky', max: 1 },
    { facility: 'earth', max: 1 },
    { facility: 'wind', max: 1 },
    { facility: 'home_basic', max: 1 }
  ];

  private accountRepository: AccountRepository;

  private accountConfigRepository: AccountConfigRepository;

  private buildTasks = new Map<string, BuildTask>();

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.accountConfigRepository = connection.getCustomRepository(AccountConfigRepository);
  }

  startAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccountsByStatus('BUILDING');
    await executeConcurrent(
      accounts.map((account) => account.login),
      this.start,
      10
    );
  };

  start = async (login: string): Promise<void> => {
    const task = this.buildTasks.get(login);
    if (task && task.start) {
      this.logger.info('Build task is already in progress for %s', login);
    } else {
      this.buildTasks.set(login, { start: true });
      this.logger.info('Start to build for %s', login);
      await this.startBuild(login);
    }
  };

  stop = (login: string): void => {
    this.logger.info('Stop build for %s', login);
    const task = this.buildTasks.get(login);
    if (task && task.interval) {
      clearInterval(task.interval);
    }
    this.buildTasks.delete(login);
  };

  status = (): BuildStatus[] => {
    const status: BuildStatus[] = [];
    this.buildTasks.forEach((buildTask, login) => {
      status.push({ login, status: buildTask.start });
    });
    return status;
  };

  checkNeedBuilding = async (): Promise<void> => {
    this.logger.info('Start checking accounts building status.');
    const accounts = await this.accountRepository.getMobileAccountsByStatus('BUILDING');
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        const page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
        const areas = this.villageService.getMapInfo(page);
        let building = false;
        for (let i = 0; i < this.buildOrder.length; i++) {
          const { facility, max } = this.buildOrder[i];
          const targetFacility = facility === 'home_basic' ? 'home_adv' : facility;
          const builtAreas = areas.filter((area) => area.building && area.building.facility === targetFacility);
          if (builtAreas.length < max || !this.isMaxLevel(builtAreas)) {
            building = true;
            break;
          }
        }
        if (!building) {
          this.logger.info('Account %s has finished building all.', login);
          await this.accountConfigRepository.update(login, { status: 'TRAINING' });
        }
      },
      10
    );
    this.logger.info('Finish checking accounts building status.');
    await this.startAll();
  };

  private startBuild = async (login: string): Promise<void> => {
    const page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
    const commandInfo = page('.sp_village_command_info');
    if (
      commandInfo.length > 0 &&
      (commandInfo.html()?.includes(he.encode('建設中')) || commandInfo.html()?.includes(he.encode('増築中')))
    ) {
      this.logger.info('Build action is still in progress for %s.', login);
      const seconds = nobotUtils.getSeconds(commandInfo.find('#cmd_00').text());
      this.logger.info('Wait %d seconds to complete for %s', seconds, login);
      const interval = setTimeout(() => {
        this.startBuild(login);
      }, seconds * 1000);
      const task = this.buildTasks.get(login) as BuildTask;
      this.buildTasks.set(login, {
        ...task,
        interval
      });
    } else {
      const areas = this.villageService.getMapInfo(page);
      const elementInfo = this.villageService.getResourceInfo(page);
      const newUser = page('#new-player-button').length > 0;
      // find the facility to build by order
      this.logger.info('Trying to find build target for %s.', login);
      let buildTarget: BuildTarget | undefined;
      for (let i = 0; i < this.buildOrder.length; i++) {
        const { facility, max } = this.buildOrder[i];
        let targetFacility = facility;
        let area: MapArea | undefined;
        const nb = areas.reduce(
          (count: number, a: MapArea) => (a.building && a.building.facility === facility ? count + 1 : count),
          0
        );
        if (nb < max && facility !== 'home_basic') {
          // get empty area to construct
          area = areas.find((a) => a.building && a.building.facility === 'free');
        } else {
          // get lowest area to upgrade
          area = areas
            .filter((a) => a.building && a.building.facility === facility)
            .reduce((prev: MapArea | undefined, a: MapArea) => {
              if (a.level < 9 && !a.constructing && (!prev || a.level < prev.level)) {
                return a;
              }
              return prev;
            }, undefined);
          // special case for home building
          if (area === undefined && facility === 'home_basic') {
            area = areas.find(
              (a) =>
                !a.constructing &&
                a.building &&
                ((a.building.facility === 'home_basic' && a.level === 9) ||
                  (a.building.facility === 'home_adv' && a.level < 9))
            );
            targetFacility = 'home_adv';
          }
        }
        if (area) {
          const buildCost = buildConfig
            .getBuildCostMap()
            .get(targetFacility)
            ?.get(area.level < 9 ? area.level : 0) as ResourceCost;
          if (this.villageService.costEnough(buildCost, elementInfo)) {
            const type = buildConfig.getBuildingList().find((b) => b.facility === targetFacility)?.type as string;
            buildTarget = {
              type: parseInt(type.replace('type', ''), 10),
              mapId: parseInt(area.mapId.replace('map', ''), 10),
              upgrade: area.level !== 0,
              facility: targetFacility,
              seconds: newUser ? buildCost.reducedSeconds : buildCost.seconds
            };
            break;
          }
        }
      }

      if (buildTarget) {
        const { type, mapId, upgrade, facility, seconds } = buildTarget;
        this.logger.info('%s %s for %s', upgrade ? 'upgrade' : 'build', facility, login);
        await makePostMobileRequest(
          NOBOT_MOBILE_URL.BUILDING_RESULT,
          login,
          `id=${mapId}&pt=${upgrade ? 1 : 0}&type=${type}`
        );
        this.logger.info('Wait %d seconds to complete for %s', seconds, login);
        const interval = setTimeout(() => {
          this.startBuild(login);
        }, seconds * 1000);
        const task = this.buildTasks.get(login) as BuildTask;
        this.buildTasks.set(login, {
          ...task,
          interval
        });
      } else {
        this.logger.info('Nothing to build for %s.', login);
        const task = this.buildTasks.get(login) as BuildTask;
        this.buildTasks.set(login, {
          ...task,
          start: false
        });
      }
    }
  };

  private isMaxLevel = (areas: MapArea[]): boolean => {
    let maxLevel = true;
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      if (area.level < 9) {
        maxLevel = false;
        break;
      }
    }
    return maxLevel;
  };
}
