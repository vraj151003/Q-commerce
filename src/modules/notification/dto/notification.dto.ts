import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { NotificationStatus, NotificationType } from 'src/common/constant/status';

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

registerEnumType(NotificationStatus, {
  name: 'NotificationStatus',
});

@InputType()
export class CreateNotificationInput {
  @Field(() => NotificationType)
  type: NotificationType;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field()
  userId: string;

  @Field({ nullable: true })
  orderId?: string;

  @Field({ nullable: true })
  sellerId?: string;

  @Field({ nullable: true })
  metadata?: string;
}

@InputType()
export class UpdateNotificationInput {
  @Field(() => NotificationStatus)
  status: NotificationStatus;
}
