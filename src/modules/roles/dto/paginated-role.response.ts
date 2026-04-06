import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Role } from '../entity/roles.entity';

@ObjectType()
export class PaginatedRolesResponse {
  @Field(() => [Role])
  roles!: Role[];

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
export class RoleListPaginatedResponse {
  @Field()
  statusCode!: number;

  @Field()
  message!: string;

  @Field(() => PaginatedRolesResponse, { nullable: true })
  data?: PaginatedRolesResponse;
}
