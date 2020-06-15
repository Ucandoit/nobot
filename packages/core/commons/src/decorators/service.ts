import { injectable } from 'inversify';
import METADATA_KEY from './metadata-key';

const Service = (): ClassDecorator => {
  return (target): void => {
    Reflect.defineMetadata(METADATA_KEY.AUTOWIRED, true, target);
    injectable()(target);
  };
};

export default Service;
