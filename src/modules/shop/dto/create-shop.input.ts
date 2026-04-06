import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateShopInput {
  @Field()
  shopName: string;

  @Field()
  addressLine1: string;

  @Field({ nullable: true })
  addressLine2?: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  pinCode: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  pickupAddress?: string;

  @Field()
  gstNumber: string;

  @Field()
  panNumber: string;

  @Field({ nullable: true })
  businessRegistrationNumber?: string;

  @Field({ nullable: true })
  fssaiNumber?: string;

  @Field()
  accountHolderName: string;

  @Field()
  accountNumber: string;

  @Field()
  ifscCode: string;

  @Field()
  bankName: string;

  @Field({ nullable: true })
  cancelledChequeImage?: string;

  @Field({ nullable: true })
  alternatePhone?: string;

  @Field({ nullable: true })
  whatsappNumber?: string;

  @Field({ nullable: true })
  websiteUrl?: string;

  @Field({ nullable: true })
  instagram?: string;

  @Field({ nullable: true })
  facebook?: string;

  @Field({ nullable: true })
  shopLicense?: string;
}
