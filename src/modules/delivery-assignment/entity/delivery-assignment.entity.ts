import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Order } from '../../orders/entity/order.entity';
import { DeliveryProfile } from '../../delivery-profile/entity/delivery-profile.entity';

export enum AssignmentStatus {
  PENDING = 1,
  ACCEPTED = 2,
  REJECTED = 3,
  EXPIRED = 4,
}

@ObjectType()
@Entity('delivery_assignment')
export class DeliveryAssignment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Order)
  @ManyToOne(() => Order)
  order: Order;

  @Field(() => DeliveryProfile)
  @ManyToOne(() => DeliveryProfile)
  deliveryProfile: DeliveryProfile;

  @Field(() => Number)
  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @Field({ nullable: true })
  @Column({ type: 'numeric', nullable: true })
  distance: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  respondedAt: Date;

  @Field()
  @Column({ default: 0 })
  retryCount: number;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Field()
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
