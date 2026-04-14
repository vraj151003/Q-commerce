import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entity/users.entity';
import { Role } from '../../modules/roles/entity/roles.entity';
import { Permission } from '../../modules/permission/entity/permission.entity';
import dataSource from '../../config/data-source';
import * as bcrypt from 'bcrypt';

export class UserSeed {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = dataSource;
  }

  async run() {
    await this.dataSource.initialize();
    const userRepo = this.dataSource.getRepository(User);
    const roleRepo = this.dataSource.getRepository(Role);
    const permissionRepo = this.dataSource.getRepository(Permission);

    // Create roles
    const roles = [
      { name: 'admin', permissions: [] },
      { name: 'seller', permissions: [] },
      { name: 'customer', permissions: [] },
      { name: 'delivery', permissions: [] },
    ];

    const createdRoles: Role[] = [];
    for (const roleData of roles) {
      let role = await roleRepo.findOne({
        where: { name: roleData.name },
        relations: ['permissions'],
      });

      if (!role) {
        role = roleRepo.create({ name: roleData.name });
        role = await roleRepo.save(role);
      }
      createdRoles.push(role);
    }

    // Assign permissions to roles
    const allPermissions = await permissionRepo.find();
    const adminRole = createdRoles.find(r => r.name === 'admin');
    const sellerRole = createdRoles.find(r => r.name === 'seller');
    const customerRole = createdRoles.find(r => r.name === 'customer');
    const deliveryRole = createdRoles.find(r => r.name === 'delivery');

    // Admin gets all permissions
    if (adminRole && allPermissions.length > 0) {
      adminRole.permissions = allPermissions;
      await roleRepo.save(adminRole);
    }

    // Seller gets specific permissions
    const sellerPermissions = allPermissions.filter(p => 
      p.name.includes('PRODUCT') || 
      p.name.includes('SHOP') || 
      p.name.includes('ORDER')
    );
    if (sellerRole && sellerPermissions.length > 0) {
      sellerRole.permissions = sellerPermissions;
      await roleRepo.save(sellerRole);
    }

    // Customer gets read permissions
    const customerPermissions = allPermissions.filter(p => 
      p.name.startsWith('READ_') || 
      p.name === 'CART'
    );
    if (customerRole && customerPermissions.length > 0) {
      customerRole.permissions = customerPermissions;
      await roleRepo.save(customerRole);
    }

    // Delivery gets delivery-specific permissions
    const deliveryPermissions = allPermissions.filter(p => 
      p.name.includes('DELIVERY') || 
      p.name.includes('ORDER')
    );
    if (deliveryRole && deliveryPermissions.length > 0) {
      deliveryRole.permissions = deliveryPermissions;
      await roleRepo.save(deliveryRole);
    }

    // Create users for each role
    const users = [
      // Admin user (already exists, just check)
      {
        firstName: 'vraj',
        lastName: 'patel',
        email: 'vraj@yopmail.com',
        password: 'Admin@123',
        mobile: '1234567890',
        role: adminRole,
      },
      // Seller users
      {
        firstName: 'john',
        lastName: 'seller',
        email: 'john.seller@yopmail.com',
        password: 'Seller@123',
        mobile: '9876543210',
        role: sellerRole,
      },
      {
        firstName: 'jane',
        lastName: 'store',
        email: 'jane.store@yopmail.com',
        password: 'Seller@123',
        mobile: '9876543211',
        role: sellerRole,
      },
      // Customer users
      {
        firstName: 'alice',
        lastName: 'customer',
        email: 'alice@yopmail.com',
        password: 'Customer@123',
        mobile: '9876543212',
        role: customerRole,
      },
      {
        firstName: 'bob',
        lastName: 'shopper',
        email: 'bob@yopmail.com',
        password: 'Customer@123',
        mobile: '9876543213',
        role: customerRole,
      },
      {
        firstName: 'charlie',
        lastName: 'buyer',
        email: 'charlie@yopmail.com',
        password: 'Customer@123',
        mobile: '9876543214',
        role: customerRole,
      },
      // Delivery users
      {
        firstName: 'david',
        lastName: 'delivery',
        email: 'david@yopmail.com',
        password: 'Delivery@123',
        mobile: '9876543215',
        role: deliveryRole,
      },
      {
        firstName: 'eve',
        lastName: 'rider',
        email: 'eve@yopmail.com',
        password: 'Delivery@123',
        mobile: '9876543216',
        role: deliveryRole,
      },
    ];

    for (const userData of users) {
      if (!userData.role) continue;

      const existingUser = await userRepo.findOne({
        where: { email: userData.email },
        relations: ['role'],
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const user = userRepo.create({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          mobile: userData.mobile,
          isVerified: true,
          adminApproved: true,
          role: userData.role,
        });

        await userRepo.save(user);
      }
    }

    await this.dataSource.destroy();
  }
}
