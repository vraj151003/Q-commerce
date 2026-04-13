import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Order } from './entity/order.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { OrderService } from './order.service';
import { CreateOrderInput } from './dto/create-order-input';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UpdateOrderStatusInput } from './dto/update-order-input';

interface AuthUser {
  userId: string;
  role?: string;
}

interface GqlContext {
  req: {
    user: AuthUser;
  };
}

@Resolver(() => Order)
@UseGuards(GqlAuthGuard)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  // POST /orders
  @Mutation(() => Order)
  createOrder(@Args('input') input: CreateOrderInput, @Context() ctx: GqlContext) {
    return this.orderService.createOrder(ctx.req.user, input);
  }

  // GET /orders (admin)
  @Query(() => [Order])
  @UseGuards(RolesGuard)
  @Roles('admin')
  getOrders() {
    return this.orderService.findAll();
  }

  // GET /orders/my
  @Query(() => [Order])
  getMyOrders(@Context() ctx: GqlContext) {
    return this.orderService.findMyOrders(ctx.req.user);
  }

  // GET /orders/:id
  @Query(() => Order)
  getOrder(@Args('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Query(() => String)
  downloadOrderPdf(@Args('orderId') orderId: string) {
    return this.orderService.generateOrderPdfBase64(orderId);
  }

  // PATCH /orders/:id/status
  @Mutation(() => Order)
  updateOrderStatus(@Args('input') input: UpdateOrderStatusInput) {
    return this.orderService.updateStatus(input.orderId, input.status);
  }

  // GET /orders/seller
  @Query(() => [Order])
  @UseGuards(RolesGuard)
  @Roles('seller')
  getSellerOrders(@Context() ctx: GqlContext) {
    return this.orderService.getSellerOrders(ctx.req.user.userId);
  }

  // UPDATE ORDER
  @Mutation(() => Order)
  updateOrder(
    @Args('id') id: string,
    @Args('data') data: CreateOrderInput,
  ) {
    return this.orderService.updateOrder(id, data);
  }
}
