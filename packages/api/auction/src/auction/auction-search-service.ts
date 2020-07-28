import { makeMobileRequest, makePostMobileRequest, NOBOT_MOBILE_URL, Service } from '@nobot-core/commons';
import { getLogger } from 'log4js';
import { AuctionSearchObject } from '../types';

@Service()
export default class AuctionSearchService {
  private logger = getLogger(AuctionSearchService.name);

  changeSearchSet = async (login: string, setId: number, creteria: Partial<AuctionSearchObject>): Promise<void> => {
    this.logger.info('Change trade search set %d for %s', setId, login);
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.TRADE_BUY, login);
    // transform into search text
    await makePostMobileRequest(NOBOT_MOBILE_URL.CHANGE_TRADE_SEARCH_SET, login, ``);
  };
}
