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

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  order: Order;
}