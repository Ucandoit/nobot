import { getLogger } from 'log4js';
import { tokenManager, makeRequest, NOBOT_URL, regexUtils } from '@nobot-core/commons';

class AccountInfoService {
  private logger = getLogger(AccountInfoService.name);

  getReserveCards = async (login: string): Promise<CardInfo[]> => {
    this.logger.info('Get reserve cards for %s.', login);
    const token = await tokenManager.getToken(login);
    const page = (await makeRequest(NOBOT_URL.VILLAGE, 'GET', token)) as CheerioStatic;
    const cards = page('.reserve-rect');
    if (cards.length > 0) {
      return cards
        .map(
          (index): CardInfo => {
            const card = cards.eq(index);
            const face = card.find('.card-face');
            const faceClass = face.attr('class');
            const faceClasses = faceClass?.split(' ');
            const id = regexUtils.catchByRegex(faceClass, /(?<=face-card-id)[0-9]+/);
            return {
              id: id || '',
              name: face.attr('title') || '',
              untradable: !!faceClasses?.includes('trade-limit'),
              protect: !!faceClasses?.includes('protected'),
              inAction: !!faceClasses?.includes('action'),
              trading: !!faceClasses?.includes('trade'),
              faceUrl: face.attr('src') || ''
            };
          }
        )
        .get();
    }
    return [];
  };
}

export default new AccountInfoService();
