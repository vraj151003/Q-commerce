import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { Coupon } from './entity/coupon.entity';
import { CreateCouponInput, UpdateCouponInput, ApplyCouponInput } from './dto/coupon.dto';
import { DiscountType } from 'src/common/constant/status';

describe('CouponService', () => {
  let service: CouponService;
  let couponRepo: any;

  const getMockCoupon = () => ({
    id: '1',
    code: 'SAVE10',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxDiscountAmount: 50,
    minOrderAmount: 100,
    startDate: new Date('2024-01-01'),
    expiryDate: new Date('2030-12-31'),
    usageLimit: 100,
    usageCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const mockCoupon = getMockCoupon();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: getRepositoryToken(Coupon),
          useValue: {
            create: jest.fn().mockReturnValue(getMockCoupon()),
            save: jest.fn().mockResolvedValue(getMockCoupon()),
            find: jest.fn().mockResolvedValue([getMockCoupon()]),
            findOne: jest.fn().mockResolvedValue(getMockCoupon()),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
    couponRepo = module.get(getRepositoryToken(Coupon));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCoupon', () => {
    it('should create a coupon', async () => {
      const input: CreateCouponInput = {
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        maxDiscountAmount: 50,
        minOrderAmount: 100,
        usageLimit: 100,
        isActive: true,
      };

      const result = await service.createCoupon(input);

      expect(couponRepo.create).toHaveBeenCalledWith(input);
      expect(couponRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
      });
    });
  });

  describe('findAll', () => {
    it('should return all coupons', async () => {
      const result = await service.findAll();

      expect(couponRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single coupon', async () => {
      const result = await service.findOne('1');

      expect(couponRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
      });
    });

    it('should throw NotFoundException if coupon not found', async () => {
      couponRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return coupon by code', async () => {
      const result = await service.findByCode('SAVE10');

      expect(couponRepo.findOne).toHaveBeenCalledWith({ where: { code: 'SAVE10' } });
      expect(result).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
      });
    });

    it('should throw NotFoundException if coupon not found', async () => {
      couponRepo.findOne.mockResolvedValue(null);

      await expect(service.findByCode('SAVE10')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCoupon', () => {
    it('should update a coupon', async () => {
      const input: UpdateCouponInput = {
        discountValue: 20,
      };

      const result = await service.updateCoupon('1', input);

      expect(couponRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(couponRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
      });
    });

    it('should throw NotFoundException if coupon not found', async () => {
      couponRepo.findOne.mockResolvedValue(null);

      await expect(service.updateCoupon('1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCoupon', () => {
    it('should delete a coupon', async () => {
      const mockCoupon = getMockCoupon();
      couponRepo.findOne.mockResolvedValue(mockCoupon);
      await service.deleteCoupon('1');

      expect(couponRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(couponRepo.remove).toHaveBeenCalledWith(mockCoupon);
    });

    it('should throw NotFoundException if coupon not found', async () => {
      couponRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteCoupon('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateCoupon', () => {
    beforeEach(() => {
      couponRepo.findOne.mockReset();
      couponRepo.findOne.mockResolvedValue(getMockCoupon());
    });

    it('should validate an active coupon', async () => {
      const result = await service.validateCoupon('SAVE10', 150);

      expect(result).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
      });
    });

    it('should throw BadRequestException if coupon is not active', async () => {
      couponRepo.findOne.mockResolvedValue({ ...getMockCoupon(), isActive: false });

      await expect(service.validateCoupon('SAVE10', 150)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if coupon is not yet valid (before start date)', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...getMockCoupon(),
        startDate: new Date('2030-01-01'),
      });

      await expect(service.validateCoupon('SAVE10', 150)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if coupon has expired', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...getMockCoupon(),
        expiryDate: new Date('2020-01-01'),
      });

      await expect(service.validateCoupon('SAVE10', 150)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if usage limit reached', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...getMockCoupon(),
        usageLimit: 10,
        usageCount: 10,
      });

      await expect(service.validateCoupon('SAVE10', 150)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if minimum order amount not met', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...getMockCoupon(),
        minOrderAmount: 200,
      });

      await expect(service.validateCoupon('SAVE10', 150)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('applyCoupon', () => {
    beforeEach(() => {
      couponRepo.findOne.mockReset();
      couponRepo.findOne.mockResolvedValue({ ...getMockCoupon() });
    });

    it('should apply percentage discount', async () => {
      const input: ApplyCouponInput = {
        code: 'SAVE10',
        orderAmount: 100,
      };

      const result = await service.applyCoupon(input);

      expect(result.discountAmount).toBe(10);
      expect(result.finalAmount).toBe(90);
    });

    it('should apply fixed discount', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...getMockCoupon(),
        discountType: DiscountType.FIXED,
        discountValue: 20,
      });

      const input: ApplyCouponInput = {
        code: 'SAVE20',
        orderAmount: 100,
      };

      const result = await service.applyCoupon(input);

      expect(result.discountAmount).toBe(20);
      expect(result.finalAmount).toBe(80);
    });

    it('should respect max discount amount for percentage coupons', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...getMockCoupon(),
        discountValue: 50,
        maxDiscountAmount: 30,
      });

      const input: ApplyCouponInput = {
        code: 'SAVE50',
        orderAmount: 100,
      };

      const result = await service.applyCoupon(input);

      expect(result.discountAmount).toBe(30);
      expect(result.finalAmount).toBe(70);
    });

    it('should not allow negative final amount', async () => {
      couponRepo.findOne.mockResolvedValue({
        ...getMockCoupon(),
        discountValue: 150,
        maxDiscountAmount: null,
      });

      const input: ApplyCouponInput = {
        code: 'SAVE150',
        orderAmount: 100,
      };

      const result = await service.applyCoupon(input);

      expect(result.finalAmount).toBe(0);
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment coupon usage count', async () => {
      await service.incrementUsageCount('1');

      expect(couponRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(couponRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if coupon not found', async () => {
      couponRepo.findOne.mockResolvedValue(null);

      await expect(service.incrementUsageCount('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
