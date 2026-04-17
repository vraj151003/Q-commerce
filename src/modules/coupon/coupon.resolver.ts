import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { Coupon } from './entity/coupon.entity';
import { CreateCouponInput, UpdateCouponInput, ApplyCouponInput, ApplyCouponResponse } from './dto/coupon.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Resolver(() => Coupon)
export class CouponResolver {
  constructor(private couponService: CouponService) {}

  @Query(() => [Coupon], { description: 'Get all coupons (admin only)' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions('READ_COUPON')
  async getCoupons(): Promise<Coupon[]> {
    return this.couponService.findAll();
  }

  @Query(() => Coupon, { description: 'Get a single coupon by ID (admin only)' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions('READ_COUPON')
  async getCoupon(@Args('id') id: string): Promise<Coupon> {
    return this.couponService.findOne(id);
  }

  @Query(() => Coupon, { description: 'Get coupon by code' })
  @UseGuards(GqlAuthGuard)
  async getCouponByCode(@Args('code') code: string): Promise<Coupon> {
    return this.couponService.findByCode(code);
  }

  @Mutation(() => Coupon, { description: 'Create a new coupon (admin only)' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions('CREATE_COUPON')
  async createCoupon(
    @Args('input') input: CreateCouponInput,
  ): Promise<Coupon> {
    return this.couponService.createCoupon(input);
  }

  @Mutation(() => Coupon, { description: 'Update a coupon (admin only)' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_COUPON')
  async updateCoupon(
    @Args('id') id: string,
    @Args('input') input: UpdateCouponInput,
  ): Promise<Coupon> {
    return this.couponService.updateCoupon(id, input);
  }

  @Mutation(() => Boolean, { description: 'Delete a coupon (admin only)' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions('DELETE_COUPON')
  async deleteCoupon(@Args('id') id: string): Promise<boolean> {
    await this.couponService.deleteCoupon(id);
    return true;
  }

  @Mutation(() => ApplyCouponResponse, { description: 'Apply coupon code to order' })
  @UseGuards(GqlAuthGuard)
  async applyCoupon(
    @Args('input') input: ApplyCouponInput,
  ): Promise<ApplyCouponResponse> {
    return this.couponService.applyCoupon(input);
  }
}
