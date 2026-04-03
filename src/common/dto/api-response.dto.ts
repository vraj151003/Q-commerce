import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class ApiResponse<TData> {
  @Field(() => Int)
  statusCode: number;

  @Field()
  message: string;

  @Field({ nullable: true })
  data?: TData;
}

@ObjectType()
export class SuccessResponse {
  @Field(() => Int)
  statusCode: number;

  @Field()
  message: string;
}

@ObjectType()
export class ErrorResponse {
  @Field(() => Int)
  statusCode: number;

  @Field()
  message: string;
}
