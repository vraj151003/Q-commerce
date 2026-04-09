import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entity/cart.entity';
import { CartItem } from './entity/cart-item.entity';
import { CartService } from './cart.service';
import { CartResolver } from './cart.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem])],
  providers: [CartService, CartResolver],
  exports: [CartService],
})
export class CartModule {}
