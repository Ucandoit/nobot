const getSeconds = (text: string): number => {
  const [hour, minute, second] = text.split(':');
  return parseInt(hour, 10) * 60 * 60 + parseInt(minute, 10) * 60 + parseInt(second, 10);
};

const nobotUtils = {
  getSeconds
};

export default nobotUtils;
