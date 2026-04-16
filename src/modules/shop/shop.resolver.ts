import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { Shop } from './entity/shop.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { ShopService } from './shop.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateShopInput } from './dto/create-shop.input';
import { UpdateShopInput } from './dto/update-shop.input';
import {
  ShopResponse,
  ShopListResponse,
  BooleanResponse,
} from '../../common/dto/api-response.dto';

@Resolver(() => Shop)
@Injectable()
@UseGuards(GqlAuthGuard)
export class ShopResolver {
  constructor(private readonly shopService: ShopService) {}

  private getUser(ctx: any) {
    return ctx.req.user;
  }

  @Mutation(() => ShopResponse)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin')
  @Permissions('CREATE_SHOP')
  createShop(@Args('input') input: CreateShopInput, @Context() ctx) {
    const shop = this.shopService.createShop(input, this.getUser(ctx));
    return {
      statusCode: 201,
      message: 'Shop created successfully',
      data: shop,
    };
  }

  @Query(() => ShopListResponse)
  @UseGuards(PermissionsGuard)
  @Permissions('READ_SHOP')
  getAllShops(@Context() ctx) {
    const shops = this.shopService.findAllShops(this.getUser(ctx));
    return {
      statusCode: 200,
      message: 'Shops retrieved successfully',
      data: shops,
    };
  }

  @Query(() => ShopResponse)
  @UseGuards(PermissionsGuard)
  @Permissions('READ_SHOP')
  getShopbyId(@Args('id', { type: () => String }) id: string, @Context() ctx) {
    const shop = this.shopService.findOneShop(id, this.getUser(ctx));
    return {
      statusCode: 200,
      message: 'Shop retrieved successfully',
      data: shop,
    };
  }

  @Mutation(() => ShopResponse)
  @UseGuards(PermissionsGuard)
  @Permissions('UPDATE_SHOP')
  updateShopById(@Args('input') input: UpdateShopInput, @Context() ctx) {
    const shop = this.shopService.updateShop(input, this.getUser(ctx));
    return {
      statusCode: 200,
      message: 'Shop updated successfully',
      data: shop,
    };
  }

  @Mutation(() => BooleanResponse)
  @UseGuards(PermissionsGuard)
  @Permissions('DELETE_SHOP')
  deleteShopById(
    @Args('id', { type: () => String }) id: string,
    @Context() ctx,
  ) {
    return this.shopService
      .deleteShop(id, this.getUser(ctx))
      .then((result) => ({
        statusCode: 200,
        message: 'Shop deleted successfully',
        data: result,
      }));
  }
}
