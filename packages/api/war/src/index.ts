import { NobotApp } from '@nobot-core/commons';
import WarService from './war-service';
// import WarConfigService from './war-config-service';
// import { scheduleJob } from 'node-schedule';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_war', __dirname);
  await nobotApp.start();
  const warService = nobotApp.getContainer().get(WarService);
  // warService.checkWar();
  warService.checkWarByLogin('zz0001');
  // warService.goToWarFieldByGroup('BASIC', 103);
  // warService.chooseWarHostByGroup('BASIC', 7);
  // const warConfigService = nobotApp.getContainer().get(WarConfigService);
  // warConfigService.initializeWarConfigs();
})();
