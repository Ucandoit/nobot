import redis from 'redis';

const redisClient = redis.createClient({
  host: 'nobot-redis',
  port: 6379,
  // eslint-disable-next-line @typescript-eslint/camelcase
  retry_strategy: (options) => {
    console.log('Retrying.');
    if (options.attempt > 5) {
      throw new Error('Retry attempts reached.');
    }
    return 5000;
  }
});
console.log('Setting.');
redisClient.set('test', '1');
