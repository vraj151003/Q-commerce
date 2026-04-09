import { Field, InputType } from '@nestjs/graphql';

// add item
@InputType()
export class AddToCartInput {
  @Field()
  productId: string;

  @Field()
  quantity: number;

  @Field()
  price: number;
}
