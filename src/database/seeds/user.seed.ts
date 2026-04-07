import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../modules/users/entity/users.entity';
import { Role } from '../../modules/roles/entity/roles.entity';
import { Permission } from '../../modules/permission/entity/permission.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserSeed {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
  ) {}

  async run() {
    // Find or create admin role first
    let adminRole = await this.roleRepo.findOne({
      where: { name: 'admin' },
      relations: ['permissions'],
    });

    if (!adminRole) {
      adminRole = this.roleRepo.create({ name: 'admin' });
      adminRole = await this.roleRepo.save(adminRole);
    }

    // Assign all permissions to admin role
    const allPermissions = await this.permissionRepo.find();
    if (allPermissions.length > 0) {
      adminRole.permissions = allPermissions;
      await this.roleRepo.save(adminRole);
    }

    // Check if admin user already exists
    const existingAdmin = await this.userRepo.findOne({
      where: { email: 'vraj@yopmail.com' },
      relations: ['role'],
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      const adminUser = this.userRepo.create({
        firstName: 'vraj',
        lastName: 'patel',
        email: 'vraj@yopmail.com',
        password: hashedPassword,
        mobile: '1234567890',
        isVerified: true,
        adminApproved: true,
        role: adminRole,
      });

      await this.userRepo.save(adminUser);
    } else {
    }

  }
}
