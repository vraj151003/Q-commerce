import { Field, InputType } from '@nestjs/graphql';

// update item
@InputType()
export class UpdateCartItemInput {
  @Field()
  productId: string;

  @Field()
  quantity: number;
}
