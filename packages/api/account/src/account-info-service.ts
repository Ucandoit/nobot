import { makeRequest, NOBOT_URL, regexUtils, Service } from '@nobot-core/commons';
import { getLogger } from 'log4js';

@Service()
export default class AccountInfoService {
  private logger = getLogger(AccountInfoService.name);

  getReserveCards = async (login: string): Promise<CardInfo[]> => {
    this.logger.info('Get reserve cards for %s.', login);
    const page = (await makeRequest(NOBOT_URL.VILLAGE, 'GET', login)) as CheerioStatic;
    const cards = page('.reserve-rect');
    if (cards.length > 0) {
      return cards
        .map(
          (index): CardInfo => {
            const card = cards.eq(index);
            const face = card.find('.card-face');
            const faceClass = face.attr('class');
            const faceClasses = faceClass?.split(' ');
            const id = regexUtils.catchByRegex(faceClass, /(?<=face-card-id)[0-9]+/) as string | null;
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
