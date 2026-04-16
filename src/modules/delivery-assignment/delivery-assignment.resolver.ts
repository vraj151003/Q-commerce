import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeliveryAssignment } from './entity/delivery-assignment.entity';
import { Injectable, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DeliveryAssignmentService } from './delivery-assignment.service';
import { AcceptDeliveryInput } from './dto/accept-delivery.input';
import { RejectDeliveryInput } from './dto/reject-delivery.input';

@Resolver(() => DeliveryAssignment)
@Injectable()
@UseGuards(GqlAuthGuard, RolesGuard)
export class DeliveryAssignmentResolver {
  constructor(private deliveryAssignmentService: DeliveryAssignmentService) {}

  @Mutation(() => DeliveryAssignment)
  @Roles('admin', 'delivery')
  acceptDelivery(
    @Args('input') input: AcceptDeliveryInput,
    @Context() ctx: any,
  ) {
    return this.deliveryAssignmentService.acceptDelivery(input, ctx.req.user);
  }

  @Mutation(() => DeliveryAssignment)
  @Roles('admin', 'delivery')
  rejectDelivery(
    @Args('input') input: RejectDeliveryInput,
    @Context() ctx: any,
  ) {
    return this.deliveryAssignmentService.rejectDelivery(input, ctx.req.user);
  }

  @Query(() => [DeliveryAssignment])
  @Roles('admin', 'delivery')
  getMyAssignments(@Context() ctx: any) {
    return this.deliveryAssignmentService.getMyAssignments(ctx.req.user);
  }

  @Query(() => DeliveryAssignment, { nullable: true })
  @Roles('admin', 'delivery')
  getPendingAssignment(@Args('orderId') orderId: string) {
    return this.deliveryAssignmentService.getPendingAssignment(orderId);
  }
}
