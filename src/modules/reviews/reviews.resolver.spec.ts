import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsResolver } from './reviews.resolver';
import { ReviewsService } from './reviews.service';
import { ProductReview } from './entity/product-review.entity';
import { SellerReview } from './entity/seller-review.entity';

describe('ReviewsResolver', () => {
  let resolver: ReviewsResolver;
  let service: {
    createProductReview: jest.Mock;
    createSellerReview: jest.Mock;
    getProductReviews: jest.Mock;
    getProductAverageRating: jest.Mock;
    getSellerReviews: jest.Mock;
    getSellerAverageRating: jest.Mock;
    getMyProductReviews: jest.Mock;
    getMySellerReviews: jest.Mock;
    getAllProductReviews: jest.Mock;
    getAllSellerReviews: jest.Mock;
  };

  const mockProductReview: ProductReview = {
    id: 'review-id-1',
    rating: 5,
    comment: 'Great product!',
    media: 'https://example.com/image.jpg',
    user: { id: 'user-id-1', firstName: 'John', lastName: 'Doe' } as any,
    product: { id: 'product-id-1', name: 'Test Product' } as any,
    order: { id: 'order-id-1', totalAmount: 100 } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSellerReview: SellerReview = {
    id: 'seller-review-id-1',
    rating: 4,
    comment: 'Good seller',
    user: { id: 'user-id-1', firstName: 'John', lastName: 'Doe' } as any,
    shop: { id: 'shop-id-1', name: 'Test Shop' } as any,
    order: { id: 'order-id-1', totalAmount: 100 } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCtx = {
    req: {
      user: {
        userId: 'user-id-1',
        role: 'customer',
      },
    },
  };

  beforeEach(async () => {
    service = {
      createProductReview: jest.fn(),
      createSellerReview: jest.fn(),
      getProductReviews: jest.fn(),
      getProductAverageRating: jest.fn(),
      getSellerReviews: jest.fn(),
      getSellerAverageRating: jest.fn(),
      getMyProductReviews: jest.fn(),
      getMySellerReviews: jest.fn(),
      getAllProductReviews: jest.fn(),
      getAllSellerReviews: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsResolver,
        {
          provide: ReviewsService,
          useValue: service,
        },
      ],
    }).compile();

    resolver = module.get<ReviewsResolver>(ReviewsResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProductReview', () => {
    it('should create a product review', async () => {
      const input = {
        rating: 5,
        comment: 'Great product!',
        media: 'https://example.com/image.jpg',
        productId: 'product-id-1',
        orderId: 'order-id-1',
      };

      service.createProductReview.mockResolvedValue(mockProductReview);

      const result = await resolver.createProductReview(input, mockCtx as any);

      expect(result).toEqual(mockProductReview);
      expect(service.createProductReview).toHaveBeenCalledWith('user-id-1', input);
    });
  });

  describe('createSellerReview', () => {
    it('should create a seller review', async () => {
      const input = {
        rating: 4,
        comment: 'Good seller',
        shopId: 'shop-id-1',
        orderId: 'order-id-1',
      };

      service.createSellerReview.mockResolvedValue(mockSellerReview);

      const result = await resolver.createSellerReview(input, mockCtx as any);

      expect(result).toEqual(mockSellerReview);
      expect(service.createSellerReview).toHaveBeenCalledWith('user-id-1', input);
    });
  });

  describe('getProductReviews', () => {
    it('should return product reviews', async () => {
      service.getProductReviews.mockResolvedValue([mockProductReview]);

      const result = await resolver.getProductReviews('product-id-1');

      expect(result).toEqual([mockProductReview]);
      expect(service.getProductReviews).toHaveBeenCalledWith('product-id-1');
    });
  });

  describe('getProductAverageRating', () => {
    it('should return average rating for product', async () => {
      service.getProductAverageRating.mockResolvedValue(4.5);

      const result = await resolver.getProductAverageRating('product-id-1');

      expect(result).toBe(4.5);
      expect(service.getProductAverageRating).toHaveBeenCalledWith('product-id-1');
    });
  });

  describe('getSellerReviews', () => {
    it('should return seller reviews', async () => {
      service.getSellerReviews.mockResolvedValue([mockSellerReview]);

      const result = await resolver.getSellerReviews('shop-id-1');

      expect(result).toEqual([mockSellerReview]);
      expect(service.getSellerReviews).toHaveBeenCalledWith('shop-id-1');
    });
  });

  describe('getSellerAverageRating', () => {
    it('should return average rating for seller', async () => {
      service.getSellerAverageRating.mockResolvedValue(4.2);

      const result = await resolver.getSellerAverageRating('shop-id-1');

      expect(result).toBe(4.2);
      expect(service.getSellerAverageRating).toHaveBeenCalledWith('shop-id-1');
    });
  });

  describe('getMyProductReviews', () => {
    it('should return my product reviews', async () => {
      service.getMyProductReviews.mockResolvedValue([mockProductReview]);

      const result = await resolver.getMyProductReviews(mockCtx as any);

      expect(result).toEqual([mockProductReview]);
      expect(service.getMyProductReviews).toHaveBeenCalledWith('user-id-1');
    });
  });

  describe('getMySellerReviews', () => {
    it('should return my seller reviews', async () => {
      service.getMySellerReviews.mockResolvedValue([mockSellerReview]);

      const result = await resolver.getMySellerReviews(mockCtx as any);

      expect(result).toEqual([mockSellerReview]);
      expect(service.getMySellerReviews).toHaveBeenCalledWith('user-id-1');
    });
  });

  describe('getAllProductReviews', () => {
    it('should return all product reviews', async () => {
      service.getAllProductReviews.mockResolvedValue([mockProductReview]);

      const result = await resolver.getAllProductReviews();

      expect(result).toEqual([mockProductReview]);
      expect(service.getAllProductReviews).toHaveBeenCalled();
    });
  });

  describe('getAllSellerReviews', () => {
    it('should return all seller reviews', async () => {
      service.getAllSellerReviews.mockResolvedValue([mockSellerReview]);

      const result = await resolver.getAllSellerReviews();

      expect(result).toEqual([mockSellerReview]);
      expect(service.getAllSellerReviews).toHaveBeenCalled();
    });
  });
});
