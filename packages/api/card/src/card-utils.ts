import { regexUtils } from '@nobot-core/commons';

export const getProperty = (img: string | undefined): string => {
  const code = regexUtils.catchByRegex(img, /(?<=elements_0)[0-9]/);
  switch (code) {
    case '0':
      return '火';
    case '1':
      return '地';
    case '2':
      return '風';
    case '3':
      return '水';
    case '4':
      return '空';
    default:
      return 'N/A';
  }
};

export const getRarity = (img: string | undefined): string => {
  const rarityCode = regexUtils.catchByRegex(img, /(?<=rare_0)[0-9](?=_)/);
  switch (rarityCode) {
    case '1':
      return '並';
    case '2':
      return '珍';
    case '3':
      return '稀';
    case '4':
      return '極';
    case '5':
      return '宝';
    case '6':
      return '誉';
    case '7':
      return '煌';
    default:
      return '並';
  }
};

export const getStar = (img: string | undefined): number => {
  const starCode = regexUtils.catchByRegex(img, /(?<=star0)[0-9](?=_)/, 'integer') as number | null;
  return starCode || 0;
};

const imageToNumber = (image: string, prePattern: string): number => {
  return (regexUtils.catchByRegex(image, new RegExp(`(?<=${prePattern})[0-9](?=_)`), 'integer') as number) || 0;
};

export const imagesToNumber = (images: string[]): number => {
  let total = 0;
  for (let i = images.length - 1; i >= 0; i--) {
    total += imageToNumber(images[i], 'num_param_') * 10 ** (images.length - i - 1);
  }
  return total;
};
