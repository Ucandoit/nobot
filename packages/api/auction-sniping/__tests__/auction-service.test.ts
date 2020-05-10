import auctionService from '../src/auction/auction-service';

const offsetSummer = -9;
const offsetWinter = -10;
const day = new Date(2020, 4, 9);
const lastDayOfMonth = new Date(2020, 4, 31);
const lastDayOfYear = new Date(2020, 11, 31);

const getEndTime = (startTime: Date): Date => {
  return new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
};

test('calculates the right start time', () => {
  let startTime = auctionService.calculateStartTime(0, day, offsetSummer);
  let endTime = getEndTime(startTime);
  expect(startTime).toEqual(new Date(2020, 4, 9, 15, 0, 0));
  expect(endTime).toEqual(new Date(2020, 4, 9, 18, 0, 0));
  startTime = auctionService.calculateStartTime(3, day, offsetSummer);
  endTime = getEndTime(startTime);
  expect(startTime).toEqual(new Date(2020, 4, 9, 18, 0, 0));
  expect(endTime).toEqual(new Date(2020, 4, 9, 21, 0, 0));
  startTime = auctionService.calculateStartTime(9, day, offsetSummer);
  endTime = getEndTime(startTime);
  expect(startTime).toEqual(new Date(2020, 4, 10, 0, 0, 0));
  expect(endTime).toEqual(new Date(2020, 4, 10, 3, 0, 0));
  startTime = auctionService.calculateStartTime(9, day, offsetWinter);
  endTime = getEndTime(startTime);
  expect(startTime).toEqual(new Date(2020, 4, 9, 23, 0, 0));
  expect(endTime).toEqual(new Date(2020, 4, 10, 2, 0, 0));
  startTime = auctionService.calculateStartTime(9, lastDayOfMonth, offsetSummer);
  endTime = getEndTime(startTime);
  expect(startTime).toEqual(new Date(2020, 5, 1, 0, 0, 0));
  expect(endTime).toEqual(new Date(2020, 5, 1, 3, 0, 0));
  startTime = auctionService.calculateStartTime(9, lastDayOfYear, offsetSummer);
  endTime = getEndTime(startTime);
  expect(startTime).toEqual(new Date(2021, 0, 1, 0, 0, 0));
  expect(endTime).toEqual(new Date(2021, 0, 1, 3, 0, 0));
});

test('get rarity from url', () => {
  let url = 'http://210.140.157.168/img/card/still/rare_01_1232271541.png?1232271541';
  expect(auctionService.getRarity(url)).toEqual('並');
  url = 'http://210.140.157.168/img/card/still/rare_02_2821664187.png?2821664187';
  expect(auctionService.getRarity(url)).toEqual('珍');
  url = 'http://210.140.157.168/img/card/still/rare_03_409352836.png?409352836';
  expect(auctionService.getRarity(url)).toEqual('稀');
  url = 'http://210.140.157.168/img/card/still/rare_04_3861726953.png?3861726953';
  expect(auctionService.getRarity(url)).toEqual('極');
  url = 'http://210.140.157.168/img/card/still/rare_05_2532355735.png?2532355735';
  expect(auctionService.getRarity(url)).toEqual('宝');
  url = 'http://210.140.157.168/img/card/still/rare_06_1520277021.png?1520277021';
  expect(auctionService.getRarity(url)).toEqual('誉');
  url = 'http://210.140.157.168/img/card/still/rare_07_408365073.png?408365073';
  expect(auctionService.getRarity(url)).toEqual('煌');
});

test('get star from url', () => {
  let url = 'http://210.140.157.168/img/card/still/rare_02_2821664187.png?2821664187';
  expect(auctionService.getStar(url)).toEqual(0);
  url = 'http://210.140.157.168/img/card/still/rare_02_star02_3590448156.png?3590448156';
  expect(auctionService.getStar(url)).toEqual(2);
});

test('replace trade-id in form data', () => {
  const formData = 'sort-type=2&pages=1&trade-id=0&card_id=0&catev=0';
  expect(auctionService.replaceTradeBuyId(formData, '12345')).toEqual(
    'sort-type=2&pages=1&trade-id=12345&card_id=0&catev=0'
  );
});
