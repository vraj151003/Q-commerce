import { Field, InputType } from "@nestjs/graphql";
import { paymentMethod } from "../../../common/constant/status";

@InputType()
export class CreateOrderInput {
  @Field() 
  addressLine1: string;

  @Field({ nullable: true }) 
  addressLine2?: string;

  @Field() 
  city: string;
  
  @Field() 
  state: string;
  
  @Field()
  country: string;
  
  @Field()
  pincode: string;
  
  @Field({ nullable: true }) 
  latitude?: number;
  
  @Field({ nullable: true }) 
  longitude?: number;

  @Field(() => paymentMethod)
  paymentMethod: paymentMethod;
}