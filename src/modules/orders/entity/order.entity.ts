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
import { User } from 'src/modules/users/entity/users.entity';
import { OrderItem } from './order-item.entity';
import { PaymentStatus, paymentMethod } from 'src/common/constant/status';


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

  @Field()
  @Column({ default: 'PENDING' })
  status: string;

  @Field(() => paymentMethod, { nullable: true })
  @Column({ type: 'enum', enum: paymentMethod, nullable: true })
  paymentMethod: paymentMethod;

  @Field(() => PaymentStatus)
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true }) addressLine1: string;
  @Column({ nullable: true }) addressLine2: string;
  @Column({ nullable: true }) city: string;
  @Column({ nullable: true }) state: string;
  @Column({ nullable: true }) country: string;
  @Column({ nullable: true }) pincode: string;

  @Column({ type: 'numeric', nullable: true }) latitude: number;
  @Column({ type: 'numeric', nullable: true }) longitude: number;

  @Column({ default: false }) isPaid: boolean;

  @Column({ nullable: true }) cancelReason: string;
  @Column({ nullable: true }) cancelledAt: Date;
  @Column({ nullable: true }) assignedAt: Date;

  @ManyToOne(() => User)
  @Field(() => User)
  user: User;

  @Column({ nullable: true })
  deliveryPersonId: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  @Field(() => [OrderItem])
  items: OrderItem[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}