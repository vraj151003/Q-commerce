import { Field, ObjectType, Int } from '@nestjs/graphql';
import { User } from '../../modules/users/entity/users.entity';
import { AuthResponse } from '../../modules/auth/dto/auth.response';
import { Role } from '../../modules/roles/entity/roles.entity';
import { Permission } from '../../modules/permission/entity/permission.entity';
import { Shop } from '../../modules/shop/entity/shop.entity';

@ObjectType()
export class BaseResponse {
  @Field(() => Int)
  statusCode: number;

  @Field()
  message: string;
}

@ObjectType()
export class UserResponse extends BaseResponse {
  @Field(() => User, { nullable: true })
  data?: User;
}

@ObjectType()
export class AuthResponseWrapper extends BaseResponse {
  @Field(() => AuthResponse, { nullable: true })
  data?: AuthResponse;
}

@ObjectType()
export class UserListResponse extends BaseResponse {
  @Field(() => [User], { nullable: true })
  data?: User[];
}

@ObjectType()
export class RoleResponse extends BaseResponse {
  @Field(() => Role, { nullable: true })
  data?: Role;
}

@ObjectType()
export class RoleListResponse extends BaseResponse {
  @Field(() => [Role], { nullable: true })
  data?: Role[];
}

@ObjectType()
export class PermissionResponse extends BaseResponse {
  @Field(() => Permission, { nullable: true })
  data?: Permission;
}

@ObjectType()
export class PermissionListResponse extends BaseResponse {
  @Field(() => [Permission], { nullable: true })
  data?: Permission[];
}

@ObjectType()
export class ShopResponse extends BaseResponse {
  @Field(() => Shop, { nullable: true })
  data?: Shop;
}

@ObjectType()
export class ShopListResponse extends BaseResponse {
  @Field(() => [Shop], { nullable: true })
  data?: Shop[];
}

@ObjectType()
export class BooleanResponse extends BaseResponse {
  @Field(() => Boolean, { nullable: true })
  data?: boolean;
}

@ObjectType()
export class QueueStatus {
  @Field(() => Int)
  waiting: number;

  @Field(() => Int)
  active: number;

  @Field(() => Int)
  completed: number;

  @Field(() => Int)
  failed: number;
}

@ObjectType()
export class QueueStatusResponse extends BaseResponse {
  @Field(() => QueueStatus, { nullable: true })
  data?: QueueStatus;
}
