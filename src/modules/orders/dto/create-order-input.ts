import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CreateOrderInput {
  @Field() addressLine1: string;
  @Field({ nullable: true }) addressLine2?: string;
  @Field() city: string;
  @Field() state: string;
  @Field() country: string;
  @Field() pincode: string;
}