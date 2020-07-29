import { makeMobileRequest, makePostMobileRequest, NOBOT_MOBILE_URL, Service } from '@nobot-core/commons';
import { getLogger } from 'log4js';
import querystring from 'querystring';
import { AuctionSearchObject } from '../types';

@Service()
export default class AuctionSearchService {
  private logger = getLogger(AuctionSearchService.name);

  changeSearchSet = async (login: string, setId: number, creteria: Partial<AuctionSearchObject>): Promise<void> => {
    this.logger.info('Change trade search set %d for %s', setId, login);
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.TRADE_BUY, login);
    const selects = page('#search-form select');
    const inputs = page('#search-form input[type=text]');
    const checkboxes = page('#search-form input[type=checkbox]');
    let textValue = '';
    if (creteria.textSearch === 2) {
      textValue = creteria.effect || '';
    } else if (creteria.textSearch === 1) {
      textValue = creteria.skill || '';
    } else {
      textValue = creteria.name || '';
    }
    const searchObject = {
      // eslint-disable-next-line @typescript-eslint/camelcase
      set_id: setId,
      [selects[0].attribs.name]: creteria.rarity || 0,
      [selects[1].attribs.name]: creteria.property || 0,
      [selects[2].attribs.name]: creteria.cost || 0,
      [selects[3].attribs.name]: creteria.star || -1,
      [selects[4].attribs.name]: creteria.job || -1,
      [selects[5].attribs.name]: creteria.military || 0,
      [selects[6].attribs.name]: creteria.textSearch || 0,
      [selects[7].attribs.name]: creteria.sortKey || 0,
      [selects[8].attribs.name]: creteria.sortOrder || 0,
      [inputs[0].attribs.name]: textValue || '',
      [inputs[1].attribs.name]: creteria.minNp || 0,
      [inputs[2].attribs.name]: creteria.maxNp || 9999999,
      [inputs[3].attribs.name]: creteria.minDeed || 0,
      [inputs[4].attribs.name]: creteria.maxDeed || 255,
      [checkboxes[0].attribs.name]: creteria.checkMerge || 0,
      [checkboxes[1].attribs.name]: creteria.checkNewCard || 0
    };
    await makePostMobileRequest(NOBOT_MOBILE_URL.CHANGE_TRADE_SEARCH_SET, login, querystring.stringify(searchObject));
  };
}
