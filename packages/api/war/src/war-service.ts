import {
  executeConcurrent,
  makeMobileRequest,
  makePostMobileRequest,
  NOBOT_MOBILE_URL,
  Service
} from '@nobot-core/commons';
import { AccountRepository, WarConfigRepository } from '@nobot-core/database';
import he from 'he';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';

@Service()
export default class WarService {
  private logger = getLogger(WarService.name);

  private accountRepository: AccountRepository;

  private warConfigRepository: WarConfigRepository;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.warConfigRepository = connection.getCustomRepository(WarConfigRepository);
  }

  test = async (): Promise<void> => {
    const login = 'zz0002';
    this.logger.info(login);
    // this.initWarParams();
    // this.checkWar(login);
  };

  initWarParams = async (): Promise<void> => {
    const account = await this.accountRepository.getLastMobileAccount();
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.AREA_MAP, account.login);
    const divs = page('#main > div');
    for (let i = 0; i < divs.length; i++) {
      const div = divs.eq(i);
      if (he.decode(div.html() as string).includes('合戦が発生')) {
        this.logger.info(he.decode(div.html() as string));
        const warFields = div
          .find('b')
          .map((index, field) => field.firstChild.nodeValue)
          .get();
        this.logger.info(warFields);
        break;
      }
    }
  };

  checkWar = async (): Promise<void> => {
    const warConfigs = await this.warConfigRepository.find();
    await executeConcurrent(
      warConfigs.map((warConfig) => warConfig.login),
      async (login: string) => {
        await this.checkWarByLogin(login);
      },
      10
    );
  };

  checkWarByLogin = async (login: string): Promise<void> => {
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.AREA_MAP, login);
    const warFieldButtons = page('img[class^=event_move]');
    if (warFieldButtons.length === 2) {
      const warFields = [];
      for (let i = 0; i < warFieldButtons.length; i++) {
        const button = warFieldButtons.eq(i);
        const id = parseInt(button.attr('class')?.replace('event_move', '') as string, 10);
        const name = button.parent().prev().prev().prev().find('center').eq(1).text().replace('の合戦', '');
        warFields.push({ id, name });
      }
      this.logger.info(warFields);
    } else {
      const warField = page('a[href*="war_entry"]').parent().prev().find('center').eq(1).text().replace('の合戦', '');
      this.logger.info(warField);
      const warPage = await makeMobileRequest(NOBOT_MOBILE_URL.WAR_ENTRY, login);
      const entries = warPage('a[href*="entry_war"]');
      if (entries.length > 0) {
        this.logger.info({
          warField: '',
          warHost: ''
        });
      } else {
        const lines = warPage('a[href*="entry_btl"]');
        this.logger.info(lines.length);
        this.logger.info('Arrive at war field for %s.', login);
      }
    }
  };

  goToWarFieldByGroup = async (group: string, warFieldId: number): Promise<void> => {
    const warConfigs = await this.warConfigRepository.findByGroup(group);
    await executeConcurrent(
      warConfigs.map((warConfig) => warConfig.login),
      async (login: string) => {
        await this.goToWarField(login, warFieldId);
      },
      10
    );
  };

  goToWarField = async (login: string, warFieldId: number): Promise<void> => {
    const page = await makePostMobileRequest(NOBOT_MOBILE_URL.MAP_MOVE, login, `id=${warFieldId}`);
    const form = page('#sp_sc_5').parent();
    await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
    this.logger.info('Go to war field %d for %s', warFieldId, login);
  };

  chooseWarHostByGroup = async (group: string, countryId: number): Promise<void> => {
    const warConfigs = await this.warConfigRepository.findByGroup(group);
    await executeConcurrent(
      warConfigs.map((warConfig) => warConfig.login),
      async (login: string) => {
        await this.chooseWarHost(login, countryId);
      },
      10
    );
  };

  chooseWarHost = async (login: string, countryId: number): Promise<void> => {
    await makeMobileRequest(NOBOT_MOBILE_URL.WAR_ENTRY, login);
    const page = await makeMobileRequest(
      encodeURIComponent(`${NOBOT_MOBILE_URL.WAR_CONFIRM}?action=entry_war&target=${countryId}`),
      login
    );
    const form = page('#sp_sc_5').parent();
    await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
    this.logger.info('Choose war host %d for %s', countryId, login);
  };
}
