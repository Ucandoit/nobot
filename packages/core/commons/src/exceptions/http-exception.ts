export default class HttpException extends Error {
  private statusCode: number;

  constructor(statusCode: number, message?: string) {
    super(message);
    this.statusCode = statusCode;
  }

  public getStatus = (): number => {
    return this.statusCode;
  };

  public getMessage = (): string => {
    return this.message;
  };
}
