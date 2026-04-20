import { Field, InputType, Float } from '@nestjs/graphql';

@InputType()
export class UpdateSellerReviewInput {
  @Field(() => String)
  id: string;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => String, { nullable: true })
  comment?: string;
}
