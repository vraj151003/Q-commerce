import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryAssignment } from './entity/delivery-assignment.entity';
import { DeliveryAssignmentService } from './delivery-assignment.service';
import { DeliveryAssignmentResolver } from './delivery-assignment.resolver';
import { DeliveryAssignmentScheduler } from './delivery-assignment.scheduler';
import { Order } from '../orders/entity/order.entity';
import { DeliveryProfile } from '../delivery-profile/entity/delivery-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeliveryAssignment,
      Order,
      DeliveryProfile,
    ]),
  ],
  providers: [
    DeliveryAssignmentService,
    DeliveryAssignmentResolver,
    DeliveryAssignmentScheduler,
  ],
  exports: [DeliveryAssignmentService],
})
export class DeliveryAssignmentModule {}
