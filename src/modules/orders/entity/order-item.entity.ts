// src/order/entity/order-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Order } from './order.entity';

@ObjectType()
@Entity('order_item')
export class OrderItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  quantity: number;

  @Field()
  @Column({ type: 'numeric' })
  price: number;

  @Field()
  @Column({ type: 'numeric' })
  totalPrice: number;

  @Field()
  @Column()
  productId: string;

  @Field({ nullable: true })
  @Column({ type: 'numeric', nullable: true, default: 0 })
  cgstAmount: number;

  @Field({ nullable: true })
  @Column({ type: 'numeric', nullable: true, default: 0 })
  sgstAmount: number;

  @Field({ nullable: true })
  @Column({ type: 'numeric', nullable: true, default: 0 })
  igstAmount: number;

  @Field({ nullable: true })
  @Column({ type: 'numeric', nullable: true, default: 0 })
  gstRate: number;

  @Field({ nullable: true })
  @Column({ type: 'numeric', nullable: true, default: 0 })
  totalAmountWithTax: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  sellerState: string;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  order: Order;
}