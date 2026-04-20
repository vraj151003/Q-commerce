import { Field, InputType, Float } from '@nestjs/graphql';

@InputType()
export class UpdateProductReviewInput {
  @Field(() => String)
  id: string;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => String, { nullable: true })
  comment?: string;

  @Field(() => String, { nullable: true })
  media?: string;
}
