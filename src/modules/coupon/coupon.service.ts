import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './entity/coupon.entity';
import { CreateCouponInput, UpdateCouponInput, ApplyCouponInput } from './dto/coupon.dto';
import { DiscountType } from 'src/common/constant/status';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,
  ) {}

  async createCoupon(input: CreateCouponInput): Promise<Coupon> {
    const coupon = this.couponRepo.create(input);
    return this.couponRepo.save(coupon);
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({ where: { code } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async updateCoupon(id: string, input: UpdateCouponInput): Promise<Coupon> {
    const coupon = await this.findOne(id);
    Object.assign(coupon, input);
    return this.couponRepo.save(coupon);
  }

  async deleteCoupon(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepo.remove(coupon);
  }

  async validateCoupon(code: string, orderAmount: number): Promise<Coupon> {
    const coupon = await this.findByCode(code);

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is not active');
    }

    if (coupon.startDate && new Date() < coupon.startDate) {
      throw new BadRequestException('Coupon is not yet valid');
    }

    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount of ${coupon.minOrderAmount} required to use this coupon`,
      );
    }

    return coupon;
  }

  async applyCoupon(input: ApplyCouponInput): Promise<{
    coupon: Coupon;
    discountAmount: number;
    finalAmount: number;
  }> {
    const coupon = await this.validateCoupon(input.code, input.orderAmount);

    let discountAmount: number;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (input.orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    const finalAmount = Math.max(0, input.orderAmount - discountAmount);

    return {
      coupon,
      discountAmount,
      finalAmount,
    };
  }

  async incrementUsageCount(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    coupon.usageCount += 1;
    await this.couponRepo.save(coupon);
  }
}
