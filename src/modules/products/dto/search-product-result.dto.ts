import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SearchProductResult {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description: string;

  @Field()
  mrp: number;

  @Field()
  sellingPrice: number;

  @Field({ nullable: true })
  category: string;

  @Field({ nullable: true })
  subCategory: string;

  @Field({ nullable: true })
  shop: string;

  @Field()
  isAvailable: boolean;

  @Field()
  stockQuantity: number;

  @Field()
  score: number;
}
