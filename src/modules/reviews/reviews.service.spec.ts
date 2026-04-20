import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ProductReview } from './entity/product-review.entity';
import { SellerReview } from './entity/seller-review.entity';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let productReviewRepo: any;
  let sellerReviewRepo: any;
  let orderRepo: any;
  let productRepo: any;
  let shopRepo: any;
  let userRepo: any;

  const mockUser = {
    id: 'user-id-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  const mockProduct = {
    id: 'product-id-1',
    name: 'Test Product',
    price: 100,
  };

  const mockShop = {
    id: 'shop-id-1',
    name: 'Test Shop',
  };

  const mockOrder = {
    id: 'order-id-1',
    totalAmount: 200,
    status: 'DELIVERED',
    user: mockUser,
    items: [
      { productId: 'product-id-1', quantity: 2 },
    ],
  };

  const mockProductReview = {
    id: 'review-id-1',
    rating: 5,
    comment: 'Great product!',
    media: 'https://example.com/image.jpg',
    user: mockUser,
    product: mockProduct,
    order: mockOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSellerReview = {
    id: 'seller-review-id-1',
    rating: 4,
    comment: 'Good seller',
    user: mockUser,
    shop: mockShop,
    order: mockOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    productReviewRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    sellerReviewRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    orderRepo = {
      findOne: jest.fn(),
    };

    productRepo = {
      findOne: jest.fn(),
    };

    shopRepo = {
      findOne: jest.fn(),
    };

    userRepo = {
      findOne: jest.fn(),
    };

    service = new ReviewsService(
      productReviewRepo,
      sellerReviewRepo,
      orderRepo,
      productRepo,
      shopRepo,
      userRepo,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProductReview', () => {
    const input = {
      rating: 5,
      comment: 'Great product!',
      media: 'https://example.com/image.jpg',
      productId: 'product-id-1',
      orderId: 'order-id-1',
    };

    it('should create a product review successfully', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productReviewRepo.findOne.mockResolvedValue(null);
      productRepo.findOne.mockResolvedValue(mockProduct);
      userRepo.findOne.mockResolvedValue(mockUser);
      productReviewRepo.create.mockReturnValue(mockProductReview);
      productReviewRepo.save.mockResolvedValue(mockProductReview);

      const result = await service.createProductReview('user-id-1', input);

      expect(result).toEqual(mockProductReview);
      expect(orderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'order-id-1' },
        relations: ['items', 'user'],
      });
      expect(productReviewRepo.create).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Great product!',
        media: 'https://example.com/image.jpg',
        user: mockUser,
        product: mockProduct,
        order: mockOrder,
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        'Order not found',
      );
    });

    it('should throw BadRequestException if user does not own the order', async () => {
      const otherUserOrder = { ...mockOrder, user: { id: 'other-user-id' } };
      orderRepo.findOne.mockResolvedValue(otherUserOrder);

      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        'You can only review products from your own orders',
      );
    });

    it('should throw BadRequestException if product not in order', async () => {
      const orderWithoutProduct = {
        ...mockOrder,
        items: [{ productId: 'other-product-id', quantity: 1 }],
      };
      orderRepo.findOne.mockResolvedValue(orderWithoutProduct);
      productReviewRepo.findOne.mockResolvedValue(null);

      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        'This product is not in your order',
      );
    });

    it('should throw BadRequestException if user already reviewed product for this order', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productReviewRepo.findOne.mockResolvedValue(mockProductReview);

      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        'You have already reviewed this product for this order',
      );
    });

    it('should throw BadRequestException if rating is less than 1', async () => {
      const invalidInput = { ...input, rating: 0.5 };
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productReviewRepo.findOne.mockResolvedValue(null);

      await expect(service.createProductReview('user-id-1', invalidInput)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createProductReview('user-id-1', invalidInput)).rejects.toThrow(
        'Rating must be between 1 and 5',
      );
    });

    it('should throw BadRequestException if rating is greater than 5', async () => {
      const invalidInput = { ...input, rating: 5.5 };
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productReviewRepo.findOne.mockResolvedValue(null);

      await expect(service.createProductReview('user-id-1', invalidInput)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createProductReview('user-id-1', invalidInput)).rejects.toThrow(
        'Rating must be between 1 and 5',
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productReviewRepo.findOne.mockResolvedValue(null);
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        'Product not found',
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productReviewRepo.findOne.mockResolvedValue(null);
      productRepo.findOne.mockResolvedValue(mockProduct);
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createProductReview('user-id-1', input)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('createSellerReview', () => {
    const input = {
      rating: 4,
      comment: 'Good seller',
      shopId: 'shop-id-1',
      orderId: 'order-id-1',
    };

    it('should create a seller review successfully', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productRepo.findOne.mockResolvedValue({ ...mockProduct, shop: mockShop });
      sellerReviewRepo.findOne.mockResolvedValue(null);
      shopRepo.findOne.mockResolvedValue(mockShop);
      userRepo.findOne.mockResolvedValue(mockUser);
      sellerReviewRepo.create.mockReturnValue(mockSellerReview);
      sellerReviewRepo.save.mockResolvedValue(mockSellerReview);

      const result = await service.createSellerReview('user-id-1', input);

      expect(result).toEqual(mockSellerReview);
      expect(orderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'order-id-1' },
        relations: ['user', 'items'],
      });
      expect(sellerReviewRepo.create).toHaveBeenCalledWith({
        rating: 4,
        comment: 'Good seller',
        user: mockUser,
        shop: mockShop,
        order: mockOrder,
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.createSellerReview('user-id-1', input)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createSellerReview('user-id-1', input)).rejects.toThrow(
        'Order not found',
      );
    });

    it('should throw BadRequestException if user does not own the order', async () => {
      const otherUserOrder = { ...mockOrder, user: { id: 'other-user-id' } };
      orderRepo.findOne.mockResolvedValue(otherUserOrder);

      await expect(service.createSellerReview('user-id-1', input)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createSellerReview('user-id-1', input)).rejects.toThrow(
        'You can only review sellers from your own orders',
      );
    });

    it('should throw NotFoundException if product or shop not found', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.createSellerReview('user-id-1', input)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createSellerReview('user-id-1', input)).rejects.toThrow(
        'Product or shop not found',
      );
    });

    it('should throw BadRequestException if shopId does not match product shop', async () => {
      const otherShop = { id: 'other-shop-id', name: 'Other Shop' };
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productRepo.findOne.mockResolvedValue({ ...mockProduct, shop: otherShop });

      await expect(service.createSellerReview('user-id-1', input)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createSellerReview('user-id-1', input)).rejects.toThrow(
        'This shop is not associated with this order',
      );
    });

    it('should throw BadRequestException if user already reviewed seller for this order', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productRepo.findOne.mockResolvedValue({ ...mockProduct, shop: mockShop });
      sellerReviewRepo.findOne.mockResolvedValue(mockSellerReview);

      await expect(service.createSellerReview('user-id-1', input)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createSellerReview('user-id-1', input)).rejects.toThrow(
        'You have already reviewed this seller for this order',
      );
    });

    it('should throw BadRequestException if rating is invalid', async () => {
      const invalidInput = { ...input, rating: 5.5 };
      orderRepo.findOne.mockResolvedValue(mockOrder);
      productRepo.findOne.mockResolvedValue({ ...mockProduct, shop: mockShop });
      sellerReviewRepo.findOne.mockResolvedValue(null);

      await expect(service.createSellerReview('user-id-1', invalidInput)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createSellerReview('user-id-1', invalidInput)).rejects.toThrow(
        'Rating must be between 1 and 5',
      );
    });
  });

  describe('getProductReviews', () => {
    it('should return product reviews', async () => {
      productReviewRepo.find.mockResolvedValue([mockProductReview]);

      const result = await service.getProductReviews('product-id-1');

      expect(result).toEqual([mockProductReview]);
      expect(productReviewRepo.find).toHaveBeenCalledWith({
        where: { product: { id: 'product-id-1' } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getSellerReviews', () => {
    it('should return seller reviews', async () => {
      sellerReviewRepo.find.mockResolvedValue([mockSellerReview]);

      const result = await service.getSellerReviews('shop-id-1');

      expect(result).toEqual([mockSellerReview]);
      expect(sellerReviewRepo.find).toHaveBeenCalledWith({
        where: { shop: { id: 'shop-id-1' } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getMyProductReviews', () => {
    it('should return user product reviews', async () => {
      productReviewRepo.find.mockResolvedValue([mockProductReview]);

      const result = await service.getMyProductReviews('user-id-1');

      expect(result).toEqual([mockProductReview]);
      expect(productReviewRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-id-1' } },
        relations: ['product', 'order'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getMySellerReviews', () => {
    it('should return user seller reviews', async () => {
      sellerReviewRepo.find.mockResolvedValue([mockSellerReview]);

      const result = await service.getMySellerReviews('user-id-1');

      expect(result).toEqual([mockSellerReview]);
      expect(sellerReviewRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-id-1' } },
        relations: ['shop', 'order'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getProductAverageRating', () => {
    it('should return 0 when no reviews exist', async () => {
      productReviewRepo.find.mockResolvedValue([]);

      const result = await service.getProductAverageRating('product-id-1');

      expect(result).toBe(0);
    });

    it('should calculate average rating correctly', async () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ];
      productReviewRepo.find.mockResolvedValue(reviews);

      const result = await service.getProductAverageRating('product-id-1');

      expect(result).toBe(4); // (5 + 4 + 3) / 3 = 4
    });
  });

  describe('getSellerAverageRating', () => {
    it('should return 0 when no reviews exist', async () => {
      sellerReviewRepo.find.mockResolvedValue([]);

      const result = await service.getSellerAverageRating('shop-id-1');

      expect(result).toBe(0);
    });

    it('should calculate average rating correctly', async () => {
      const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
      ];
      sellerReviewRepo.find.mockResolvedValue(reviews);

      const result = await service.getSellerAverageRating('shop-id-1');

      expect(result).toBeCloseTo(4.67, 2); // (5 + 5 + 4) / 3 = 4.666...
    });
  });

  describe('getAllProductReviews', () => {
    it('should return all product reviews', async () => {
      productReviewRepo.find.mockResolvedValue([mockProductReview]);

      const result = await service.getAllProductReviews();

      expect(result).toEqual([mockProductReview]);
      expect(productReviewRepo.find).toHaveBeenCalledWith({
        relations: ['user', 'product', 'order'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getAllSellerReviews', () => {
    it('should return all seller reviews', async () => {
      sellerReviewRepo.find.mockResolvedValue([mockSellerReview]);

      const result = await service.getAllSellerReviews();

      expect(result).toEqual([mockSellerReview]);
      expect(sellerReviewRepo.find).toHaveBeenCalledWith({
        relations: ['user', 'shop', 'order'],
        order: { createdAt: 'DESC' },
      });
    });
  });
});
