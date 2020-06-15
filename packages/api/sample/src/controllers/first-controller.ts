import { Controller, HttpMethod, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import FirstService from '../services/first-service';
import SecondService from '../services/second-service';

@Controller('/first')
export default class FirstController {
  @inject(FirstService) private firstService: FirstService;

  @inject(SecondService) private secondService: SecondService;

  @RequestMapping('/')
  async first(req: Request, res: Response): Promise<Response> {
    await this.firstService.first();
    return res.send('first');
  }

  @RequestMapping('/abc', [HttpMethod.GET, HttpMethod.POST])
  async second(req: Request, res: Response): Promise<Response> {
    await this.secondService.second();
    return res.send('second');
  }
}
