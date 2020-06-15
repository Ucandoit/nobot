import { injectable } from 'inversify';
import METADATA_KEY from './metadata-key';

const Controller = (basePath = ''): ClassDecorator => {
  return (target): void => {
    Reflect.defineMetadata(METADATA_KEY.AUTOWIRED, true, target);
    Reflect.defineMetadata(METADATA_KEY.BASE_PATH, basePath, target);
    // Since routes are set by our methods this should almost never be true (except the controller has no methods)
    if (!Reflect.hasMetadata(METADATA_KEY.ROUTES, target)) {
      Reflect.defineMetadata(METADATA_KEY.ROUTES, [], target);
    }
    injectable()(target);
  };
};

export default Controller;
