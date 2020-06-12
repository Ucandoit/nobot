import { loadProjectConfig, redisClient } from '@nobot-core/commons';
import initConnection from '@nobot-core/database';
import express from 'express';
import { Container } from 'inversify';
import { configure, getLogger } from 'log4js';
import 'reflect-metadata';
import TotoController from './ctl';
import { RouteDefinition } from './decorator';
import Titi from './titi';
// import startApp from './app';

configure({
  appenders: {
    out: { type: 'stdout' }
  },
  categories: { default: { appenders: ['out'], level: 'info' } },
  disableClustering: true
});

const logger = getLogger('card-index');

const { redis, database } = loadProjectConfig('api_card');

redisClient.start({
  ...redis,
  // eslint-disable-next-line @typescript-eslint/camelcase
  retry_strategy: (options) => {
    logger.info('Retrying.');
    if (options.attempt > 5) {
      throw new Error('Retry attempts reached.');
    }
    return 5000;
  }
});

initConnection(database).then(async (connection) => {
  logger.info('init postgres.');
  // startApp();
  const container = new Container();
  container.bind<TotoController>(TotoController).toSelf();
  container.bind<Titi>(Titi).toSelf();
  // container.bind<Connection>(Connection).toConstantValue(connection);

  // const toto = container.get<Toto>(Toto);
  // console.log(toto.titi.name);
  // console.log(await toto.find());

  const app = express();

  app.get('/', (req: express.Request, res: express.Response) => {
    res.send('Hello there!');
  });

  // Iterate over all our controllers and register our routes
  [TotoController].forEach((controller) => {
    // This is our instantiated class
    // eslint-disable-next-line new-cap
    // const instance = new controller();
    const instance = container.get(controller);
    // The prefix saved to our controller
    const prefix = Reflect.getMetadata('prefix', controller);
    // Our `routes` array containing all our routes for this controller
    const routes: Array<RouteDefinition> = Reflect.getMetadata('routes', controller);

    // Iterate over all routes and register them to our express application
    routes.forEach((route) => {
      // It would be a good idea at this point to substitute the `app[route.requestMethod]` with a `switch/case` statement
      // since we can't be sure about the availability of methods on our `app` object. But for the sake of simplicity
      // this should be enough for now.
      app[route.requestMethod](prefix + route.path, (req: express.Request, res: express.Response) => {
        // Execute our method for this path and pass our express request and response object.
        (instance as any)[route.methodName](req, res);
      });
    });
  });

  app.listen(3000, () => {
    console.log('Started express on port 3000');
  });
});
