import { NobotApp } from '@nobot-core/commons';
// import CardService from './card-service';
// import CardScanService from './scan/card-scan-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_card', __dirname);
  await nobotApp.start();
  // const cardService = nobotApp.getContainer().get(CardService);
  // cardService.getCardDetail2('1532', 'zz0001');
  // cardService.getCardBooks('1532', 'zz0001');
  // const cardScanService = nobotApp.getContainer().get(CardScanService);
  // cardScanService.scan();
  // cardScanService.checkCardBook(201, 'zz0001');
  // 1929, 1928, 1930, 1931, 1932, 1933, 1934, 1935
})();
