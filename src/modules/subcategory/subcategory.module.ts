import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubCategory } from './entity/subcategory.entity';
import { Category } from '../category/entity/category.entity';
import { SubCategoryService } from './subcategory.service';
import { SubCategoryResolver } from './Subcategory.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([SubCategory, Category])],
  providers: [SubCategoryService, SubCategoryResolver],
  exports: [SubCategoryService],
})
export class SubCategoryModule {}
