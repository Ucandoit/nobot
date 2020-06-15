import { HttpMethod } from '../web';
import METADATA_KEY from './metadata-key';

export interface RouteDefinition {
  path: string;
  httpMethod: HttpMethod;
  methodName: string;
}

const RequestMapping = (path: string, methods = [HttpMethod.GET]): MethodDecorator => {
  return (target, propertyKey: string | symbol): void => {
    if (!Reflect.hasMetadata(METADATA_KEY.ROUTES, target.constructor)) {
      Reflect.defineMetadata(METADATA_KEY.ROUTES, [], target.constructor);
    }

    const routes = Reflect.getMetadata(METADATA_KEY.ROUTES, target.constructor) as Array<RouteDefinition>;
    methods.forEach((method) => {
      routes.push({
        path,
        httpMethod: method,
        methodName: propertyKey as string
      });
    });
    Reflect.defineMetadata('routes', routes, target.constructor);
  };
};

export default RequestMapping;
