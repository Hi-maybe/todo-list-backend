import { Injectable, BadRequestException, MethodNotAllowedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { defineAll, defineAny } from 'src/utils/function';
import { Repository } from 'typeorm';
import { v4 } from 'uuid';
import { AttachmentService } from '../attachment/index.service';
import { CommentService } from '../comment/index.service';
import { TodolistService } from '../todolist/index.service';
import { UserService } from '../user/index.service';
import { Task } from './index.entity';
import { ITaskGet, ITaskCreate, ITaskUpdate, ITaskReindexAll } from './index.type';

@Injectable()
export class TaskService {
  readonly indexStep: number = Math.pow(2, 30);
  readonly priorities = { lowest: 'Lowest', low: 'Low', medium: 'Medium', high: 'High', highest: 'Highest' };

  constructor(
    @InjectRepository(Task)
    readonly repository: Repository<Task>,
    readonly todolist: TodolistService,
    readonly attachment: AttachmentService,
    readonly comment: CommentService,
    readonly user: UserService,
  ) {}

  get() {
    return this.repository.find({ where: { isActive: true } });
  }

  getOne({ id }: ITaskGet) {
    return this.repository.findOne({
      where: { id, isActive: true },
      relations: {
        status: true,
        todolist: { status: true },
        attachments: { user: true },
        comments: { user: true },
        assignee: true,
      },
      order: { attachments: { createdDate: 'ASC' }, comments: { createdDate: 'ASC' } },
    });
  }

  async create(param: ITaskCreate) {
    const { name, todolistId, description, userId } = param;
    if (!name || (name && !name.trim())) throw new BadRequestException('Empty name ');
    const list = await this.todolist.getOne({ id: todolistId });
    if (list.visibility !== this.todolist.visibilityList.public && list.userId !== userId)
      throw new MethodNotAllowedException();
    const id = v4();
    const index = (list.tasks.length + 1) * this.indexStep;
    const statusList = list.status.sort((a, b) => Number(a.index) - Number(b.index));
    const statusId = Number(statusList[0].id);
    const user = this.repository.create({ name, todolistId, description, userId, id, index, statusId });
    return this.repository.save(user);
  }

  async update(param: ITaskUpdate) {
    const {
      id,
      userId,
      name,
      description,
      index,
      storyPoint,
      priority,
      statusId,
      isDone,
      startDate,
      dueDate,
      isActive,
      attachment,
      comment,
      assignee,
    } = param;

    if (!defineAll(id, userId)) throw new BadRequestException('Task Update Error param');

    const task = await this.repository.findOne({
      where: { id },
      relations: { todolist: { status: true } },
    });

    const write = task.todolist.visibility === this.todolist.visibilityList.public || task.todolist.userId === userId;

    if (!write) throw new ForbiddenException(`You can't update this todolist`);

    if (defineAny(name, index, description, storyPoint, startDate, dueDate, priority, isActive, assignee)) {
      if (name) {
        if (!name.trim()) throw new BadRequestException('Empty name');
        task.name = name;
      }

      if (index !== undefined) {
        task.index = index;
      }

      if (description !== undefined) {
        task.description = description;
      }

      if (storyPoint !== undefined) {
        task.storyPoint = storyPoint;
      }

      if (startDate !== undefined) {
        task.startDate = startDate;
      }

      if (dueDate !== undefined) {
        task.dueDate = dueDate;
      }

      if (priority) {
        if (!Object.values(this.priorities).includes(priority))
          throw new MethodNotAllowedException('Error priority value');
        task.priority = priority;
      }

      if (assignee !== undefined) {
        if (assignee.email === null) {
          task.assigneeId = null;
        } else {
          const user = await this.user.repository.findOneBy({ email: assignee.email });
          console.log('🚀 ~ file: index.service.ts ~ line 125 ~ TaskService ~ update ~ user', user);
          if (!user) throw new BadRequestException('User not existed');
          task.assigneeId = user.id;
        }
      }

      if (isActive !== undefined) {
        task.isActive = isActive;
      }

      await this.repository.save(task);
    }

    if (defineAny(statusId, isDone)) {
      const ascendingStatus = task.todolist.status.sort((a, b) => a.index - b.index);
      const endStatus = ascendingStatus[ascendingStatus.length - 1].id;

      if (isDone !== undefined) {
        if (isDone === true) {
          task.statusId = endStatus;
        } else {
          if (task.statusId == endStatus) {
            task.statusId = ascendingStatus[0].id;
          }
        }
        task.isDone = isDone;
      }
      if (statusId) {
        if (statusId == endStatus) task.isDone = true;
        else task.isDone = false;
        task.statusId = statusId;
      }
      await this.repository.save(task);
    }

    if (defineAny(attachment, comment, assignee)) {
      if (attachment) {
        if (attachment.create) this.attachment.create({ ...attachment.create, taskId: id, userId });
        if (attachment.update) this.attachment.update({ ...attachment.update, taskId: id, userId });
      }

      if (comment) {
        if (comment.create) this.comment.create({ ...comment.create, taskId: id, userId });
        if (comment.update) this.comment.update({ ...comment.update, taskId: id, userId });
      }
    }

    return task;
  }

  async reindexAll({ todolistId }: ITaskReindexAll) {
    if (!defineAll(todolistId)) throw new BadRequestException('Task reindexAll err param');
    const tasks = await this.repository.find({ where: { todolistId }, order: { index: 'ASC' } });
    const promises: Promise<any>[] = [];
    tasks.forEach((task, index) => {
      task.index = (index + 1) * this.indexStep;
      promises.push(this.repository.save(task));
    });
    return Promise.all(promises);
  }
}
