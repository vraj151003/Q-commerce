// src/order/entity/order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entity/users.entity';
import { OrderItem } from './order-item.entity';
import {
  PaymentStatus,
  paymentMethod,
  OrderStatus,
} from '../../../common/constant/status';

@ObjectType()
@Entity('order')
export class Order {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'numeric' })
  totalAmount: number;

  @Field()
  @Column({ type: 'numeric', default: 0 })
  deliveryCharge: number;

  @Field()
  @Column()
  totalItems: number;

  @Field(() => Number)
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Field(() => Number, { nullable: true })
  @Column({ type: 'enum', enum: paymentMethod, nullable: true })
  paymentMethod: paymentMethod;

  @Field(() => Number)
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  addressLine1: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  addressLine2: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  state: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  country: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  pincode: string;

  @Field({ nullable: true })
  @Column({ type: 'numeric', nullable: true })
  latitude: number;

  @Field({ nullable: true })
  @Column({ type: 'numeric', nullable: true })
  longitude: number;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  cancelReason: string;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  assignedAt: Date;

  @ManyToOne(() => User)
  @Field(() => User)
  user: User;

  @Column({ nullable: true })
  deliveryPersonId: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  @Field(() => [OrderItem])
  items: OrderItem[];

  @Column({ nullable: true })
  paymentIntentId: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  couponId: string | null;

  @Field(() => Number, { nullable: true })
  @Column({ type: 'numeric', nullable: true })
  discountAmount: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
