import superagent from 'superagent';

export const jsonParser = (res: superagent.Response, fn: (err: Error | null, body: unknown) => void): void => {
  res.text = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    if (chunk.startsWith(`throw 1; < don't be evil' >`)) {
      res.text += chunk.replace(`throw 1; < don't be evil' >`, '');
    } else {
      res.text += chunk;
    }
  });
  res.on('end', () => {
    let body;
    let err;
    try {
      body = res.text && JSON.parse(res.text);
    } catch (err_) {
      err = err_;
      // issue #675: return the raw response if the response parsing fails
      err.rawResponse = res.text || null;
      // issue #876: return the http status code if the response parsing fails
      err.statusCode = res.status;
    } finally {
      fn(err, body);
    }
  });
};

export const textParser = (res: superagent.Response, fn: (err: Error | null, body: unknown) => void): void => {
  res.text = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    if (chunk.startsWith(`throw 1; < don't be evil' >`)) {
      res.text += chunk.replace(`throw 1; < don't be evil' >`, '');
    } else {
      res.text += chunk;
    }
  });
  res.on('end', () => {
    let body;
    let err;
    try {
      body = res.text && JSON.parse(res.text);
    } catch (err_) {
      err = err_;
      // issue #675: return the raw response if the response parsing fails
      err.rawResponse = res.text || null;
      // issue #876: return the http status code if the response parsing fails
      err.statusCode = res.status;
    } finally {
      fn(err, body);
    }
  });
};
