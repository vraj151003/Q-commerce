import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import databaseConfig from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionModule } from './modules/permission/permission.module';
import { QueueModule } from './common/queues/queue.module';
import { UsersModule } from './modules/users/users.module';
import { ShopModule } from './modules/shop/shop.module';
import { CategoryModule } from './modules/category/category.module';
import { SubCategoryModule } from './modules/subcategory/subcategory.module';
import { ProductModule } from './modules/products/product.module';
import { MediaModule } from './modules/media/media.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/orders/order.module';
import { DeliveryProfileModule } from './modules/delivery-profile/delivery-profile.module';
import { DeliveryAssignmentModule } from './modules/delivery-assignment/delivery-assignment.module';
import { PaymentModule } from './modules/payment/payment.module';
import { TaxModule } from './modules/tax/tax.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CouponModule } from './modules/coupon/coupon.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      path: '/graphql',
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      context: ({ req }) => ({ req }),
      installSubscriptionHandlers: true,
      buildSchemaOptions: {
        dateScalarMode: 'isoDate',
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: configService.get<'postgres'>('database.type'),
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: configService.get<boolean>(
          'database.autoLoadEntities',
        ),
        synchronize: configService.get<boolean>('database.synchronize'),
      }),
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionModule,
    QueueModule,
    ShopModule,
    CategoryModule,
    SubCategoryModule,
    ProductModule,
    MediaModule,
    CartModule,
    OrderModule,
    DeliveryProfileModule,
    DeliveryAssignmentModule,
    PaymentModule,
    TaxModule,
    NotificationModule,
    CouponModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
