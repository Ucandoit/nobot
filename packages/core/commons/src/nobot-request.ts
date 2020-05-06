import cheerio from 'cheerio';
import { post } from 'superagent';
import { jsonParser } from './response-parser';

// const logger = getLogger('NobotRequest');

const baseUrl = 'http://e824549fb2ec8582e96abe565514e1aa9a3fca00.app.mbga-platform.jp/gadgets/makeRequest';

const makeRequest = async (url: string, method: string, token: string): Promise<string | CheerioStatic> => {
  const res = await post(baseUrl)
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      url,
      httpMethod: method,
      authz: 'signed',
      st: token,
      contentType: 'TEXT',
      numEntries: 3,
      getSummaries: false,
      signOwner: true,
      signViewer: true,
      gadget: 'http://210.140.157.168/gadget.xml',
      container: 'default'
    })
    .buffer(true)
    .parse(jsonParser);
  if (res.body[url].headers) {
    return res.body[url].headers.location[0];
  }
  return cheerio.load(res.body[url].body);
};

export default makeRequest;
