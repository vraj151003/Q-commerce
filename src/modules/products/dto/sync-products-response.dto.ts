import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SyncProductsResponse {
  @Field()
  indexed: number;
}
