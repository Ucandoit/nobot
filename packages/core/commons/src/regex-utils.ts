/**
 * Catch the first match to the regexp.
 * @param str the source string
 * @param regex the regexp
 * @param type the type of match to return (string or integer)
 *
 * @returns the first match as string or number or null if nothing matches.
 */
const catchByRegex = (str = '', regex: RegExp, type: 'string' | 'integer' = 'string'): string | number | null => {
  const matcher = str.match(regex);
  if (matcher) {
    if (type === 'integer') {
      return parseInt(matcher[0], 10);
    }
    return matcher[0];
  }
  return null;
};

/**
 * Catch the first match as number to the regexp.
 * @param str the source string
 * @param regex the regexp
 *
 * @returns the first match as number or null if nothing matches.
 */
const catchByRegexAsNumber = (str = '', regex: RegExp): number | null => {
  const matcher = str.match(regex);
  if (matcher) {
    return parseInt(matcher[0], 10);
  }
  return null;
};

const regexUtils = {
  catchByRegex,
  catchByRegexAsNumber
};

export default regexUtils;
