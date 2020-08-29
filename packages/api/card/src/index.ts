import { NobotApp } from '@nobot-core/commons';
// import CardService from './card-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_card', __dirname);
  await nobotApp.start();
  // const cardService = nobotApp.getContainer().get(CardService);
})();
