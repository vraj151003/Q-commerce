import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxService } from './tax.service';
import { TaxResolver } from './tax.resolver';
import { Tax } from './entity/tax.entity';
import { Category } from '../category/entity/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tax, Category])],
  providers: [TaxService, TaxResolver],
  exports: [TaxService],
})
export class TaxModule {}
