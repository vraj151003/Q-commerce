import { Field, InputType, Float } from '@nestjs/graphql';

@InputType()
export class CreateProductReviewInput {
  @Field(() => Float)
  rating: number;

  @Field({ nullable: true })
  comment?: string;

  @Field({ nullable: true })
  media?: string;

  @Field()
  productId: string;

  @Field()
  orderId: string;
}
