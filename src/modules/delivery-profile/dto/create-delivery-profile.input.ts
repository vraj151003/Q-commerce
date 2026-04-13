import { Field, InputType } from "@nestjs/graphql";

// create-delivery-profile.input.ts
@InputType()
export class CreateDeliveryProfileInput {
  @Field() vehicleType: string;
  @Field() vehicleName: string;

  @Field() rcBookPhoto: string;
  @Field() licensePhoto: string;

  @Field() addressLine1: string;
  @Field({ nullable: true }) addressLine2?: string;

  @Field() city: string;
  @Field() state: string;
  @Field() pincode: string;

  @Field({ nullable: true }) location?: string;

  @Field() latitude: number;
  @Field() longitude: number;
}