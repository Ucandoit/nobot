import { makePostMobileRequest, NOBOT_MOBILE_URL, regexUtils, Service } from '@nobot-core/commons';
import { getLogger } from 'log4js';

@Service()
export default class SellService {
  private logger = getLogger(SellService.name);

  public sellStoredCard = async (
    login: string,
    fileId: string,
    cardIndex: string,
    price: number,
    term = 2
  ): Promise<string> => {
    this.logger.info('Sell stored card %s for %s, price: %d.', fileId, login, price);
    const page = await makePostMobileRequest(
      NOBOT_MOBILE_URL.TRADE_SELL,
      login,
      `point=${price}&term=${term}&handle=1&action=1&card_id=-1&fileid=${fileId}&cardindex=${cardIndex}`
    );
    const url = decodeURIComponent(page('a[href*=trade_id]').attr('href') as string);
    if (url) {
      return regexUtils.catchByRegex(url, /(?<=trade_id=)[0-9]+/) as string;
    }
    throw new Error('Unable to get trade id.');
  };
}
