import { NobotApp } from '@nobot-core/commons';
// import { scheduleJob } from 'node-schedule';
// import AuctionSnipingService from './sniping/auction-sniping-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_auction', __dirname);
  await nobotApp.start();
  // const auctionSnipingService = nobotApp.getContainer().get(AuctionSnipingService);
  // scheduleJob('0 0 15 * * *', auctionSnipingService.dailyReset);
})();
