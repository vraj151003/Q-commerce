import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entity/users.entity';
import { Order } from '../../orders/entity/order.entity';
import { NotificationStatus, NotificationType } from 'src/common/constant/status';


@ObjectType()
@Entity('notification')
@Index(['userId'])
@Index(['orderId'])
export class Notification {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => NotificationType)
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column({ type: 'text' })
  message: string;

  @Field(() => NotificationStatus)
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Field(() => User)
  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Field(() => Order, { nullable: true })
  @ManyToOne(() => Order, { nullable: true })
  order: Order;

  @Column({ nullable: true })
  orderId: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  sellerId: string | null;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  metadata: string;
}
