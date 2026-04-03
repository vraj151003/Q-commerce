import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entity/permission.entity';
import { User } from '../../modules/users/entity/users.entity';
import { PermissionService } from './permission.service';
import { PermissionSeed } from '../../database/seeds/permission.seed';
import { UserSeed } from '../../database/seeds/user.seed';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, User]), RolesModule],
  providers: [PermissionService, PermissionSeed, UserSeed],
  exports: [PermissionService, PermissionSeed, UserSeed],
})
export class PermissionModule {}
