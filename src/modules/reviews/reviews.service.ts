import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReview } from './entity/product-review.entity';
import { SellerReview } from './entity/seller-review.entity';
import { CreateProductReviewInput } from './dto/create-product-review.input';
import { CreateSellerReviewInput } from './dto/create-seller-review.input';
import { UpdateProductReviewInput } from './dto/update-product-review.input';
import { UpdateSellerReviewInput } from './dto/update-seller-review.input';
import { Order } from '../orders/entity/order.entity';
import { Product } from '../products/entity/product.entity';
import { Shop } from '../shop/entity/shop.entity';
import { User } from '../users/entity/users.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ProductReview)
    private productReviewRepo: Repository<ProductReview>,
    @InjectRepository(SellerReview)
    private sellerReviewRepo: Repository<SellerReview>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Shop)
    private shopRepo: Repository<Shop>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createProductReview(
    userId: string,
    input: CreateProductReviewInput,
  ): Promise<ProductReview> {
    // Validate that the user bought the product in the order
    const order = await this.orderRepo.findOne({
      where: { id: input.orderId },
      relations: ['items', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user.id !== userId) {
      throw new BadRequestException('You can only review products from your own orders');
    }

    const orderContainsProduct = order.items.some(
      (item) => item.productId === input.productId,
    );

    if (!orderContainsProduct) {
      throw new BadRequestException(
        'This product is not in your order',
      );
    }

    const existingReview = await this.productReviewRepo.findOne({
      where: {
        user: { id: userId },
        product: { id: input.productId },
        order: { id: input.orderId },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product for this order');
    }

    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const product = await this.productRepo.findOne({
      where: { id: input.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const review = this.productReviewRepo.create({
      rating: input.rating,
      comment: input.comment,
      media: input.media,
      user,
      product,
      order,
    });

    return this.productReviewRepo.save(review);
  }

  async createSellerReview(
    userId: string,
    input: CreateSellerReviewInput,
  ): Promise<SellerReview> {
    // Validate that the user placed the order
    const order = await this.orderRepo.findOne({
      where: { id: input.orderId },
      relations: ['user', 'items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user.id !== userId) {
      throw new BadRequestException('You can only review sellers from your own orders');
    }

    // Get the product from the order to find the shop
    const product = await this.productRepo.findOne({
      where: { id: order.items[0].productId },
      relations: ['shop'],
    });

    if (!product || !product.shop) {
      throw new NotFoundException('Product or shop not found');
    }

    // Validate the shopId matches the product's shop
    if (product.shop.id !== input.shopId) {
      throw new BadRequestException('This shop is not associated with this order');
    }

    // Check if user already reviewed this seller for this order
    const existingReview = await this.sellerReviewRepo.findOne({
      where: {
        user: { id: userId },
        shop: { id: input.shopId },
        order: { id: input.orderId },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this seller for this order');
    }

    // Validate rating is between 1 and 5
    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const shop = await this.shopRepo.findOne({
      where: { id: input.shopId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const review = this.sellerReviewRepo.create({
      rating: input.rating,
      comment: input.comment,
      user,
      shop,
      order,
    });

    return this.sellerReviewRepo.save(review);
  }

  async getProductReviews(productId: string): Promise<ProductReview[]> {
    return this.productReviewRepo.find({
      where: { product: { id: productId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSellerReviews(shopId: string): Promise<SellerReview[]> {
    return this.sellerReviewRepo.find({
      where: { shop: { id: shopId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMyProductReviews(userId: string): Promise<ProductReview[]> {
    return this.productReviewRepo.find({
      where: { user: { id: userId } },
      relations: ['product', 'order'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMySellerReviews(userId: string): Promise<SellerReview[]> {
    return this.sellerReviewRepo.find({
      where: { user: { id: userId } },
      relations: ['shop', 'order'],
      order: { createdAt: 'DESC' },
    });
  }

  async getProductAverageRating(productId: string): Promise<number> {
    const reviews = await this.productReviewRepo.find({
      where: { product: { id: productId } },
    });

    if (reviews.length === 0) {
      return 0;
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }

  async getSellerAverageRating(shopId: string): Promise<number> {
    const reviews = await this.sellerReviewRepo.find({
      where: { shop: { id: shopId } },
    });

    if (reviews.length === 0) {
      return 0;
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }

  async getAllProductReviews(): Promise<ProductReview[]> {
    return this.productReviewRepo.find({
      relations: ['user', 'product', 'order'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllSellerReviews(): Promise<SellerReview[]> {
    return this.sellerReviewRepo.find({
      relations: ['user', 'shop', 'order'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateProductReview(
    userId: string,
    input: UpdateProductReviewInput,
  ): Promise<ProductReview> {
    const review = await this.productReviewRepo.findOne({
      where: { id: input.id },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    if (input.rating !== undefined) {
      if (input.rating < 1 || input.rating > 5) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }
      review.rating = input.rating;
    }

    if (input.comment !== undefined) {
      review.comment = input.comment;
    }

    if (input.media !== undefined) {
      review.media = input.media;
    }

    return this.productReviewRepo.save(review);
  }

  async updateSellerReview(
    userId: string,
    input: UpdateSellerReviewInput,
  ): Promise<SellerReview> {
    const review = await this.sellerReviewRepo.findOne({
      where: { id: input.id },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    if (input.rating !== undefined) {
      if (input.rating < 1 || input.rating > 5) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }
      review.rating = input.rating;
    }

    if (input.comment !== undefined) {
      review.comment = input.comment;
    }

    return this.sellerReviewRepo.save(review);
  }

  async deleteProductReview(userId: string, reviewId: string): Promise<boolean> {
    const review = await this.productReviewRepo.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.productReviewRepo.remove(review);
    return true;
  }

  async deleteSellerReview(userId: string, reviewId: string): Promise<boolean> {
    const review = await this.sellerReviewRepo.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.sellerReviewRepo.remove(review);
    return true;
  }

  async adminDeleteProductReview(reviewId: string): Promise<boolean> {
    const review = await this.productReviewRepo.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.productReviewRepo.remove(review);
    return true;
  }

  async adminDeleteSellerReview(reviewId: string): Promise<boolean> {
    const review = await this.sellerReviewRepo.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.sellerReviewRepo.remove(review);
    return true;
  }
}
