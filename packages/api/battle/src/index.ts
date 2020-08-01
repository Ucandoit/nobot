import { NobotApp } from '@nobot-core/commons';
import { scheduleJob } from 'node-schedule';
import BattleService from './battle-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_battle', __dirname);
  await nobotApp.start();
  const battleService = nobotApp.getContainer().get(BattleService);
  scheduleJob('0 10 15 * * *', battleService.checkBattleStatus);
})();
