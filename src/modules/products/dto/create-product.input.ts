import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateProductInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  longDescription?: string;

  @Field()
  mrp: number;

  @Field()
  sellingPrice: number;

  @Field({ nullable: true })
  discountPercentage?: number;

  @Field()
  stockQuantity: number;

  @Field({ defaultValue: true })
  isAvailable?: boolean;

  @Field({ nullable: true })
  lowStockThreshold?: number;

  @Field()
  unit: string;

  @Field({ nullable: true })
  unitValue?: number;

  @Field({ nullable: true })
  packSize?: string;

  @Field({ nullable: true })
  brand?: string;

  @Field()
  isVeg: boolean;

  @Field({ nullable: true })
  expiryDays?: number;

  @Field(() => [String], { nullable: true })
  images?: string[];

  @Field({ nullable: true })
  shopId?: string;

  @Field({ nullable: true })
  categoryId?: string;

  @Field({ nullable: true })
  subCategoryId?: string;
}
