/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { Controller, Get } from './decorator';
import Titi from './titi';

@Controller('/abc')
export default class TotoController {
  @inject(Titi)
  titi: Titi;

  @Get('/')
  public index(req: Request, res: Response) {
    console.log(this.titi);
    return res.send('User overview');
  }

  @Get('/:name')
  public details(req: Request, res: Response) {
    return res.send(`You are looking at the profile of ${req.params.name}`);
  }
}
