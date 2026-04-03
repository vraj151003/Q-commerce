import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entity/permission.entity';
import { Repository } from 'typeorm';
import { Role } from '../roles/entity/roles.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,

    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  createPermission(name: string) {
    const permission = this.permissionRepo.create({ name });
    return this.permissionRepo.save(permission);
  }

  findAll() {
    return this.permissionRepo.find();
  }

  async assignPermission(roleId: string, permissionId: string) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    const permission = await this.permissionRepo.findOne({
      where: { id: permissionId },
    });

    if (!role || !permission) {
      throw new BadRequestException('Role or Permission not found');
    }

    role.permissions.push(permission);
    return this.roleRepo.save(role);
  }

  async removePermission(roleId: string, permissionId: string) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    const permission = await this.permissionRepo.findOne({
      where: { id: permissionId },
    });

    if (!role || !permission) {
      throw new BadRequestException('Role or Permission not found');
    }

    role.permissions = role.permissions.filter(
      (perm) => perm.id !== permissionId,
    );
    return this.roleRepo.save(role);
  }

  async getPermissionByRole(roleId: string) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new BadRequestException('Role not found');
    }
    return role?.permissions;
  }
}
