import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class VerifyOtpInput {
  @Field()
  email: string;

  @Field()
  otp: string;
}
