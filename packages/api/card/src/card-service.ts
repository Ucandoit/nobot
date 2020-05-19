import { makeRequest, NOBOT_URL, tokenManager } from '@nobot-core/commons';
import { StoreCard } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { getConnection } from 'typeorm';

class CardService {
  private logger = getLogger(CardService.name);

  scanStoredCards = async (login: string): Promise<void> => {
    const token = await tokenManager.getToken(login);
    const pages = 1;
    const currentPage = (await makeRequest(
      `${NOBOT_URL.MANAGE_STORED_CARDS}&pages=${pages}`,
      'GET',
      token
    )) as CheerioStatic;
    const cardElements = currentPage('.card');
    if (cardElements.length > 0) {
      cardElements.each(async (index) => {
        const cardElement = cardElements.eq(index);
        const idMatch = cardElement.attr('class')?.match(/(?<=card card-id)[0-9]+$/g);
        if (idMatch) {
          const cardId = parseInt(idMatch[0], 10);
          // const card = await getConnection().getRepository<Card>('Card').find({ id: cardId });
          this.logger.info(cardId);
          const repository = getConnection().getRepository<StoreCard>('StoreCard');
          const storeCard = await repository.findOne({ login, id: cardId });
          if (storeCard) {
            this.logger.info(storeCard);
          } else {
            await repository.save({ login, id: cardId, count: 1 });
          }
        }
      });
    }
  };

  tradeNp = async (source: string, target: string): Promise<void> => {
    this.logger.info('trade np from %s to %s.', source, target);
    const np = await this.getNp(source);
    const token = await tokenManager.getToken(target);
    let page = (await makeRequest(
      `${NOBOT_URL.MANAGE_STORED_CARDS}&pages=1&limit_rank=1&sell_card=1`,
      'GET',
      token
    )) as CheerioStatic;
    const card = page('.card');
    const cardId = this.catchByRegex(card.attr('class'), /(?<=card card-id)[0-9]+$/g);
    const fileId = this.catchByRegex(card.parent().find('.sell-button').attr('class'), /(?<=file-id)[0-9]+(?= )/);
    const postData = `mode=1&card-id=${cardId}&trade-id=&limit_rank=1&storage-card=${cardId}&fileid=${fileId}&form_name=form&point=${np}&term=1&handle=1`;
    await makeRequest(NOBOT_URL.TRADE_SELL, 'POST', token, postData);
    this.logger.info('card posted for %d.', np);
    page = (await makeRequest(NOBOT_URL.TRADE_SELL, 'GET', token)) as CheerioStatic;
    const sellList = page('div[id^=sell-list]');
    let tradeId = null;
    for (let i = 0; i < sellList.length; i++) {
      const sellCard = sellList.eq(i);
      if (sellCard.children().eq(2).children().eq(0).text() === np.toString()) {
        tradeId = this.catchByRegex(sellCard.attr('class'), /(?<=trade-sell-id)[0-9]+(?= )/);
      }
    }
    if (tradeId) {
      await this.buyCard(source, tradeId);
      this.logger.info('card bought.');
    }
  };

  getNp = async (login: string): Promise<number> => {
    const token = await tokenManager.getToken(login);
    const page = (await makeRequest(NOBOT_URL.VILLAGE, 'GET', token)) as CheerioStatic;
    return parseInt(page('#lottery_point').text(), 10);
  };

  buyCard = async (login: string, tradeId: string): Promise<void> => {
    const token = await tokenManager.getToken(login);
    const searchUrl = (await makeRequest(NOBOT_URL.TRADE_BUY, 'GET', token)) as string;
    const page = (await makeRequest(searchUrl, 'GET', token)) as CheerioStatic;
    const buyForm = page('#form');
    const requestParams = buyForm.serialize().replace(/(?<=&trade-id=)[0-9]+(?=&)/, tradeId);
    await makeRequest(NOBOT_URL.TRADE_BUY, 'POST', token, requestParams);
  };

  catchByRegex = (str = '', regex: RegExp): string | null => {
    const matcher = str.match(regex);
    if (matcher) {
      return matcher[0];
    }
    return null;
  };
}

export default new CardService();
