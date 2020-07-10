import { HttpStatus } from '../web';
import HttpException from './http-exception';

export default class NotFoundException extends HttpException {
  constructor(message?: string) {
    super(HttpStatus.NOT_FOUND, message);
  }
}
