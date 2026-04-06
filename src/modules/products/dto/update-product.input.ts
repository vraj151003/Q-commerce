import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateProductInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  longDescription?: string;

  @Field({ nullable: true })
  mrp?: number;

  @Field({ nullable: true })
  sellingPrice?: number;

  @Field({ nullable: true })
  discountPercentage?: number;

  @Field({ nullable: true })
  stockQuantity?: number;

  @Field({ nullable: true })
  isAvailable?: boolean;

  @Field({ nullable: true })
  lowStockThreshold?: number;

  @Field({ nullable: true })
  unit?: string;

  @Field({ nullable: true })
  unitValue?: number;

  @Field({ nullable: true })
  packSize?: string;

  @Field({ nullable: true })
  brand?: string;

  @Field({ nullable: true })
  isVeg?: boolean;

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
