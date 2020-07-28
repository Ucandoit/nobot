import { NobotApp } from '@nobot-core/commons';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_tutorial', __dirname);
  await nobotApp.start();
})();
