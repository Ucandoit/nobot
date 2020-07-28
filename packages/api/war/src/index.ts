import { NobotApp } from '@nobot-core/commons';
// import WarConfigService from './war-config-service';
import { scheduleJob } from 'node-schedule';
import WarService from './war-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_war', __dirname);
  await nobotApp.start();
  const warService = nobotApp.getContainer().get(WarService);
  scheduleJob('0 0 5 * * *', warService.stopAll);
  // warService.start('zz0003');
  // warService.startAll();
  // warService.test();
  // warService.checkWar();
  // warService.checkWarByLogin('zz0001');
  // warService.startWar('zz0001');
  // warService.convertFood('zz0001');
  // warService.goToWarFieldByGroup('BASIC', 103);
  // warService.chooseWarHostByGroup('BASIC', 7);
  // const warConfigService = nobotApp.getContainer().get(WarConfigService);
  // warConfigService.initializeWarConfigs();
  // warConfigService.setLineByGroup(2, 'BASIC');
})();
