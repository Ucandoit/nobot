import auctionService from '../src/auction/auction-service';

const offsetSummer = -9;
const offsetWinter = -10;
const day = new Date(2020, 4, 9);
const lastDayOfMonth = new Date(2020, 4, 31);
const lastDayOfYear = new Date(2020, 11, 31);

test('calculates the right start time', () => {
  expect(auctionService.calculateStartTime(0, day, offsetSummer)).toEqual(new Date(2020, 4, 9, 15, 0, 0));
  expect(auctionService.calculateStartTime(3, day, offsetSummer)).toEqual(new Date(2020, 4, 9, 18, 0, 0));
  expect(auctionService.calculateStartTime(9, day, offsetSummer)).toEqual(new Date(2020, 4, 10, 0, 0, 0));
  expect(auctionService.calculateStartTime(9, day, offsetWinter)).toEqual(new Date(2020, 4, 9, 23, 0, 0));
  expect(auctionService.calculateStartTime(9, lastDayOfMonth, offsetSummer)).toEqual(new Date(2020, 5, 1, 0, 0, 0));
  expect(auctionService.calculateStartTime(9, lastDayOfYear, offsetSummer)).toEqual(new Date(2021, 0, 1, 0, 0, 0));
});
