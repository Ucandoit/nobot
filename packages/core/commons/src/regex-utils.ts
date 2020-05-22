/**
 * Catch the first match to the regexp.
 * @param str the source string
 * @param regex the regexp
 *
 * @returns the first match as string or null if nothing matches.
 */
const catchByRegex = (str = '', regex: RegExp): string | null => {
  const matcher = str.match(regex);
  if (matcher) {
    return matcher[0];
  }
  return null;
};

const regexUtils = {
  catchByRegex
};

export default regexUtils;
