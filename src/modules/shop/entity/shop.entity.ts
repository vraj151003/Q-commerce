import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entity/users.entity';

@ObjectType()
@Entity('shops')
export class Shop {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  shopName: string;

  @Field()
  @Column()
  addressLine1: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  addressLine2?: string;

  @Field()
  @Column()
  city: string;

  @Field()
  @Column()
  state: string;

  @Field()
  @Column()
  pinCode: string;

  @Field()
  @Column({ default: 'India' })
  country: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  pickupAddress?: string;

  @Field()
  @Column()
  gstNumber: string;

  @Field()
  @Column()
  panNumber: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  businessRegistrationNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  fssaiNumber?: string;

  @Field()
  @Column()
  accountHolderName: string;

  @Field()
  @Column()
  accountNumber: string;

  @Field()
  @Column()
  ifscCode: string;

  @Field()
  @Column()
  bankName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  cancelledChequeImage?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  alternatePhone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  whatsappNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  websiteUrl?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  instagram?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  facebook?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  sellerId?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  shopLicense?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sellerId' })
  @Field(() => User, { nullable: true })
  seller?: User;
}
