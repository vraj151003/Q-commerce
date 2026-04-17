import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entity/notification.entity';
import { CreateNotificationInput } from './dto/notification.dto';
import { NotificationStatus, NotificationType } from 'src/common/constant/status';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const notification = this.notificationRepo.create(input);
    return this.notificationRepo.save(notification);
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId, status: NotificationStatus.UNREAD },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    notification.status = NotificationStatus.READ;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ },
    );
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.findOne(id, userId);
    await this.notificationRepo.remove(notification);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
  }

  async createOrderNotification(
    userId: string,
    orderId: string,
    sellerId: string | undefined,
  ): Promise<void> {
    await this.createNotification({
      type: NotificationType.ORDER_CREATED,
      title: 'Order Created',
      message: 'Your order has been created successfully.',
      userId,
      orderId,
      sellerId,
    });

    // Create notification for seller
    if (sellerId) {
      await this.createNotification({
        type: NotificationType.ORDER_CREATED,
        title: 'New Order Received',
        message: 'You have received a new order.',
        userId: sellerId,
        orderId,
      });
    }
  }

  async createStatusChangeNotification(
    userId: string,
    orderId: string,
    newStatus: string,
  ): Promise<void> {
    await this.createNotification({
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: 'Order Status Updated',
      message: `Your order status has been updated to ${newStatus}.`,
      userId,
      orderId,
    });
  }

  async createCancellationNotification(
    userId: string,
    orderId: string,
  ): Promise<void> {
    await this.createNotification({
      type: NotificationType.ORDER_CANCELLED,
      title: 'Order Cancelled',
      message: 'Your order has been cancelled.',
      userId,
      orderId,
    });
  }
}
