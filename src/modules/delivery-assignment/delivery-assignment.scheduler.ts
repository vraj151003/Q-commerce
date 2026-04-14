import { Injectable } from '@nestjs/common';
import { DeliveryAssignmentService } from './delivery-assignment.service';

@Injectable()
export class DeliveryAssignmentScheduler {
  private intervalId: NodeJS.Timeout;

  constructor(
    private readonly deliveryAssignmentService: DeliveryAssignmentService,
  ) {}

  onModuleInit() {
    // Run every 30 seconds to check for expired assignments and reassign them
    this.intervalId = setInterval(() => {
      this.deliveryAssignmentService.expirePendingAssignments().catch((error) => {
        console.error('Error checking expired assignments:', error);
      });
    }, 30000);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
