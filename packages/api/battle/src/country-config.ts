import { getLogger } from 'log4js';
import { Country } from './types';

class CountryConfig {
  private logger = getLogger(CountryConfig.name);

  private countryList: Country[];

  constructor() {
    this.logger.info('Initialising country list.');

    this.countryList = [];
    this.countryList.push({ id: 1, name: '伊達家', city: '米沢城' });
    this.countryList.push({ id: 2, name: '最上家', city: '山形城' });
    this.countryList.push({ id: 3, name: '北条家', city: '小田原城' });
    this.countryList.push({ id: 4, name: '武田家', city: '躑躅ヶ崎館' });
    this.countryList.push({ id: 5, name: '上杉家', city: '春日山城' });
    this.countryList.push({ id: 6, name: '徳川家', city: '浜松城' });
    this.countryList.push({ id: 7, name: '織田家', city: '清洲城' });
    this.countryList.push({ id: 8, name: '斎藤家', city: '稲葉山城' });
    this.countryList.push({ id: 9, name: '三好家', city: '飯盛山城' });
    this.countryList.push({ id: 10, name: '足利家', city: '二条御所' });
    this.countryList.push({ id: 11, name: '毛利家', city: '吉田郡山城' });
    this.countryList.push({ id: 12, name: '尼子家', city: '月山富田城' });
    this.countryList.push({ id: 13, name: '長宗我部家', city: '岡豊城' });
    this.countryList.push({ id: 14, name: '龍造寺家', city: '佐嘉城' });
    this.countryList.push({ id: 15, name: '大友家', city: '府内城' });
    this.countryList.push({ id: 16, name: '島津家', city: '内城' });
  }

  getCountryList = (): Country[] => this.countryList;
}

export default new CountryConfig();
