import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './entity/shop.entity';
import { User } from '../users/entity/users.entity';
import { ShopService } from './shop.service';
import { ShopResolver } from './shop.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Shop, User])],
  providers: [ShopService, ShopResolver],
  exports: [ShopService],
})
export class ShopModule {}
