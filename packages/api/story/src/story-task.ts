export default class StoryTask {
  private login: string;

  private stop = false;

  private chapter: number;

  private section: number;

  private extraTicket: number;

  private retry = 0;

  private team: number;

  constructor(login: string, extraTicket: number) {
    this.login = login;
    this.extraTicket = extraTicket;
  }

  setChapterAndSection = (chapter: number, section: number): void => {
    // if section doesn't change, it means the battle failed
    if (this.section === section) {
      this.retry += 1;
    } else {
      this.retry = 0;
    }
    this.chapter = chapter;
    this.section = section;
  };

  getChapterAndSection = (): [number, number] => [this.chapter, this.section];

  getLogin = (): string => this.login;

  setStop = (stop: boolean): void => {
    this.stop = stop;
  };

  isStop = (): boolean => this.stop;

  getExtraTicket = (): number => this.extraTicket;

  setExtraTicket = (extraTicket: number): void => {
    this.extraTicket = extraTicket;
  };

  getRetry = (): number => this.retry;

  setRetry = (retry: number): void => {
    this.retry = retry;
  };

  getTeam = (): number => this.team;

  setTeam = (team: number): void => {
    this.team = team;
  };
}
