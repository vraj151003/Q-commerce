import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import request from 'supertest';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { registerEnumType } from '@nestjs/graphql';
import { NotificationType, NotificationStatus } from 'src/common/constant/status';
import { Notification } from './entity/notification.entity';

// Register enums for GraphQL schema in test context
registerEnumType(NotificationType, {
  name: 'NotificationType',
});

registerEnumType(NotificationStatus, {
  name: 'NotificationStatus',
});

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

const mockNotificationList = [mockNotification];

describe('NotificationResolver (feature)', () => {
  let app: INestApplication;
  let service: {
    findAll: jest.Mock;
    findUnread: jest.Mock;
    findOne: jest.Mock;
    getUnreadCount: jest.Mock;
    markAsRead: jest.Mock;
    markAllAsRead: jest.Mock;
    deleteNotification: jest.Mock;
    createNotification: jest.Mock;
  };

  beforeAll(async () => {
    service = {
      findAll: jest.fn(),
      findUnread: jest.fn(),
      findOne: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      createNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/graphql',
          context: ({ req }) => ({ req: { ...req, user: { userId: 'user-1' } } }),
        }),
      ],
      providers: [
        NotificationResolver,
        {
          provide: NotificationService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(GqlAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('getNotifications', () => {
    it('should successfully return all notifications', async () => {
      service.findAll.mockResolvedValue(mockNotificationList);

      const query = `
        query {
          getNotifications {
            id
            title
            message
            type
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.status).toBe(200);
      expect(response.body.data.getNotifications).toHaveLength(1);
      expect(response.body.data.getNotifications[0]).toMatchObject({
        id: '1',
        title: 'Test Notification',
        message: 'Test message',
        type: NotificationType.ORDER_CREATED,
        status: NotificationStatus.UNREAD,
      });
      expect(service.findAll).toHaveBeenCalledWith('user-1');
    });

    it('should propagate errors from service', async () => {
      service.findAll.mockRejectedValue(new Error('Service error'));

      const query = `
        query {
          getNotifications {
            id
            title
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });

    it('should handle empty notifications list', async () => {
      service.findAll.mockResolvedValue([]);

      const query = `
        query {
          getNotifications {
            id
            title
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.status).toBe(200);
      expect(response.body.data.getNotifications).toEqual([]);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should successfully return unread notifications', async () => {
      service.findUnread.mockResolvedValue(mockNotificationList);

      const query = `
        query {
          getUnreadNotifications {
            id
            title
            message
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.status).toBe(200);
      expect(response.body.data.getUnreadNotifications).toHaveLength(1);
      expect(response.body.data.getUnreadNotifications[0]).toMatchObject({
        id: '1',
        title: 'Test Notification',
        message: 'Test message',
        status: NotificationStatus.UNREAD,
      });
      expect(service.findUnread).toHaveBeenCalledWith('user-1');
    });

    it('should propagate errors from service', async () => {
      service.findUnread.mockRejectedValue(new Error('Service error'));

      const query = `
        query {
          getUnreadNotifications {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('getNotification', () => {
    it('should successfully return a single notification', async () => {
      service.findOne.mockResolvedValue(mockNotification);

      const query = `
        query {
          getNotification(id: "1") {
            id
            title
            message
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.status).toBe(200);
      expect(response.body.data.getNotification).toMatchObject({
        id: '1',
        title: 'Test Notification',
        message: 'Test message',
      });
      expect(service.findOne).toHaveBeenCalledWith('1', 'user-1');
    });

    it('should propagate errors from service', async () => {
      service.findOne.mockRejectedValue(new Error('Service error'));

      const query = `
        query {
          getNotification(id: "1") {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });

    it('should handle null notification ID', async () => {
      service.findOne.mockResolvedValue(null);

      const query = `
        query {
          getNotification(id: null) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });

    it('should handle empty string notification ID', async () => {
      service.findOne.mockResolvedValue(null);

      const query = `
        query {
          getNotification(id: "") {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('getUnreadCount', () => {
    it('should successfully return unread notification count', async () => {
      service.getUnreadCount.mockResolvedValue(5);

      const query = `
        query {
          getUnreadCount
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.status).toBe(200);
      expect(response.body.data.getUnreadCount).toBe(5);
      expect(service.getUnreadCount).toHaveBeenCalledWith('user-1');
    });

    it('should propagate errors from service', async () => {
      service.getUnreadCount.mockRejectedValue(new Error('Service error'));

      const query = `
        query {
          getUnreadCount
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('markNotificationAsRead', () => {
    it('should successfully mark notification as read', async () => {
      service.markAsRead.mockResolvedValue({
        ...mockNotification,
        status: NotificationStatus.READ,
      });

      const query = `
        mutation {
          markNotificationAsRead(id: "1") {
            id
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.markNotificationAsRead.status).toBe(
        NotificationStatus.READ,
      );
      expect(service.markAsRead).toHaveBeenCalledWith('1', 'user-1');
    });

    it('should propagate errors from service', async () => {
      service.markAsRead.mockRejectedValue(new Error('Service error'));

      const query = `
        mutation {
          markNotificationAsRead(id: "1") {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });

    it('should handle null notification ID', async () => {
      service.markAsRead.mockRejectedValue(new Error('Invalid ID'));

      const query = `
        mutation {
          markNotificationAsRead(id: null) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should successfully mark all notifications as read', async () => {
      service.markAllAsRead.mockResolvedValue(undefined);

      const query = `
        mutation {
          markAllNotificationsAsRead
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.markAllNotificationsAsRead).toBe(true);
      expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
    });

    it('should propagate errors from service', async () => {
      service.markAllAsRead.mockRejectedValue(new Error('Service error'));

      const query = `
        mutation {
          markAllNotificationsAsRead
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('deleteNotification', () => {
    it('should successfully delete notification', async () => {
      service.deleteNotification.mockResolvedValue(undefined);

      const query = `
        mutation {
          deleteNotification(id: "1")
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteNotification).toBe(true);
      expect(service.deleteNotification).toHaveBeenCalledWith('1', 'user-1');
    });

    it('should propagate errors from service', async () => {
      service.deleteNotification.mockRejectedValue(new Error('Service error'));

      const query = `
        mutation {
          deleteNotification(id: "1")
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });

    it('should handle null notification ID', async () => {
      service.deleteNotification.mockRejectedValue(new Error('Invalid ID'));

      const query = `
        mutation {
          deleteNotification(id: null)
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });

    it('should handle empty string notification ID', async () => {
      service.deleteNotification.mockRejectedValue(new Error('Invalid ID'));

      const query = `
        mutation {
          deleteNotification(id: "")
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('createNotification', () => {
    it('should successfully create a notification', async () => {
      service.createNotification.mockResolvedValue(mockNotification);

      const query = `
        mutation {
          createNotification(input: {
            type: ORDER_CREATED
            title: "Test"
            message: "Test message"
            userId: "user-1"
          }) {
            id
            title
            message
            type
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.createNotification).toMatchObject({
        id: '1',
        title: 'Test Notification',
        message: 'Test message',
        type: NotificationType.ORDER_CREATED,
      });
      expect(service.createNotification).toHaveBeenCalled();
    });

    it('should propagate errors from service', async () => {
      service.createNotification.mockRejectedValue(new Error('Service error'));

      const query = `
        mutation {
          createNotification(input: {
            type: ORDER_CREATED
            title: "Test"
            message: "Test message"
            userId: "user-1"
          }) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });

    it('should handle null input', async () => {
      service.createNotification.mockRejectedValue(new Error('Invalid input'));

      const query = `
        mutation {
          createNotification(input: null) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });

    it('should handle empty input fields', async () => {
      service.createNotification.mockRejectedValue(
        new Error('Validation error'),
      );

      const query = `
        mutation {
          createNotification(input: {
            type: ORDER_CREATED
            title: ""
            message: ""
            userId: ""
          }) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });
});
