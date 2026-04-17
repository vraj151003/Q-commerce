import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { DiscountType } from 'src/common/constant/status';

@ObjectType()
@Entity('coupon')
@Index(['code'])
export class Coupon {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  code: string;

  @Field(() => DiscountType)
  @Column({
    type: 'enum',
    enum: DiscountType,
  })
  discountType: DiscountType;

  @Field(() => Number)
  @Column('decimal', { precision: 10, scale: 2 })
  discountValue: number;

  @Field(() => Number, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: number | null;

  @Field(() => Number, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minOrderAmount: number | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'date', nullable: true })
  startDate: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'date', nullable: true })
  expiryDate: Date | null;

  @Field(() => Number)
  @Column({ default: 0 })
  usageLimit: number;

  @Field(() => Number)
  @Column({ default: 0 })
  usageCount: number;

  @Field(() => Boolean)
  @Column({ default: true })
  isActive: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
