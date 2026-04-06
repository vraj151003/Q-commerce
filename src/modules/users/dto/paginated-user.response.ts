import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../entity/users.entity';

@ObjectType()
export class PaginatedUsersResponse {
  @Field(() => [User])
  users!: User[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  totalPages!: number;
}

@ObjectType()
export class UserListPaginatedResponse {
  @Field()
  statusCode!: number;

  @Field()
  message!: string;

  @Field(() => PaginatedUsersResponse, { nullable: true })
  data?: PaginatedUsersResponse;
}
