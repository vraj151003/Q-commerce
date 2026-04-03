import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Role } from '../../roles/entity/roles.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Field()
  @Column({ default: false })
  isVerified: boolean;

  @Field()
  @Column({ default: false })
  adminApproved: boolean;
 
  @Field()
  @Column()
  mobile: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Role)
  @Field(() => Role, { nullable: true })
  role: Role;
}
