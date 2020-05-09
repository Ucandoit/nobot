import { getLogger } from 'log4js';
import { ClientOpts, createClient, RedisClient as NodeRedisClient } from 'redis';

class RedisClient {
  private logger = getLogger(RedisClient.name);

  private redisClient: NodeRedisClient;

  start = (options?: ClientOpts): void => {
    this.logger.info('Create redis client.');
    this.redisClient = createClient(options);
  };

  disconnect = (): void => {
    this.redisClient.quit();
  };

  // {
  //   host: 'nobot-redis',
  //   port: 6379,
  //   // eslint-disable-next-line @typescript-eslint/camelcase
  //   retry_strategy: (options) => {
  //     this.logger.info('Retrying.');
  //     if (options.attempt > 5) {
  //       throw new Error('Retry attempts reached.');
  //     }
  //     return 5000;
  //   }
  // }

  get = (key: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.redisClient.get(key, (err, value) => {
        if (err) {
          reject(err);
        }
        resolve(value);
      });
    });
  };

  set = (key: string, value: string, seconds = 45 * 60): void => {
    this.redisClient.set(key, value);
    this.redisClient.expire(key, seconds);
  };
}

export default new RedisClient();
