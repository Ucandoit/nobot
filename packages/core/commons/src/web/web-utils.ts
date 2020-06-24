import { Request } from 'express';

export const getQueryParamAsString = (req: Request, property: string): string | undefined => {
  return req.query[property] as string | undefined;
};

export const getQueryParamAsInt = (req: Request, property: string): number | undefined => {
  const stringValue = getQueryParamAsString(req, property);
  return stringValue !== undefined ? parseInt(stringValue, 10) : undefined;
};

export const executeConcurrent = async <T>(
  array: T[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  method: (...args: any[]) => Promise<void>,
  maxConcurrent = 1,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): Promise<void> => {
  await array
    .reduce((groups: T[][], element: T, index: number) => {
      if (index % maxConcurrent === 0) {
        groups.push([]);
      }
      groups[groups.length - 1].push(element);
      return groups;
    }, [])
    .reduce(async (previous: Promise<void[]>, group: T[]): Promise<void[]> => {
      await previous;
      return Promise.all(group.map((element) => method.apply(null, [element, ...args])));
    }, Promise.resolve([]));
};
