import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entity/users.entity';
import { Order } from '../../orders/entity/order.entity';
import { PaymentStatus, paymentMethod } from '../../../common/constant/status';

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'Payment status for a payment record',
});

registerEnumType(paymentMethod, {
  name: 'paymentMethod',
  description: 'Available payment methods for a payment record',
});

@ObjectType()
@Entity('payment')
export class Payment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'numeric' })
  amount: number;

  @Field()
  @Column({ default: 'usd' })
  currency: string;

  @Field(() => PaymentStatus)
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Field(() => paymentMethod)
  @Column({
    type: 'enum',
    enum: paymentMethod,
    default: paymentMethod.ONLINE_PAYMENT,
  })
  paymentMethod: paymentMethod;

  @Field({ nullable: true })
  @Column({ nullable: true })
  paymentIntentId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  clientSecret: string;

  @Field(() => String, { nullable: true, description: 'Serialized payment metadata JSON' })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Field(() => User)
  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Field(() => Order)
  @ManyToOne(() => Order, { nullable: true })
  order: Order;

  @Column({ default: false })
  isRefunded: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  refundId: string;

  @Field({ nullable: true })
  @Column({ type: 'numeric', nullable: true })
  refundAmount: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
