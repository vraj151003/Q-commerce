// src/delivery-profile/entity/delivery-profile.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from 'src/modules/users/entity/users.entity';

@ObjectType()
@Entity('delivery_profile')
export class DeliveryProfile {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field() 
  @Column()
  vehicleType: string;
  
  @Field() @Column() vehicleName: string;

  @Field() @Column() rcBookPhoto: string;
  @Field() @Column() licensePhoto: string;

  @Field() @Column() addressLine1: string;
  @Field({ nullable: true }) @Column({ nullable: true }) addressLine2: string;

  @Field() @Column() city: string;
  @Field() @Column() state: string;
  @Field() @Column() pincode: string;

  @Field({ nullable: true }) @Column({ nullable: true }) location: string;

  @Field() @Column({ type: 'numeric' }) latitude: number;
  @Field() @Column({ type: 'numeric' }) longitude: number;

  @Field() @Column({ default: true }) isAvailable: boolean;

  @ManyToOne(() => User)
  @Field(() => User)
  user: User;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}