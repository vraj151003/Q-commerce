import { Field, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { DiscountType } from 'src/common/constant/status';
import { Coupon } from '../entity/coupon.entity';

registerEnumType(DiscountType, {
  name: 'DiscountType',
});

@InputType()
export class CreateCouponInput {
  @Field()
  code: string;

  @Field(() => DiscountType)
  discountType: DiscountType;

  @Field()
  discountValue: number;

  @Field({ nullable: true })
  maxDiscountAmount?: number;

  @Field({ nullable: true })
  minOrderAmount?: number;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  expiryDate?: Date;

  @Field({ nullable: true, defaultValue: 0 })
  usageLimit?: number;

  @Field({ nullable: true, defaultValue: true })
  isActive?: boolean;
}

@InputType()
export class UpdateCouponInput {
  @Field({ nullable: true })
  code?: string;

  @Field(() => DiscountType, { nullable: true })
  discountType?: DiscountType;

  @Field({ nullable: true })
  discountValue?: number;

  @Field({ nullable: true })
  maxDiscountAmount?: number;

  @Field({ nullable: true })
  minOrderAmount?: number;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  expiryDate?: Date;

  @Field({ nullable: true })
  usageLimit?: number;

  @Field({ nullable: true })
  isActive?: boolean;
}

@InputType()
export class ApplyCouponInput {
  @Field()
  code: string;

  @Field()
  orderAmount: number;
}

@ObjectType()
export class ApplyCouponResponse {
  @Field(() => Coupon)
  coupon: Coupon;

  @Field(() => Number)
  discountAmount: number;

  @Field(() => Number)
  finalAmount: number;
}
