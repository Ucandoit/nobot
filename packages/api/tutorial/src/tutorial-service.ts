import { makeMobileRequest, makePostMobileRequest, NOBOT_MOBILE_URL, regexUtils, Service } from '@nobot-core/commons';
import axios from 'axios';
import { getLogger } from 'log4js';

@Service()
export default class TutorialService {
  private logger = getLogger(TutorialService.name);

  public start = async (login: string): Promise<void> => {
    this.logger.info('Start tutorial for %s.', login);
    await this.fight(login);
    await this.readReport(login);
    await this.drawCard(login);
    await this.upgradeHome(login);
    await this.moveCard(login);
    await this.replaceCard(login);
    await this.buildFoodFacility(login);
    await this.trainFire(login);
    await this.fight2(login);
    await this.watchReplay(login);
    this.logger.info('Finish tutorial for %s.', login);
    await axios.get(`http://action:3000/action/account/login/${login}`);
    await axios.get(`http://action:3000/action/card/moveCard?login=${login}&cardId=1250`);
    await axios.get(`http://action:3000/action/card/deckSample?login=${login}`);
    await axios.get(`http://account:3000/accounts/configs/initialize?login=${login}`);
    await axios.get(`http://action:3000/action/build/start/${login}`);
  };

  private fight = async (login: string): Promise<void> => {
    this.logger.info('Get fight quest for %s', login);
    let nextUrl = await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    nextUrl = await this.getNextUrl(nextUrl, login, false);
    const [postUrl, postData] = await this.getPostForm(nextUrl, login, false);
    await makePostMobileRequest(postUrl, login, postData, false);
    await this.finishQuest(login);
  };

  private readReport = async (login: string): Promise<void> => {
    this.logger.info('Get read report quest for %s', login);
    let nextUrl = await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    nextUrl = await this.getNextUrl(nextUrl, login, false);
    await makeMobileRequest(nextUrl, login, false);
    await this.finishQuest(login);
  };

  private drawCard = async (login: string): Promise<void> => {
    this.logger.info('Get draw card quest for %s', login);
    let nextUrl = await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    nextUrl = await this.getNextUrl(nextUrl, login, false);
    const [postUrl, postData] = await this.getPostForm(nextUrl, login, false);
    const page = await makePostMobileRequest(postUrl, login, postData, false);
    const url = regexUtils.catchByRegex(page.html(), /(?<=nextURL = ").+(?=")/) as string;
    if (url) {
      this.logger.info(url);
      await makeMobileRequest(url, login, false);
    }
    await this.finishQuest(login);
  };

  private upgradeHome = async (login: string): Promise<void> => {
    this.logger.info('Get upgrade home quest for %s', login);
    const nextUrl = await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    const [postUrl, postData] = await this.getPostForm(nextUrl, login, false, '#dlg20 form');
    await makePostMobileRequest(postUrl, login, postData, false);
    await makeMobileRequest(NOBOT_MOBILE_URL.BUILDING_REPORT, login);
    await this.finishQuest(login);
  };

  private moveCard = async (login: string): Promise<void> => {
    this.logger.info('Get move card quest for %s', login);
    let nextUrl = await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    nextUrl = await this.getNextUrl(nextUrl, login, true);
    const [postUrl, postData] = await this.getPostForm(nextUrl, login, false);
    await makePostMobileRequest(postUrl, login, postData, false);
    await this.finishQuest(login);
  };

  private replaceCard = async (login: string): Promise<void> => {
    this.logger.info('Get replace card quest for %s', login);
    const nextUrl = await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    const page = await makeMobileRequest(nextUrl, login, false);
    const form = page('#form');
    const reserveCard = form.find('#form_reserve-card1').val();
    const reserveBase = form.find('#form_reserve-base1').val();
    const postData = form
      .serialize()
      .replace(/(?<=&deck-card1=)[0-9]+(?=&)/, reserveCard)
      .replace(/(?<=&deck-base1=)[0-9]+(?=&)/, reserveBase)
      .replace(/(?<=&leader-value=)[0-9]+(?=&)/, reserveCard);
    await makePostMobileRequest(form.attr('action') as string, login, postData, false);
    await this.finishQuest(login);
  };

  private buildFoodFacility = async (login: string): Promise<void> => {
    this.logger.info('Get build food facility quest for %s', login);
    await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    await makePostMobileRequest(NOBOT_MOBILE_URL.BUILDING_RESULT, login, 'id=05&pt=0&type=16');
    await makeMobileRequest(NOBOT_MOBILE_URL.BUILDING_REPORT, login);
    await this.finishQuest(login);
  };

  private trainFire = async (login: string): Promise<void> => {
    this.logger.info('Get train fire quest for %s', login);
    const nextUrl = await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    let page = await makeMobileRequest(nextUrl, login, false);
    const card = page('#pool_1 .reserve-face');
    const cardId = regexUtils.catchByRegex(card.attr('class'), /(?<=face-card-id)[0-9]+/) as string;
    page = await makePostMobileRequest(NOBOT_MOBILE_URL.DROP_DIALOG, login, `cardid=${cardId}&index=6&type=3`);
    const form = page('#drop-command');
    await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
    await makeMobileRequest(NOBOT_MOBILE_URL.TRAINING_REPORT, login);
    await this.finishQuest(login);
  };

  public fight2 = async (login: string): Promise<void> => {
    this.logger.info('Get fight quest for %s', login);
    let nextUrl = await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    nextUrl = await this.getNextUrl(nextUrl, login, false);
    let [postUrl, postData] = await this.getPostForm(nextUrl, login, false);
    await makePostMobileRequest(postUrl, login, postData, false);
    await makeMobileRequest(NOBOT_MOBILE_URL.VILLAGE, login);
    nextUrl = await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    nextUrl = await this.getNextUrl(nextUrl, login, false);
    [postUrl, postData] = await this.getPostForm(nextUrl, login, false);
    await makePostMobileRequest(postUrl, login, postData, false);
    await makeMobileRequest(NOBOT_MOBILE_URL.VILLAGE_NOTIFY, login);
    await makeMobileRequest(`${NOBOT_MOBILE_URL.VILLAGE_NOTIFY}?name=friendly`, login);
    await this.finishQuest(login);
  };

  public watchReplay = async (login: string): Promise<void> => {
    this.logger.info('Get watch replay quest for %s', login);
    let nextUrl = await this.getNextUrl(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    nextUrl = await this.getNextUrl(nextUrl, login, false);
    await makeMobileRequest(nextUrl, login, false);
    await this.finishQuest(login);
  };

  private getNextUrl = async (url: string, login: string, needPrefix: boolean): Promise<string> => {
    const page = await makeMobileRequest(url, login, needPrefix);
    return page('#sp_sc_5').attr('href') as string;
  };

  private getPostForm = async (
    url: string,
    login: string,
    needPrefix: boolean,
    formSelector = 'form'
  ): Promise<[string, string]> => {
    const page = await makeMobileRequest(url, login, needPrefix);
    const form = page(formSelector);
    return [form.attr('action') as string, form.serialize()];
  };

  private finishQuest = async (login: string): Promise<void> => {
    const [postUrl, postData] = await this.getPostForm(NOBOT_MOBILE_URL.TUTORIAL_INTRO, login, true);
    await makePostMobileRequest(postUrl, login, postData, false);
    this.logger.info('Finish quest for %s.', login);
  };
}
