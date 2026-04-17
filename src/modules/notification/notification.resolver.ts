import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './entity/notification.entity';
import { CreateNotificationInput, UpdateNotificationInput } from './dto/notification.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(private notificationService: NotificationService) {}

  @Query(() => [Notification], { description: 'Get all notifications for current user' })
  @UseGuards(GqlAuthGuard)
  async getNotifications(@Context() context: any): Promise<Notification[]> {
    const user = context.req.user;
    return this.notificationService.findAll(user.userId);
  }

  @Query(() => [Notification], { description: 'Get unread notifications for current user' })
  @UseGuards(GqlAuthGuard)
  async getUnreadNotifications(@Context() context: any): Promise<Notification[]> {
    const user = context.req.user;
    return this.notificationService.findUnread(user.userId);
  }

  @Query(() => Notification, { description: 'Get a single notification by ID' })
  @UseGuards(GqlAuthGuard)
  async getNotification(
    @Args('id') id: string,
    @Context() context: any,
  ): Promise<Notification> {
    const user = context.req.user;
    return this.notificationService.findOne(id, user.userId);
  }

  @Query(() => Number, { description: 'Get unread notification count for current user' })
  @UseGuards(GqlAuthGuard)
  async getUnreadCount(@Context() context: any): Promise<number> {
    const user = context.req.user;
    return this.notificationService.getUnreadCount(user.userId);
  }

  @Mutation(() => Notification, { description: 'Mark a notification as read' })
  @UseGuards(GqlAuthGuard)
  async markNotificationAsRead(
    @Args('id') id: string,
    @Context() context: any,
  ): Promise<Notification> {
    const user = context.req.user;
    return this.notificationService.markAsRead(id, user.userId);
  }

  @Mutation(() => Boolean, { description: 'Mark all notifications as read' })
  @UseGuards()
  async markAllNotificationsAsRead(@Context() context: any): Promise<boolean> {
    const user = context.req.user;
    await this.notificationService.markAllAsRead(user.userId);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Delete a notification' })
  @UseGuards(GqlAuthGuard)
  async deleteNotification(
    @Args('id') id: string,
    @Context() context: any,
  ): Promise<boolean> {
    const user = context.req.user;
    await this.notificationService.deleteNotification(id, user.userId);
    return true;
  }

  @Mutation(() => Notification, { description: 'Create a new notification (admin only)' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions('CREATE_NOTIFICATION')
  async createNotification(
    @Args('input') input: CreateNotificationInput,
  ): Promise<Notification> {
    return this.notificationService.createNotification(input);
  }
}
