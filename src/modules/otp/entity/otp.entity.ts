import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { OtpType } from '../../../common/constant/status';

@ObjectType()
@Entity('otps')
export class Otp {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  otp: string;

  @Column({
    type: 'enum',
    enum: OtpType,
  })
  type: OtpType;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
