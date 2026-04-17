import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entity/coupon.entity';
import { CouponService } from './coupon.service';
import { CouponResolver } from './coupon.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon])],
  providers: [CouponService, CouponResolver],
  exports: [CouponService],
})
export class CouponModule {}
