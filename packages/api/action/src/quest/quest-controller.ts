import { Controller, getQueryParamAsInt, getQueryParamAsString, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import QuestService from './quest-service';

@Controller('/action/quest')
export default class QuestController {
  @inject(QuestService) questService: QuestService;

  @RequestMapping('/complete')
  async completeQuest(req: Request, res: Response): Promise<void> {
    const login = getQueryParamAsString(req, 'login') as string;
    const questId = getQueryParamAsInt(req, 'quest') as number;
    await this.questService.completeQuest(login, questId);
    res.status(200).send();
  }

  @RequestMapping('/cancel')
  async cancelQuest(req: Request, res: Response): Promise<void> {
    const login = getQueryParamAsString(req, 'login') as string;
    const questId = getQueryParamAsInt(req, 'quest') as number;
    await this.questService.cancelQuest(login, questId);
    res.status(200).send();
  }
}
