import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsResolver } from './reviews.resolver';
import { ProductReview } from './entity/product-review.entity';
import { SellerReview } from './entity/seller-review.entity';
import { Order } from '../orders/entity/order.entity';
import { Product } from '../products/entity/product.entity';
import { Shop } from '../shop/entity/shop.entity';
import { User } from '../users/entity/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductReview,
      SellerReview,
      Order,
      Product,
      Shop,
      User,
    ]),
  ],
  providers: [ReviewsService, ReviewsResolver],
  exports: [ReviewsService],
})
export class ReviewsModule {}
