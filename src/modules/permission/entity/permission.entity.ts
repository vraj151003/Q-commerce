import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../roles/entity/roles.entity';

@ObjectType()
@Entity('permissions')
export class Permission {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
