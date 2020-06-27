import { NobotApp } from '@nobot-core/commons';
import { scheduleJob } from 'node-schedule';
import LoginService from './login/login-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_action', __dirname);
  await nobotApp.start();
  const loginService = nobotApp.getContainer().get(LoginService);
  scheduleJob('0 5 15 * * *', loginService.dailyLoginAll);
})();
