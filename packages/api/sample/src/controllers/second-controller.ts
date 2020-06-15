import { Controller } from '@nobot-core/commons';
import { Request, Response } from 'express';

@Controller('/second')
export default class SecondController {
  // @Get('/')
  public index = (req: Request, res: Response): Response => {
    return res.send('User overview');
  };

  // @Get('/:name')
  public details = (req: Request, res: Response): Response => {
    return res.send(`You are looking at the profile of ${req.params.name}`);
  };
}
