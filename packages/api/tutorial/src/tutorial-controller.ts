import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import TutorialService from './tutorial-service';

@Controller('/tutorial')
export default class TutorialController {
  @inject(TutorialService) tutorialService: TutorialService;

  @RequestMapping('/start/:login')
  async start(req: Request, res: Response): Promise<void> {
    this.tutorialService.start(req.params.login);
    res.status(200).send();
  }

  @RequestMapping('/post/:login')
  async postTutorial(req: Request, res: Response): Promise<void> {
    this.tutorialService.postTutorial(req.params.login);
    res.status(200).send();
  }
}
