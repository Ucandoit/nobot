import { NobotApp } from '@nobot-core/commons';
import { scheduleJob } from 'node-schedule';
// import TerritoryBattleService from './territory-battle/territory-battle-service';
import WarService from './war/war-service';
// import CountryBattleService from './country-battle/country-battle-service';

(async function startApp(): Promise<void> {
  const nobotApp = new NobotApp('api_event', __dirname);
  await nobotApp.start();
  const warService = nobotApp.getContainer().get(WarService);
  scheduleJob('0 0 5 * * *', warService.stopAll);
  // scheduleJob('0 10 15 * * *', warService.startAll);
  // const countryBattleService = nobotApp.getContainer().get(CountryBattleService);
  // countryBattleService.startCountryBattle('zz0001');
  // const warConfigService = nobotApp.getContainer().get(WarConfigService);
  // warConfigService.checkWarByLogin('zzz_001');
  // const territoryBattleService = nobotApp.getContainer().get(TerritoryBattleService);
  // territoryBattleService.joinCountry('zzz_004');
  // territoryBattleService.heal('zzz_001');
  // territoryBattleService.joinAll();
  // territoryBattleService.fixAll();
  // territoryBattleService.checkAll();
  // territoryBattleService.healAll();
  // territoryBattleService.startTerritoryBattle('main');
})();
