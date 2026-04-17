import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Permission } from '../../modules/permission/entity/permission.entity';
import { Role } from '../../modules/roles/entity/roles.entity';
import dataSource from '../../config/data-source';

@Injectable()
export class PermissionSeed {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = dataSource;
  }

  async run() {
    await this.dataSource.initialize();
    const permissionRepo = this.dataSource.getRepository(Permission);

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
      { name: 'CREATE_TAX' },
      { name: 'READ_TAX' },
      { name: 'UPDATE_TAX' },
      { name: 'DELETE_TAX' },
      { name: 'MANAGE_DELIVERY' },
      { name: 'VIEW_ANALYTICS' },
      { name: 'CREATE_NOTIFICATION' },
      { name: 'READ_NOTIFICATION' },
      { name: 'UPDATE_NOTIFICATION' },
      { name: 'DELETE_NOTIFICATION' },
      { name: 'CREATE_COUPON' },
      { name: 'READ_COUPON' },
      { name: 'UPDATE_COUPON' },
      { name: 'DELETE_COUPON' },
    ];

    for (const permission of permissions) {
      const existingPermission = await permissionRepo.findOne({
        where: { name: permission.name },
      });

      if (!existingPermission) {
        const newPermission = permissionRepo.create(permission);
        await permissionRepo.save(newPermission);
      }
    }

    await this.dataSource.destroy();
  }
}
