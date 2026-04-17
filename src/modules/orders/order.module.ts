// src/order/order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { Cart } from '../cart/entity/cart.entity';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Product } from '../products/entity/product.entity';
import { Shop } from '../shop/entity/shop.entity';
import { DeliveryAssignmentModule } from '../delivery-assignment/delivery-assignment.module';
import { TaxModule } from '../tax/tax.module';
import { NotificationModule } from '../notification/notification.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Cart, Product, Shop]),
    DeliveryAssignmentModule,
    TaxModule,
    NotificationModule,
    CouponModule,
  ],
  providers: [
    OrderService,
    OrderResolver,
    GqlAuthGuard,
    RolesGuard,
  ],
  exports: [OrderService],
})
export class OrderModule {}