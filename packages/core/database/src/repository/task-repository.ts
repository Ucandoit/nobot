import { EntityRepository, Repository } from 'typeorm';
import { Task } from '../entities';
import { TaskType } from '../types';

@EntityRepository(Task)
export default class TaskRepository<T> extends Repository<Task<T>> {
  findSingleTaskByAccountAndType = async (login: string, type: TaskType): Promise<Task<T> | null> => {
    const tasks = await this.find({
      type,
      endTime: null,
      account: { login }
    });
    if (tasks.length > 1) {
      throw new Error(`2 or more ${type} tasks of ${login} is in progress.`);
    } else if (tasks.length === 0) {
      return null;
    }
    return tasks[0];
  };

  findAllTasksByType = (type: TaskType): Promise<Task<T>[]> => {
    return this.find({
      where: {
        type,
        endTime: null
      },
      relations: ['account']
    });
  };
}
