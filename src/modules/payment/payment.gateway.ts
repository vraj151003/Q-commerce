import { Injectable, Logger, UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard';

interface PaymentStatusNotification {
  orderId: string;
  status: string;
  paymentIntentId?: string;
  errorMessage?: string;
  timestamp?: Date;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: 'payment',
})
@UseGuards(WsJwtAuthGuard)
export class PaymentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PaymentGateway.name);

  @WebSocketServer()
  server: Server;

  // Optional: Keep map for quick lookup (but not primary source in production)
  private connectedClients = new Map<string, Socket>();

  handleConnection(@ConnectedSocket() client: Socket) {
    const userId =
      client.data?.user?.id || (client.handshake.query.userId as string);

    if (!userId) {
      this.logger.warn(`Client ${client.id} connected without userId`);
      client.disconnect(true);
      return;
    }
    this.connectedClients.set(userId, client);
    client.data.userId = userId;

    this.logger.log(`User ${userId} connected to payment gateway`);
    client.join(`user_${userId}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedClients.delete(userId);
      this.logger.log(`User ${userId} disconnected`);
    }
  }

  notifyPaymentStatus(userId: string, data: PaymentStatusNotification) {
    const payload = {
      ...data,
      timestamp: new Date(),
    };

    const client = this.connectedClients.get(userId);
    if (client) {
      client.emit('paymentStatus', payload);
    }

    // Method 2: Broadcast to room (works better with Redis adapter)
    this.server.to(`user_${userId}`).emit('paymentStatus', payload);
  }

  /**
   * Client can manually join their payment room
   */
  @SubscribeMessage('join_payment_room')
  handleJoinPaymentRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const authenticatedUserId = client.data?.userId;

    if (authenticatedUserId !== userId) {
      client.emit('error', { message: 'Unauthorized room access' });
      return;
    }

    client.join(`user_${userId}`);
    this.logger.debug(`User ${userId} joined payment room`);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
