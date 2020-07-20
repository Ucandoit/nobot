import { makePostMobileRequest, NOBOT_MOBILE_URL, Service } from '@nobot-core/commons';
import { getLogger } from 'log4js';

@Service()
export default class QuestService {
  private logger = getLogger(QuestService.name);

  completeQuest = async (login: string, questId: number): Promise<void> => {
    this.logger.info('Complete quest %d for %s.', questId, login);
    await makePostMobileRequest(`${NOBOT_MOBILE_URL.QUEST}?contract=${questId}`, login, '');
    await makePostMobileRequest(`${NOBOT_MOBILE_URL.QUEST}?complete=${questId}`, login, '');
  };

  cancelQuest = async (login: string, questId: number): Promise<void> => {
    this.logger.info('Cancel quest %d for %s.', questId, login);
    await makePostMobileRequest(`${NOBOT_MOBILE_URL.QUEST}?cancel=${questId}`, login, '');
  };
}
