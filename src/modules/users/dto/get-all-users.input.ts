import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class GetAllUsersInput {
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field({ nullable: true })
  search?: string;

  @Field(() => [String], { nullable: true })
  roleIds?: string[];

  @Field({ nullable: true })
  isVerified?: boolean;

  @Field({ nullable: true })
  adminApproved?: boolean;

  @Field(() => String, { nullable: true })
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email';

  @Field(() => String, { nullable: true })
  sortOrder?: 'ASC' | 'DESC';
}
