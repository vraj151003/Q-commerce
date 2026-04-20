import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductService } from '../products/product.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly productService: ProductService,
    private readonly searchService: SearchService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSyncProductsToElasticsearch() {
    try {
      await this.productService.syncProductsToElasticsearch();
    } catch (error) {
      // Silent error handling
    }
  }
}
