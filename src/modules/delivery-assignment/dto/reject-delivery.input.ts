import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RejectDeliveryInput {
  @Field()
  assignmentId: string;

  @Field({ nullable: true })
  reason?: string;
}
