import { makeMobileRequest, NOBOT_MOBILE_URL, NotFoundException, Parameters, Service } from '@nobot-core/commons';
import { AccountRepository, ParameterRepository, WarConfigRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
import { WarField } from './models';

@Service()
export default class WarConfigService {
  private logger = getLogger(WarConfigService.name);

  private warConfigRepository: WarConfigRepository;

  private accountRepository: AccountRepository;

  private parameterRepository: ParameterRepository;

  constructor(connection: Connection) {
    this.warConfigRepository = connection.getCustomRepository(WarConfigRepository);
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.parameterRepository = connection.getCustomRepository(ParameterRepository);
  }

  initializeWarConfigs = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccountsByStatus('FINISH');
    accounts.forEach(async (account) => {
      const warConfig = await this.warConfigRepository.findOne(account.login);
      if (!warConfig) {
        this.logger.info('Create war config for %s.', account.login);
        await this.warConfigRepository.save({
          login: account.login,
          group: 'BASIC'
        });
      }
    });
  };

  getWarFields = async (): Promise<WarField[]> => {
    const parameter = await this.parameterRepository.findOne(Parameters.WAR_FIELD);
    if (parameter) {
      return JSON.parse(parameter.value);
    }
    throw new NotFoundException();
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
      this.parameterRepository.save({ code: Parameters.WAR_FIELD, value: JSON.stringify(warFields) });
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

  setLineByGroup = async (line: number, group: string): Promise<void> => {
    this.logger.info('Change to line %d for group %s.', line, group);
    await this.warConfigRepository.update({ group }, { line });
  };
}
