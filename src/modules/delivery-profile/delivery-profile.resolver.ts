import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeliveryProfile } from './entity/delivery-profile.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { DeliveryProfileService } from './delivery-profile.service';
import { CreateDeliveryProfileInput } from './dto/create-delivery-profile.input';
import { UpdateDeliveryProfileInput } from './dto/update-delivery-profile.input';

@Resolver(() => DeliveryProfile)
@UseGuards(GqlAuthGuard, RolesGuard)
export class DeliveryProfileResolver {
  constructor(private deliveryProfileService: DeliveryProfileService) {}

  @Mutation(() => DeliveryProfile)
  createDeliveryProfile(
    @Args('input') input: CreateDeliveryProfileInput,
    @Context() ctx: any,
  ) {
    return this.deliveryProfileService.create(input, ctx.req.user);
  }

  @Query(() => [DeliveryProfile])
  getDeliveryProfiles(@Context() ctx: any) {
    return this.deliveryProfileService.findAll(ctx.req.user);
  }

  @Query(() => DeliveryProfile)
  getDeliveryProfile(@Args('id') id: string, @Context() ctx: any) {
    return this.deliveryProfileService.findOne(id, ctx.req.user);
  }

  @Mutation(() => DeliveryProfile)
  updateDeliveryProfile(
    @Args('input') input: UpdateDeliveryProfileInput,
    @Context() ctx: any,
  ) {
    return this.deliveryProfileService.update(input, ctx.req.user);
  }
}
