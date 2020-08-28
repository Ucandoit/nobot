import { makePostMobileRequest, NOBOT_MOBILE_URL, Service } from '@nobot-core/commons';
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
  ): Promise<void> => {
    this.logger.info('Sell stored card %s for %s, price: %d.', fileId, login, price);
    await makePostMobileRequest(
      NOBOT_MOBILE_URL.TRADE_SELL,
      login,
      `point=${price}&term=${term}&handle=1&action=1&card_id=-1&fileid=${fileId}&cardindex=${cardIndex}`
    );
  };
}
