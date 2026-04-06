import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { Shop } from '../../shop/entity/shop.entity';
import { Category } from '../../category/entity/category.entity';
import { SubCategory } from '../../subcategory/entity/subcategory.entity';

@ObjectType()
@Entity()
export class Product {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  longDescription: string;

  @Field()
  @Column({ type: 'numeric' })
  mrp: number;

  @Field()
  @Column({ type: 'numeric' })
  sellingPrice: number;

  @Field({ nullable: true })
  @Column({ type: 'numeric', nullable: true })
  discountPercentage: number;

  @Field()
  @Column()
  stockQuantity: number;

  @Field()
  @Column({ default: true })
  isAvailable: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lowStockThreshold: number;

  @Field()
  @Column()
  unit: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  unitValue: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  packSize: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  brand: string;

  @Field()
  @Column()
  isVeg: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  expiryDays: number;

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, nullable: true })
  images: string[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  shopId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  categoryId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  subCategoryId: string;

  @Field(() => Shop, { nullable: true })
  @ManyToOne(() => Shop, { nullable: true })
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Field(() => SubCategory, { nullable: true })
  @ManyToOne(() => SubCategory, { nullable: true })
  @JoinColumn({ name: 'subCategoryId' })
  subCategory: SubCategory;
}
