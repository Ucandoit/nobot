import { Job } from 'node-schedule';

interface TaskParams {
  times: number;
  job: Job;
}

class SnipingTask {
  private tasks = new Map<string, TaskParams>();

  get = (login: string): TaskParams | undefined => {
    return this.tasks.get(login);
  };

  set = (login: string, job: Job): void => {
    if (this.tasks.has(login)) {
      (this.tasks.get(login) as TaskParams).job.cancel();
    }
    this.tasks.set(login, { times: 0, job });
  };
}

export default new SnipingTask();
