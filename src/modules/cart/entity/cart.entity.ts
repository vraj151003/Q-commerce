// src/cart/entity/cart.entity.ts
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
import { CartItem } from './cart-item.entity';

@ObjectType()
@Entity('cart')
export class Cart {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ type: 'numeric', default: 0 })
  totalAmount: number;

  @Field()
  @Column({ default: 0 })
  totalItems: number;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @Field(() => User)
  user: User;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  @Field(() => [CartItem], { nullable: true })
  items: CartItem[];
}
