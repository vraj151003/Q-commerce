import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Permission } from '../entity/permission.entity';

@ObjectType()
export class PaginatedPermissionsResponse {
  @Field(() => [Permission])
  permissions!: Permission[];

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
export class PermissionListPaginatedResponse {
  @Field()
  statusCode!: number;

  @Field()
  message!: string;

  @Field(() => PaginatedPermissionsResponse, { nullable: true })
  data?: PaginatedPermissionsResponse;
}
