import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from '../shop/entity/shop.entity';
import { Category } from '../category/entity/category.entity';
import { SubCategory } from '../subcategory/entity/subcategory.entity';
import { ProductService } from './product.service';
import { ProductResolver } from './product.resolver';
import { Product } from './entity/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Shop, Category, SubCategory])],
  providers: [ProductService, ProductResolver],
  exports: [ProductService],
})
export class ProductModule {}
