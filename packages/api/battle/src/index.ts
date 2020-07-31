import { NobotApp } from '@nobot-core/commons';
// import BattleService from './battle-service';
// import { scheduleJob } from 'node-schedule';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_battle', __dirname);
  await nobotApp.start();
  // const battleService = nobotApp.getContainer().get(BattleService);
  // battleService.start('zz0001');
})();
