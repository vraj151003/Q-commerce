import { Field, InputType } from "@nestjs/graphql";

// update-delivery-profile.input.ts
@InputType()
export class UpdateDeliveryProfileInput {
  @Field() id: string;

  @Field({ nullable: true }) vehicleType?: string;
  @Field({ nullable: true }) vehicleName?: string;

  @Field({ nullable: true }) rcBookPhoto?: string;
  @Field({ nullable: true }) licensePhoto?: string;

  @Field({ nullable: true }) addressLine1?: string;
  @Field({ nullable: true }) addressLine2?: string;

  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) pincode?: string;

  @Field({ nullable: true }) location?: string;

  @Field({ nullable: true }) latitude?: number;
  @Field({ nullable: true }) longitude?: number;

  @Field({ nullable: true }) isAvailable?: boolean;
}