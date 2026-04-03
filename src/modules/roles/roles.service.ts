import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entity/roles.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  create(name: string) {
    const role = this.rolesRepo.create({ name });
    return this.rolesRepo.save(role);
  }

  findAll() {
    return this.rolesRepo.find();
  }

  findOne(id: string) {
    return this.rolesRepo.findOneBy({ id });
  }

  async update(id: string, name: string) {
    const role = await this.rolesRepo.findOneBy({ id });
    if (!role) {
      throw new BadRequestException('roles not found');
    }

    role.name = name;
    return this.rolesRepo.save(role);
  }

  async remove(id: string) {
    const role = await this.rolesRepo.findOneBy({ id });
    if (!role) {
      throw new BadRequestException('roles not found');
    }
    return this.rolesRepo.remove(role);
  }
}
