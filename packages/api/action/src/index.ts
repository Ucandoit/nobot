import { NobotApp } from '@nobot-core/commons';
import { scheduleJob } from 'node-schedule';
// import BuildingService from './building/building-service';
import LoginService from './login/login-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_action', __dirname);
  await nobotApp.start();
  // const buildingService = nobotApp.getContainer().get(BuildingService);
  // buildingService.start('zz0001');
  const loginService = nobotApp.getContainer().get(LoginService);
  scheduleJob('0 1 15 * * *', loginService.dailyLoginAll);
})();
