import { NobotApp } from '@nobot-core/commons';
// import AccountService from './account-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_account', __dirname);
  await nobotApp.start();
  // const accountService = nobotApp.getContainer().get(AccountService);
})();
