import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entity/roles.entity';
import { RolesService } from './roles.service';
import { RolesResolver } from './roles.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [RolesService, RolesResolver],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
