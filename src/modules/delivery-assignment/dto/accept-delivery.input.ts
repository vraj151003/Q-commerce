import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AcceptDeliveryInput {
  @Field()
  assignmentId: string;
}
