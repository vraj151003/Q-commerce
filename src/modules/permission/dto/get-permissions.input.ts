import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class GetPermissionsInput {
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field({ nullable: true })
  search?: string;

  @Field(() => String, { nullable: true })
  sortBy?: 'name' | 'createdAt';

  @Field(() => String, { nullable: true })
  sortOrder?: 'ASC' | 'DESC';
}
