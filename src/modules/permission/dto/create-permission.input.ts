import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreatePermissionInput {
  @Field()
  name: string;
}
