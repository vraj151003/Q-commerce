import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import { PaymentGateway } from './payment.gateway';

describe('PaymentGateway', () => {
  let gateway: PaymentGateway;
  let mockServer: jest.Mocked<Server>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalEnv = process.env;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentGateway],
    }).compile();

    gateway = module.get<PaymentGateway>(PaymentGateway);

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  describe('handleConnection', () => {
    it('should successfully connect a client with userId from data', () => {
      const mockClient = {
        id: 'client-123',
        data: { user: { id: 'user-123' } },
        disconnect: jest.fn(),
        join: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(mockClient);

      expect(mockClient.data.userId).toBe('user-123');
      expect(mockClient.join).toHaveBeenCalledWith('user_user-123');
      expect(gateway['connectedClients'].get('user-123')).toBe(mockClient);
    });

    it('should successfully connect a client with userId from handshake query', () => {
      const mockClient = {
        id: 'client-123',
        data: {},
        handshake: { query: { userId: 'user-123' } },
        disconnect: jest.fn(),
        join: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(mockClient);

      expect(mockClient.data.userId).toBe('user-123');
      expect(mockClient.join).toHaveBeenCalledWith('user_user-123');
      expect(gateway['connectedClients'].get('user-123')).toBe(mockClient);
    });

    it('should disconnect client when userId is not available', () => {
      const mockClient = {
        id: 'client-123',
        data: {},
        handshake: { query: {} },
        disconnect: jest.fn(),
        join: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
      expect(mockClient.join).not.toHaveBeenCalled();
      expect(gateway['connectedClients'].has('user-123')).toBe(false);
    });

    it('should disconnect client when userId is null', () => {
      const mockClient = {
        id: 'client-123',
        data: { user: { id: null } },
        handshake: { query: {} },
        disconnect: jest.fn(),
        join: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it('should disconnect client when userId is undefined', () => {
      const mockClient = {
        id: 'client-123',
        data: { user: { id: undefined } },
        handshake: { query: {} },
        disconnect: jest.fn(),
        join: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it('should disconnect client when userId is empty string', () => {
      const mockClient = {
        id: 'client-123',
        data: { user: { id: '' } },
        handshake: { query: {} },
        disconnect: jest.fn(),
        join: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it('should handle connection with very long userId', () => {
      const longUserId = 'a'.repeat(1000);
      const mockClient = {
        id: 'client-123',
        data: { user: { id: longUserId } },
        disconnect: jest.fn(),
        join: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(mockClient);

      expect(mockClient.data.userId).toBe(longUserId);
      expect(mockClient.join).toHaveBeenCalledWith(`user_${longUserId}`);
    });

    it('should handle connection with special characters in userId', () => {
      const specialUserId = 'user_123!@#$%^&*()';
      const mockClient = {
        id: 'client-123',
        data: { user: { id: specialUserId } },
        disconnect: jest.fn(),
        join: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(mockClient);

      expect(mockClient.data.userId).toBe(specialUserId);
      expect(mockClient.join).toHaveBeenCalledWith(`user_${specialUserId}`);
    });

    it('should prefer data.user.id over handshake.query.userId', () => {
      const mockClient = {
        id: 'client-123',
        data: { user: { id: 'user-from-data' } },
        handshake: { query: { userId: 'user-from-query' } },
        disconnect: jest.fn(),
        join: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(mockClient);

      expect(mockClient.data.userId).toBe('user-from-data');
      expect(mockClient.join).toHaveBeenCalledWith('user_user-from-data');
    });
  });

  describe('handleDisconnect', () => {
    it('should successfully disconnect a client', () => {
      const mockClient = {
        id: 'client-123',
        data: { userId: 'user-123' },
      } as unknown as Socket;

      gateway['connectedClients'].set('user-123', mockClient);

      gateway.handleDisconnect(mockClient);

      expect(gateway['connectedClients'].has('user-123')).toBe(false);
    });

    it('should handle disconnect when userId is not set', () => {
      const mockClient = {
        id: 'client-123',
        data: {},
      } as unknown as Socket;

      gateway.handleDisconnect(mockClient);

      expect(gateway['connectedClients'].has('undefined')).toBe(false);
    });

    it('should handle disconnect when userId is null', () => {
      const mockClient = {
        id: 'client-123',
        data: { userId: null },
      } as unknown as Socket;

      gateway.handleDisconnect(mockClient);

      expect(gateway['connectedClients'].has('null')).toBe(false);
    });

    it('should handle disconnect when userId is undefined', () => {
      const mockClient = {
        id: 'client-123',
        data: { userId: undefined },
      } as unknown as Socket;

      gateway.handleDisconnect(mockClient);

      expect(gateway['connectedClients'].has('undefined')).toBe(false);
    });

    it('should handle disconnect when client was not in connectedClients', () => {
      const mockClient = {
        id: 'client-123',
        data: { userId: 'user-123' },
      } as unknown as Socket;

      gateway.handleDisconnect(mockClient);

      expect(gateway['connectedClients'].has('user-123')).toBe(false);
    });
  });

  describe('notifyPaymentStatus', () => {
    it('should notify connected client via direct emit', () => {
      const mockClient = {
        emit: jest.fn(),
      } as unknown as Socket;

      gateway['connectedClients'].set('user-123', mockClient);

      gateway.notifyPaymentStatus('user-123', {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
      });

      expect(mockClient.emit).toHaveBeenCalledWith('paymentStatus', {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
        timestamp: expect.any(Date),
      });
    });

    it('should notify via room broadcast', () => {
      gateway.notifyPaymentStatus('user-123', {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
      });

      expect(mockServer.to).toHaveBeenCalledWith('user_user-123');
      expect(mockServer.emit).toHaveBeenCalledWith('paymentStatus', {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
        timestamp: expect.any(Date),
      });
    });

    it('should not emit to client when not connected', () => {
      const mockClient = {
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.notifyPaymentStatus('user-123', {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
      });

      expect(mockClient.emit).not.toHaveBeenCalled();
      expect(mockServer.to).toHaveBeenCalledWith('user_user-123');
      expect(mockServer.emit).toHaveBeenCalled();
    });

    it('should handle notification with errorMessage', () => {
      const mockClient = {
        emit: jest.fn(),
      } as unknown as Socket;

      gateway['connectedClients'].set('user-123', mockClient);

      gateway.notifyPaymentStatus('user-123', {
        orderId: 'order-123',
        status: 'FAILED',
        paymentIntentId: 'pi_123',
        errorMessage: 'Payment declined',
      });

      expect(mockClient.emit).toHaveBeenCalledWith('paymentStatus', {
        orderId: 'order-123',
        status: 'FAILED',
        paymentIntentId: 'pi_123',
        errorMessage: 'Payment declined',
        timestamp: expect.any(Date),
      });
    });

    it('should handle notification with custom timestamp (gateway adds its own)', () => {
      const mockClient = {
        emit: jest.fn(),
      } as unknown as Socket;

      gateway['connectedClients'].set('user-123', mockClient);
      const customTimestamp = new Date('2024-01-01T00:00:00Z');

      gateway.notifyPaymentStatus('user-123', {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
        timestamp: customTimestamp,
      });

      expect(mockClient.emit).toHaveBeenCalledWith('paymentStatus', {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
        timestamp: expect.any(Date),
      });
    });

    it('should handle notification with null userId', () => {
      gateway.notifyPaymentStatus(null as any, {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
      });

      expect(mockServer.to).toHaveBeenCalledWith('user_null');
      expect(mockServer.emit).toHaveBeenCalled();
    });

    it('should handle notification with undefined userId', () => {
      gateway.notifyPaymentStatus(undefined as any, {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
      });

      expect(mockServer.to).toHaveBeenCalledWith('user_undefined');
      expect(mockServer.emit).toHaveBeenCalled();
    });

    it('should handle notification with empty string userId', () => {
      gateway.notifyPaymentStatus('', {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
      });

      expect(mockServer.to).toHaveBeenCalledWith('user_');
      expect(mockServer.emit).toHaveBeenCalled();
    });

    it('should handle notification with very long userId', () => {
      const longUserId = 'a'.repeat(1000);
      gateway.notifyPaymentStatus(longUserId, {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
      });

      expect(mockServer.to).toHaveBeenCalledWith(`user_${longUserId}`);
      expect(mockServer.emit).toHaveBeenCalled();
    });

    it('should handle notification with special characters in userId', () => {
      const specialUserId = 'user_123!@#$%^&*()';
      gateway.notifyPaymentStatus(specialUserId, {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
      });

      expect(mockServer.to).toHaveBeenCalledWith(`user_${specialUserId}`);
      expect(mockServer.emit).toHaveBeenCalled();
    });

    it('should handle notification with minimal data', () => {
      const mockClient = {
        emit: jest.fn(),
      } as unknown as Socket;

      gateway['connectedClients'].set('user-123', mockClient);

      gateway.notifyPaymentStatus('user-123', {
        orderId: 'order-123',
        status: 'COMPLETED',
      });

      expect(mockClient.emit).toHaveBeenCalledWith('paymentStatus', {
        orderId: 'order-123',
        status: 'COMPLETED',
        timestamp: expect.any(Date),
      });
    });

    it('should handle notification with all optional fields', () => {
      const mockClient = {
        emit: jest.fn(),
      } as unknown as Socket;

      gateway['connectedClients'].set('user-123', mockClient);

      gateway.notifyPaymentStatus('user-123', {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
        errorMessage: 'Payment declined',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      });

      expect(mockClient.emit).toHaveBeenCalledWith('paymentStatus', {
        orderId: 'order-123',
        status: 'COMPLETED',
        paymentIntentId: 'pi_123',
        errorMessage: 'Payment declined',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('handleJoinPaymentRoom', () => {
    it('should successfully join authenticated user to their payment room', () => {
      const mockClient = {
        data: { userId: 'user-123' },
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleJoinPaymentRoom('user-123', mockClient);

      expect(mockClient.join).toHaveBeenCalledWith('user_user-123');
      expect(mockClient.emit).not.toHaveBeenCalled();
    });

    it('should emit error when userId does not match authenticated user', () => {
      const mockClient = {
        data: { userId: 'user-123' },
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleJoinPaymentRoom('user-456', mockClient);

      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized room access',
      });
    });

    it('should emit error when trying to join with null userId', () => {
      const mockClient = {
        data: { userId: 'user-123' },
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleJoinPaymentRoom(null as any, mockClient);

      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized room access',
      });
    });

    it('should emit error when trying to join with undefined userId', () => {
      const mockClient = {
        data: { userId: 'user-123' },
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleJoinPaymentRoom(undefined as any, mockClient);

      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized room access',
      });
    });

    it('should emit error when trying to join with empty string userId', () => {
      const mockClient = {
        data: { userId: 'user-123' },
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleJoinPaymentRoom('', mockClient);

      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized room access',
      });
    });

    it('should emit error when authenticated user is null', () => {
      const mockClient = {
        data: { userId: null },
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleJoinPaymentRoom('user-123', mockClient);

      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized room access',
      });
    });

    it('should emit error when authenticated user is undefined', () => {
      const mockClient = {
        data: { userId: undefined },
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleJoinPaymentRoom('user-123', mockClient);

      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized room access',
      });
    });

    it('should handle joining with very long userId', () => {
      const longUserId = 'a'.repeat(1000);
      const mockClient = {
        data: { userId: longUserId },
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleJoinPaymentRoom(longUserId, mockClient);

      expect(mockClient.join).toHaveBeenCalledWith(`user_${longUserId}`);
      expect(mockClient.emit).not.toHaveBeenCalled();
    });

    it('should handle joining with special characters in userId', () => {
      const specialUserId = 'user_123!@#$%^&*()';
      const mockClient = {
        data: { userId: specialUserId },
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleJoinPaymentRoom(specialUserId, mockClient);

      expect(mockClient.join).toHaveBeenCalledWith(`user_${specialUserId}`);
      expect(mockClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('getConnectedUsers', () => {
    it('should return array of connected user IDs', () => {
      gateway['connectedClients'].set('user-123', {} as Socket);
      gateway['connectedClients'].set('user-456', {} as Socket);

      const result = gateway.getConnectedUsers();

      expect(result).toEqual(['user-123', 'user-456']);
    });

    it('should return empty array when no users connected', () => {
      const result = gateway.getConnectedUsers();

      expect(result).toEqual([]);
    });

    it('should return array with single user when only one user connected', () => {
      gateway['connectedClients'].set('user-123', {} as Socket);

      const result = gateway.getConnectedUsers();

      expect(result).toEqual(['user-123']);
    });

    it('should handle very large number of connected users', () => {
      for (let i = 0; i < 1000; i++) {
        gateway['connectedClients'].set(`user-${i}`, {} as Socket);
      }

      const result = gateway.getConnectedUsers();

      expect(result.length).toBe(1000);
    });
  });

  describe('Gateway Configuration', () => {
    it('should have @WebSocketGateway decorator', () => {
      expect(PaymentGateway).toBeDefined();
    });

    it('should have @Injectable decorator', () => {
      expect(PaymentGateway).toBeDefined();
    });

    it('should have Logger instance', () => {
      expect(gateway).toBeDefined();
    });

    it('should have connectedClients map initialized', () => {
      expect(gateway['connectedClients']).toBeInstanceOf(Map);
      expect(gateway['connectedClients'].size).toBe(0);
    });

    it('should implement OnGatewayConnection', () => {
      expect(gateway.handleConnection).toBeDefined();
    });

    it('should implement OnGatewayDisconnect', () => {
      expect(gateway.handleDisconnect).toBeDefined();
    });
  });
});
