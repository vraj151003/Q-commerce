import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ProductModule } from '../products/product.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [ScheduleModule.forRoot(), ProductModule, SearchModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
