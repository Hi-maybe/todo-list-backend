import { Module } from "@nestjs/common";
import { TodolistService } from "./todolist.service";
import { TodolistController } from "./todolist.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Todolist } from "./entities/todolist.entity";
import { TaskService } from 'src/task/task.service';
import { Task } from 'src/task/entities/task.entity';
import { UuidstorageService } from "src/uuidstorage/uuidstorage.service";
import { Uuidstorage } from 'src/uuidstorage/entities/uuidstorage.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Todolist, Task, Uuidstorage,User]),AuthModule],
  controllers: [TodolistController],
  providers: [TodolistService, TaskService, UuidstorageService, UsersService],
})
export class TodolistModule {}
