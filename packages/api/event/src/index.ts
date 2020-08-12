import { NobotApp } from '@nobot-core/commons';
import WarConfigService from './war/war-config-service';
// import CountryBattleService from './country-battle/country-battle-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_event', __dirname);
  await nobotApp.start();
  // const countryBattleService = nobotApp.getContainer().get(CountryBattleService);
  // countryBattleService.startCountryBattle('zz0001');
  const warConfigService = nobotApp.getContainer().get(WarConfigService);
  warConfigService.checkWarByLogin('zzz_001');
})();
