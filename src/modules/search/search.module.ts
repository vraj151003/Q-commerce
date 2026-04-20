import { Module } from '@nestjs/common';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';

@Module({
  imports: [
    NestElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const username = configService.get<string>('database.elasticsearch.username');
        const password = configService.get<string>('database.elasticsearch.password');
        
        return {
          node: configService.get<string>('database.elasticsearch.node'),
          ...(username && password ? {
            auth: {
              username,
              password,
            },
          } : {}),
        };
      },
    }),
  ],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
