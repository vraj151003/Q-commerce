import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './entity/notification.entity';
import { CreateNotificationInput } from './dto/notification.dto';
import { NotificationStatus, NotificationType } from 'src/common/constant/status';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepo: any;

  const mockNotification = {
    id: '1',
    type: NotificationType.ORDER_CREATED,
    title: 'Test Notification',
    message: 'Test message',
    status: NotificationStatus.UNREAD,
    userId: 'user-1',
    orderId: 'order-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn().mockReturnValue(mockNotification),
            save: jest.fn().mockResolvedValue(mockNotification),
            find: jest.fn().mockResolvedValue([mockNotification]),
            findOne: jest.fn().mockResolvedValue(mockNotification),
            update: jest.fn().mockResolvedValue(undefined),
            remove: jest.fn().mockResolvedValue(undefined),
            count: jest.fn().mockResolvedValue(0),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepo = module.get(getRepositoryToken(Notification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const input: CreateNotificationInput = {
        type: NotificationType.ORDER_CREATED,
        title: 'Test',
        message: 'Test message',
        userId: 'user-1',
        orderId: 'order-1',
      };

      notificationRepo.create.mockReturnValue(mockNotification);
      notificationRepo.save.mockResolvedValue(mockNotification);

      const result = await service.createNotification(input);

      expect(notificationRepo.create).toHaveBeenCalledWith(input);
      expect(notificationRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });
  });

  describe('findAll', () => {
    it('should return all notifications for a user', async () => {
      const notifications = [mockNotification];
      notificationRepo.find.mockResolvedValue(notifications);

      const result = await service.findAll('user-1');

      expect(notificationRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(notifications);
    });
  });

  describe('findUnread', () => {
    it('should return unread notifications for a user', async () => {
      const notifications = [mockNotification];
      notificationRepo.find.mockResolvedValue(notifications);

      const result = await service.findUnread('user-1');

      expect(notificationRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: NotificationStatus.UNREAD },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(notifications);
    });
  });

  describe('findOne', () => {
    it('should return a single notification', async () => {
      notificationRepo.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne('1', 'user-1');

      expect(notificationRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: 'user-1' },
      });
      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundException if notification not found', async () => {
      notificationRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      notificationRepo.findOne.mockResolvedValue(mockNotification);
      notificationRepo.save.mockResolvedValue({
        ...mockNotification,
        status: NotificationStatus.READ,
      });

      const result = await service.markAsRead('1', 'user-1');

      expect(notificationRepo.save).toHaveBeenCalledWith({
        ...mockNotification,
        status: NotificationStatus.READ,
      });
      expect(result.status).toBe(NotificationStatus.READ);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      notificationRepo.update.mockResolvedValue(undefined);

      await service.markAllAsRead('user-1');

      expect(notificationRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', status: NotificationStatus.UNREAD },
        { status: NotificationStatus.READ },
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      notificationRepo.findOne.mockResolvedValue(mockNotification);
      notificationRepo.remove.mockResolvedValue(undefined);

      await service.deleteNotification('1', 'user-1');

      expect(notificationRepo.remove).toHaveBeenCalledWith(mockNotification);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      notificationRepo.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(notificationRepo.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: NotificationStatus.UNREAD },
      });
      expect(result).toBe(5);
    });
  });

  describe('createOrderNotification', () => {
    it('should create notifications for customer and seller', async () => {
      notificationRepo.create.mockReturnValue(mockNotification);
      notificationRepo.save.mockResolvedValue(mockNotification);

      await service.createOrderNotification('user-1', 'order-1', 'seller-1');

      expect(notificationRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should only create customer notification if sellerId is undefined', async () => {
      notificationRepo.create.mockReturnValue(mockNotification);
      notificationRepo.save.mockResolvedValue(mockNotification);

      await service.createOrderNotification('user-1', 'order-1', undefined);

      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('createStatusChangeNotification', () => {
    it('should create status change notification', async () => {
      notificationRepo.create.mockReturnValue(mockNotification);
      notificationRepo.save.mockResolvedValue(mockNotification);

      await service.createStatusChangeNotification('user-1', 'order-1', 'CONFIRMED');

      expect(notificationRepo.create).toHaveBeenCalledWith({
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Order Status Updated',
        message: 'Your order status has been updated to CONFIRMED.',
        userId: 'user-1',
        orderId: 'order-1',
      });
      expect(notificationRepo.save).toHaveBeenCalled();
    });
  });

  describe('createCancellationNotification', () => {
    it('should create cancellation notification', async () => {
      notificationRepo.create.mockReturnValue(mockNotification);
      notificationRepo.save.mockResolvedValue(mockNotification);

      await service.createCancellationNotification('user-1', 'order-1');

      expect(notificationRepo.create).toHaveBeenCalledWith({
        type: NotificationType.ORDER_CANCELLED,
        title: 'Order Cancelled',
        message: 'Your order has been cancelled.',
        userId: 'user-1',
        orderId: 'order-1',
      });
      expect(notificationRepo.save).toHaveBeenCalled();
    });
  });
});
