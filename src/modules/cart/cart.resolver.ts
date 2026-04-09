import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Cart } from './entity/cart.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AddToCartInput } from './dto/add-item-input';
import { CartService } from './cart.service';

interface AuthUser {
  userId: string;
}

interface GqlContext {
  req: {
    user: AuthUser;
  };
}

@Resolver(() => Cart)
@UseGuards(GqlAuthGuard, PermissionsGuard)
@Permissions('CART')
export class CartResolver {
  constructor(private cartService: CartService) {}

  // GET /cart
  @Query(() => Cart)
  getCart(@Context() ctx: GqlContext) {
    return this.cartService.getMyCart(ctx.req.user);
  }

  // POST /cart/items
  @Mutation(() => Cart)
  addToCart(@Args('input') input: AddToCartInput, @Context() ctx: GqlContext) {
    return this.cartService.addToCart(input, ctx.req.user);
  }

  // PATCH /cart/items/:productId
  @Mutation(() => Cart)
  updateCartItem(
    @Args('productId') productId: string,
    @Args('quantity') quantity: number,
    @Context() ctx: GqlContext,
  ) {
    return this.cartService.updateItem(productId, quantity, ctx.req.user);
  }

  // DELETE /cart/items/:itemId
  @Mutation(() => Cart)
  removeCartItem(@Args('itemId') itemId: number, @Context() ctx: GqlContext) {
    return this.cartService.removeItem(itemId, ctx.req.user);
  }

  // CLEAR CART
  @Mutation(() => Boolean)
  clearCart(@Context() ctx: GqlContext) {
    return this.cartService.clearCart(ctx.req.user).then(() => true);
  }
}
