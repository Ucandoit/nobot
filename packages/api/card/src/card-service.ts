import { makeRequest, NOBOT_URL, tokenManager } from '@nobot-core/commons';
import { Card } from '@nobot-core/database';
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
          const card = await getConnection().getRepository<Card>('Card').find({ id: cardId });
          this.logger.info(card);
        }
      });
    }
  };
}

export default new CardService();
