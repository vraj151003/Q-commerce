import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { User } from '../../users/entity/users.entity';
import { Shop } from '../../shop/entity/shop.entity';
import { Order } from '../../orders/entity/order.entity';

@ObjectType()
@Entity('seller_review')
export class SellerReview {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Float)
  @Column()
  rating: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  comment: string;

  @ManyToOne(() => User)
  @Field(() => User)
  user: User;

  @ManyToOne(() => Shop)
  @Field(() => Shop)
  shop: Shop;

  @ManyToOne(() => Order)
  @Field(() => Order)
  order: Order;

  @CreateDateColumn()
  @Field()
  createdAt: Date;

  @UpdateDateColumn()
  @Field()
  updatedAt: Date;
}
