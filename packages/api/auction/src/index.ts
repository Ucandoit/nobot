import { NobotApp } from '@nobot-core/commons';
// import AuctionSearchService from './auction/auction-search-service';
import AuctionSnipingService from './sniping/auction-sniping-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_auction', __dirname);
  await nobotApp.start();
  // const auctionSearchService = nobotApp.getContainer().get(AuctionSearchService);
  // auctionSearchService.changeSearchSet('zz0001', 1, {
  //   rarity: 3,
  //   property: 1,
  //   cost: 5,
  //   textSearch: 0,
  //   name: 'a'
  // });
  const auctionSearchService = nobotApp.getContainer().get(AuctionSnipingService);
  auctionSearchService.startSniping('zz0001');
})();
