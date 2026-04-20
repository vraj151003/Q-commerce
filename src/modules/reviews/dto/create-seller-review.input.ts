import { Field, InputType, Float } from '@nestjs/graphql';

@InputType()
export class CreateSellerReviewInput {
  @Field(() => Float)
  rating: number;

  @Field({ nullable: true })
  comment?: string;

  @Field()
  shopId: string;

  @Field()
  orderId: string;
}
