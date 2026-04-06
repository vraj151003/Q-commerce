import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateShopInput {
  @Field(() => String)
  id: string;

  @Field({ nullable: true })
  shopName?: string;

  @Field({ nullable: true })
  addressLine1?: string;

  @Field({ nullable: true })
  addressLine2?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  pinCode?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  pickupAddress?: string;

  @Field({ nullable: true })
  gstNumber?: string;

  @Field({ nullable: true })
  panNumber?: string;

  @Field({ nullable: true })
  businessRegistrationNumber?: string;

  @Field({ nullable: true })
  fssaiNumber?: string;

  @Field({ nullable: true })
  accountHolderName?: string;

  @Field({ nullable: true })
  accountNumber?: string;

  @Field({ nullable: true })
  ifscCode?: string;

  @Field({ nullable: true })
  bankName?: string;

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
