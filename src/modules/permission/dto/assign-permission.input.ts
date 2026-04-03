// src/permissions/dto/assign-permission.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class AssignPermissionInput {
  @Field(() => Int)
  roleId: number;

  @Field(() => Int)
  permissionId: number;
}
