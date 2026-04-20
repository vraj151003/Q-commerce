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
import { Product } from '../../products/entity/product.entity';
import { Order } from '../../orders/entity/order.entity';

@ObjectType()
@Entity('product_review')
export class ProductReview {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Float)
  @Column()
  rating: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  comment: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  media: string;

  @ManyToOne(() => User)
  @Field(() => User)
  user: User;

  @ManyToOne(() => Product)
  @Field(() => Product)
  product: Product;

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
