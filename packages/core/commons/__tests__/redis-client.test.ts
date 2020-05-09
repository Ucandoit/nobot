import redisClient from '../src/redis-client';

beforeAll(() => {
  redisClient.start();
  redisClient.set('test1', '1');
  redisClient.set('test2', '2');
});

afterAll(() => {
  redisClient.disconnect();
});

test('redis get', async () => {
  const val = await redisClient.get('test1');
  expect(val).toMatchSnapshot();
});
