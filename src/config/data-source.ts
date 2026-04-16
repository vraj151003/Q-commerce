import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/entity/users.entity';
import { Role } from '../modules/roles/entity/roles.entity';
import { Permission } from '../modules/permission/entity/permission.entity';
import { Shop } from '../modules/shop/entity/shop.entity';
import { Category } from '../modules/category/entity/category.entity';
import { SubCategory } from '../modules/subcategory/entity/subcategory.entity';
import { Product } from '../modules/products/entity/product.entity';
import { DeliveryProfile } from '../modules/delivery-profile/entity/delivery-profile.entity';
import { Order } from '../modules/orders/entity/order.entity';
import { OrderItem } from '../modules/orders/entity/order-item.entity';
import { Payment } from '../modules/payment/entity/payment.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'testdb',
  entities: [User, Role, Permission, Shop, Category, SubCategory, Product, DeliveryProfile, Order, OrderItem, Payment],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
});
