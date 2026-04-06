import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../modules/auth/gql-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { OtpQueueService } from './otp-queue.service';
import { BooleanResponse, QueueStatusResponse } from '../dto/api-response.dto';

@Resolver()
export class QueueResolver {
  constructor(private readonly otpQueueService: OtpQueueService) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => QueueStatusResponse, { name: 'admin_getQueueStatus' })
  async getQueueStatus() {
    const status = await this.otpQueueService.getQueueStatus();
    return {
      statusCode: 200,
      message: 'Queue status retrieved successfully',
      data: status,
    };
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => BooleanResponse, { name: 'admin_clearQueue' })
  async clearQueue() {
    await this.otpQueueService.clearQueue();
    return {
      statusCode: 200,
      message: 'Queue cleared successfully',
      data: true,
    };
  }
}
