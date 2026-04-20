import { Injectable, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProductReview } from './entity/product-review.entity';
import { SellerReview } from './entity/seller-review.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ReviewsService } from './reviews.service';
import { CreateProductReviewInput } from './dto/create-product-review.input';
import { CreateSellerReviewInput } from './dto/create-seller-review.input';
import { UpdateProductReviewInput } from './dto/update-product-review.input';
import { UpdateSellerReviewInput } from './dto/update-seller-review.input';

interface AuthUser {
  userId: string;
  role?: string;
}

interface GqlContext {
  req: {
    user: AuthUser;
  };
}

@Resolver(() => ProductReview)
@Injectable()
@UseGuards(GqlAuthGuard, PermissionsGuard)
export class ReviewsResolver {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Mutation(() => ProductReview, { description: 'Create a product review (only for users who purchased the product)' })
  @Permissions('CREATE_REVIEW')
  createProductReview(
    @Args('input') input: CreateProductReviewInput,
    @Context() ctx: GqlContext,
  ): Promise<ProductReview> {
    return this.reviewsService.createProductReview(ctx.req.user.userId, input);
  }

  @Mutation(() => SellerReview, { description: 'Create a seller review (only for users who purchased from the seller)' })
  @Permissions('CREATE_REVIEW')
  createSellerReview(
    @Args('input') input: CreateSellerReviewInput,
    @Context() ctx: GqlContext,
  ): Promise<SellerReview> {
    return this.reviewsService.createSellerReview(ctx.req.user.userId, input);
  }

  @Query(() => [ProductReview], { description: 'Get all reviews for a product' })
  @Permissions('READ_REVIEW')
  getProductReviews(@Args('productId') productId: string): Promise<ProductReview[]> {
    return this.reviewsService.getProductReviews(productId);
  }

  @Query(() => Number, { description: 'Get average rating for a product' })
  @Permissions('READ_REVIEW')
  getProductAverageRating(@Args('productId') productId: string): Promise<number> {
    return this.reviewsService.getProductAverageRating(productId);
  }

  @Query(() => [SellerReview], { description: 'Get all reviews for a seller' })
  @Permissions('READ_REVIEW')
  getSellerReviews(@Args('shopId') shopId: string): Promise<SellerReview[]> {
    return this.reviewsService.getSellerReviews(shopId);
  }

  @Query(() => Number, { description: 'Get average rating for a seller' })
  @Permissions('READ_REVIEW')
  getSellerAverageRating(@Args('shopId') shopId: string): Promise<number> {
    return this.reviewsService.getSellerAverageRating(shopId);
  }

  @Query(() => [ProductReview], { description: 'Get my product reviews' })
  @Permissions('READ_REVIEW')
  getMyProductReviews(@Context() ctx: GqlContext): Promise<ProductReview[]> {
    return this.reviewsService.getMyProductReviews(ctx.req.user.userId);
  }

  @Query(() => [SellerReview], { description: 'Get my seller reviews' })
  @Permissions('READ_REVIEW')
  getMySellerReviews(@Context() ctx: GqlContext): Promise<SellerReview[]> {
    return this.reviewsService.getMySellerReviews(ctx.req.user.userId);
  }

  @Query(() => [ProductReview], { description: 'Get all product reviews (Admin only)' })
  @Permissions('READ_REVIEW')
  getAllProductReviews(): Promise<ProductReview[]> {
    return this.reviewsService.getAllProductReviews();
  }

  @Query(() => [SellerReview], { description: 'Get all seller reviews (Admin only)' })
  @Permissions('READ_REVIEW')
  getAllSellerReviews(): Promise<SellerReview[]> {
    return this.reviewsService.getAllSellerReviews();
  }

  @Mutation(() => ProductReview, { description: 'Update a product review (only by the reviewer)' })
  @Permissions('UPDATE_REVIEW')
  updateProductReview(
    @Args('input') input: UpdateProductReviewInput,
    @Context() ctx: GqlContext,
  ): Promise<ProductReview> {
    return this.reviewsService.updateProductReview(ctx.req.user.userId, input);
  }

  @Mutation(() => SellerReview, { description: 'Update a seller review (only by the reviewer)' })
  @Permissions('UPDATE_REVIEW')
  updateSellerReview(
    @Args('input') input: UpdateSellerReviewInput,
    @Context() ctx: GqlContext,
  ): Promise<SellerReview> {
    return this.reviewsService.updateSellerReview(ctx.req.user.userId, input);
  }

  @Mutation(() => Boolean, { description: 'Delete a product review (only by the reviewer)' })
  @Permissions('DELETE_REVIEW')
  deleteProductReview(
    @Args('id') id: string,
    @Context() ctx: GqlContext,
  ): Promise<boolean> {
    return this.reviewsService.deleteProductReview(ctx.req.user.userId, id);
  }

  @Mutation(() => Boolean, { description: 'Delete a seller review (only by the reviewer)' })
  @Permissions('DELETE_REVIEW')
  deleteSellerReview(
    @Args('id') id: string,
    @Context() ctx: GqlContext,
  ): Promise<boolean> {
    return this.reviewsService.deleteSellerReview(ctx.req.user.userId, id);
  }

  @Mutation(() => Boolean, { description: 'Delete any product review (Admin only)' })
  @Permissions('DELETE_REVIEW')
  adminDeleteProductReview(@Args('id') id: string): Promise<boolean> {
    return this.reviewsService.adminDeleteProductReview(id);
  }

  @Mutation(() => Boolean, { description: 'Delete any seller review (Admin only)' })
  @Permissions('DELETE_REVIEW')
  adminDeleteSellerReview(@Args('id') id: string): Promise<boolean> {
    return this.reviewsService.adminDeleteSellerReview(id);
  }
}
