import { makeRequest, NOBOT_URL, Service } from '@nobot-core/commons';
import { AccountCard, Card, SellState, SellStateRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection, Repository } from 'typeorm';

@Service()
export default class SellService {
  private logger = getLogger(SellService.name);

  private accountCardRepository: Repository<AccountCard>;

  private cardRepository: Repository<Card>;

  private sellStateRepository: SellStateRepository;

  constructor(connection: Connection) {
    this.accountCardRepository = connection.getRepository<AccountCard>('AccountCard');
    this.cardRepository = connection.getRepository<Card>('Card');
    this.sellStateRepository = connection.getCustomRepository(SellStateRepository);
  }

  public sell = async (login: string, cardId: number, sellPrice: number): Promise<void> => {
    const postData = `mode=1&card-id=${cardId}&trade-id=&form_name=form&point=${sellPrice}&term=3&handle=1`;
    await makeRequest(NOBOT_URL.TRADE_SELL, 'POST', login, postData);
    this.logger.info('Card %d posted for %d by %s.', cardId, sellPrice, login);
    // track sell state
    const accountCard = await this.accountCardRepository.findOne(cardId, { relations: ['card'] });
    if (accountCard) {
      const sellState = await this.sellStateRepository.findOne({ accountCard: { id: cardId } });
      if (sellState) {
        this.logger.info('Update sell state for %d: %s', cardId, accountCard.card.name);
        sellState.price = sellPrice;
        sellState.status = 'SELLING';
        sellState.postDate = new Date();
        this.sellStateRepository.save(sellState);
      } else {
        this.logger.info('Create sell state for %d: %s', cardId, accountCard.card.name);
        this.sellStateRepository.save({
          accountCard: { id: cardId },
          status: 'SELLING',
          price: sellPrice,
          postDate: new Date()
        });
      }
    } else {
      this.logger.error('Account card %d not found.', cardId);
    }
  };

  public getSellStates = (
    page?: number,
    size?: number,
    sort?: string,
    order?: 'ASC' | 'DESC',
    filters?: Partial<SellState>
  ): Promise<[SellState[], number]> => {
    return this.sellStateRepository.findAll(page, size, sort, order, filters);
  };

  public checkSellStates = async (): Promise<void> => {
    this.logger.info('Check sell states.');
    const cards = await this.sellStateRepository.getSellingCards();
    // group by login first
    cards
      .reduce((acc: Map<string, SellState[]>, card: SellState) => {
        if (card.accountCard) {
          const { login } = card.accountCard.account;
          if (acc.has(login)) {
            acc.set(login, [...(acc.get(login) as SellState[]), card]);
          } else {
            acc.set(login, [card]);
          }
        }
        return acc;
      }, new Map<string, SellState[]>())
      .forEach(async (states, login) => {
        const page = (await makeRequest(NOBOT_URL.VILLAGE, 'GET', login)) as CheerioStatic;
        states.forEach(async (state) => {
          const accountCard = state.accountCard as AccountCard;
          const cardElement = page(`.face-card-id${accountCard.id}`);
          if (cardElement.length > 0) {
            if (cardElement.attr('class')?.split(' ').includes('trade')) {
              this.logger.info('Card %s of %s is still selling.', accountCard.card.name, login);
            } else {
              this.logger.info('Card %s of %s is not selling any more, re post.', accountCard.card.name, login);
              await this.sell(login, accountCard.id, state.price);
            }
          } else {
            this.logger.info('Card %s of %s is not found, maybe already sold.', accountCard.card.name, login);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { account, ...rest } = accountCard;
            await this.sellStateRepository.update(state.id, {
              status: 'SOLD',
              sellDate: new Date(),
              accountCard: null,
              archivedData: rest
            });
          }
        });
      });
  };
}
