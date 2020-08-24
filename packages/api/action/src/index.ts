import { NobotApp } from '@nobot-core/commons';
// import VillageService from './village/village-service';
import { scheduleJob } from 'node-schedule';
import AccountService from './account/account-service';
import BuildingService from './building/building-service';
// import ManageCardService from './card/manage-card-service';
import TrainingService from './training/training-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_action', __dirname);
  await nobotApp.start();
  const buildingService = nobotApp.getContainer().get(BuildingService);
  // buildingService.startAll();
  const accountService = nobotApp.getContainer().get(AccountService);
  const trainingService = nobotApp.getContainer().get(TrainingService);
  scheduleJob('0 5 15 * * *', accountService.dailyLoginAll);
  scheduleJob('0 10 15 * * *', buildingService.checkNeedBuilding);
  scheduleJob('0 15 15 * * *', trainingService.checkNeedTraining);
  // const manageCardService = nobotApp.getContainer().get(ManageCardService);
  // manageCardService.moveSampleCard();
  // manageCardService.manageSampleDeck();
  // const villageService = nobotApp.getContainer().get(VillageService);
  // console.log(await villageService.getVillage('zz0001'));
  // trainingService.training('xzdykerik_04', 36635786, 'earth', 20);
  // trainingService.start('xzdykerik_04', 44832577, 'sky', 9);
})();
