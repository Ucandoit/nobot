import { Request } from 'express';

export const getQueryParamAsString = (req: Request, property: string): string | undefined => {
  return req.query[property] as string | undefined;
};

export const getQueryParamAsInt = (req: Request, property: string): number | undefined => {
  const stringValue = getQueryParamAsString(req, property);
  return stringValue !== undefined ? parseInt(stringValue, 10) : undefined;
};
