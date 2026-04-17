import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { OrderService } from './src/modules/orders/order.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const orderService = app.get(OrderService);
  const order = await orderService.findOne("51bbe0f7-e5c9-4590-b75f-f84ed2b64906");
  console.log(JSON.stringify(order, null, 2));
  await app.close();
}
bootstrap();
