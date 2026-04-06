import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateUserProfileInput {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  mobile?: string;

  @Field({ nullable: true })
  password?: string;
}
