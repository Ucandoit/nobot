import { injectable } from 'inversify';

@injectable()
export default class Titi {
  name: string;

  constructor() {
    this.name = 'titi';
  }
}
