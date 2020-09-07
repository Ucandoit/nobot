import { Controller, getQueryParamAsString, HttpStatus, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import StoryService from './story-service';

@Controller('/event/story')
export default class StoryController {
  @inject(StoryService) storyService: StoryService;

  @RequestMapping('/start/all')
  async startAll(req: Request, res: Response): Promise<void> {
    this.storyService.startAll();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/stop/all')
  async stopAll(req: Request, res: Response): Promise<void> {
    this.storyService.stopAll();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/start')
  async start(req: Request, res: Response): Promise<void> {
    const login = getQueryParamAsString(req, 'login');
    if (login) {
      this.storyService.start(login);
      res.status(HttpStatus.OK).send();
    } else {
      res.status(HttpStatus.BAD_REQUEST).send('login is required.');
    }
  }

  @RequestMapping('/stop')
  async stop(req: Request, res: Response): Promise<void> {
    const login = getQueryParamAsString(req, 'login');
    if (login) {
      this.storyService.stop(login);
      res.status(HttpStatus.OK).send();
    } else {
      res.status(HttpStatus.BAD_REQUEST).send('login is required.');
    }
  }

  @RequestMapping('/pause')
  async pause(req: Request, res: Response): Promise<void> {
    const login = getQueryParamAsString(req, 'login');
    if (login) {
      this.storyService.pause(login);
      res.status(HttpStatus.OK).send();
    } else {
      res.status(HttpStatus.BAD_REQUEST).send('login is required.');
    }
  }
}
