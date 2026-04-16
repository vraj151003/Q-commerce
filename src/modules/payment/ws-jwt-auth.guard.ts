import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Socket } from 'socket.io';

type SocketHandshake = {
  headers?: Record<string, string | string[] | undefined>;
  auth?: Record<string, unknown>;
  query?: Record<string, unknown>;
};

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const client = context.switchToWs().getClient<Socket>();
    const handshake = (client.handshake ?? {}) as SocketHandshake;
    const token =
      typeof handshake.auth?.token === 'string'
        ? handshake.auth.token
        : typeof handshake.query?.token === 'string'
          ? handshake.query.token
          : undefined;

    const headers = {
      ...handshake.headers,
      authorization:
        typeof handshake.headers?.authorization === 'string'
          ? handshake.headers.authorization
          : token
            ? `Bearer ${token}`
            : undefined,
    };

    return {
      ...handshake,
      headers,
    };
  }

  handleRequest(err: unknown, user: unknown, info: unknown, context: ExecutionContext) {
    const client = context.switchToWs().getClient<Socket>();

    if (user) {
      client.data.user = user;
    }

    return super.handleRequest(err, user, info, context);
  }
}
