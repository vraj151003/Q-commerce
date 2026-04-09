import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from '../../modules/permission/entity/permission.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionSeed {
  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
  ) {}

  async run() {
    const permissions = [
      { name: 'CREATE_USER' },
      { name: 'READ_USER' },
      { name: 'UPDATE_USER' },
      { name: 'DELETE_USER' },
      { name: 'CREATE_SHOP' },
      { name: 'READ_SHOP' },
      { name: 'UPDATE_SHOP' },
      { name: 'DELETE_SHOP' },
      { name: 'CREATE_ORDER' },
      { name: 'READ_ORDER' },
      { name: 'UPDATE_ORDER' },
      { name: 'DELETE_ORDER' },
      { name: 'CREATE_PRODUCT' },
      { name: 'READ_PRODUCT' },
      { name: 'UPDATE_PRODUCT' },
      { name: 'DELETE_PRODUCT' },
      { name: 'CREATE_CATEGORY' },
      { name: 'CART' },
      { name: 'READ_CATEGORY' },
      { name: 'UPDATE_CATEGORY' },
      { name: 'DELETE_CATEGORY' },
      { name: 'CREATE_SUBCATEGORY' },
      { name: 'READ_SUBCATEGORY' },
      { name: 'UPDATE_SUBCATEGORY' },
      { name: 'DELETE_SUBCATEGORY' },
      { name: 'MANAGE_DELIVERY' },
      { name: 'VIEW_ANALYTICS' },
    ];

    for (const permission of permissions) {
      const existingPermission = await this.permissionRepo.findOne({
        where: { name: permission.name },
      });

      if (!existingPermission) {
        const newPermission = this.permissionRepo.create(permission);
        await this.permissionRepo.save(newPermission);
      }
    }
  }
}
