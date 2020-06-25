import initConnection from '@nobot-core/database';
import bodyParser from 'body-parser';
import express from 'express';
import glob from 'glob';
import { Container } from 'inversify';
import { configure, getLogger, Logger } from 'log4js';
import { Connection } from 'typeorm';
import loadProjectConfig from './config-loader';
import { RouteDefinition } from './decorators';
import METADATA_KEY from './decorators/metadata-key';
import redisClient from './redis-client';

export default class NobotApp {
  private logger: Logger;

  private name: string;

  private scanDir: string;

  constructor(name: string, scanDir: string) {
    this.name = name;
    this.scanDir = scanDir;
    this.logger = getLogger(this.name);
  }

  start = async (): Promise<void> => {
    // configure log4js
    configure({
      appenders: {
        out: { type: 'stdout' }
      },
      categories: { default: { appenders: ['out'], level: 'info' } },
      disableClustering: true
    });

    const { redis, database } = loadProjectConfig(this.name);

    this.logger.info('init redis.');
    redisClient.start({
      ...redis,
      // eslint-disable-next-line @typescript-eslint/camelcase
      retry_strategy: (options) => {
        this.logger.info('Retrying.');
        if (options.attempt > 5) {
          throw new Error('Retry attempts reached.');
        }
        return 5000;
      }
    });

    this.logger.info('init postgres.');
    const connection = await initConnection(database);

    const container = new Container();
    container.bind<Connection>(Connection).toConstantValue(connection);

    const app = express();
    app.use(bodyParser.json());

    const files = glob
      .sync('{*.@(js|ts),**/*.@(js|ts)}', { cwd: this.scanDir })
      .filter((filename) => !filename.endsWith('d.ts'))
      .map((filename) => `${this.scanDir}/${filename}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controllers: any[] = [];

    files.forEach((file) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
      const modules = require(file);
      Object.keys(modules).forEach((key) => {
        const m = modules[key];

        if (Reflect.hasMetadata(METADATA_KEY.AUTOWIRED, m)) {
          container.bind(m).toSelf().inSingletonScope();

          if (Reflect.hasMetadata(METADATA_KEY.BASE_PATH, m) && Reflect.hasMetadata(METADATA_KEY.ROUTES, m)) {
            controllers.push(m);
          }
        }
      });
    });

    controllers.forEach((controller) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance: any = container.get(controller);
      const basePath = Reflect.getMetadata(METADATA_KEY.BASE_PATH, controller);
      const routes: Array<RouteDefinition> = Reflect.getMetadata(METADATA_KEY.ROUTES, controller);
      routes.forEach((route) => {
        app[route.httpMethod](basePath + route.path, (req, res) => {
          instance[route.methodName](req, res);
        });
      });
    });

    app.listen(3000, () => {
      this.logger.info('%s started at port 3000', this.name);
    });
  };
}
