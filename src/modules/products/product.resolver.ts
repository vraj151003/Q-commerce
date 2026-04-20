import { Injectable, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Product } from './entity/product.entity';
import { ProductService } from './product.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { SyncProductsResponse } from './dto/sync-products-response.dto';
import { SearchProductResult } from './dto/search-product-result.dto';

@Resolver(() => Product)
@Injectable()
@UseGuards(GqlAuthGuard, PermissionsGuard)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => Product)
  @Permissions('CREATE_PRODUCT')
  createProduct(@Args('input') input: CreateProductInput) {
    return this.productService.createProduct(input);
  }

  @Query(() => [Product])
  getProducts() {
    return this.productService.findAllProducts();
  }

  @Query(() => [SearchProductResult], { description: 'Search products using Elasticsearch' })
  searchProducts(@Args('query') query: string) {
    return this.productService.searchProducts(query);
  }

  @Query(() => Product)
  getProduct(@Args('id') id: string) {
    return this.productService.findOneProduct(id);
  }

  @Mutation(() => Product)
  @Permissions('UPDATE_PRODUCT')
  updateProduct(@Args('input') input: UpdateProductInput) {
    return this.productService.updateProduct(input);
  }

  @Mutation(() => Boolean)
  @Permissions('DELETE_PRODUCT')
  deleteProduct(@Args('id') id: string) {
    return this.productService.deleteProduct(id);
  }

  @Mutation(() => SyncProductsResponse, { description: 'Sync all products to Elasticsearch (Admin only)' })
  @Permissions('CREATE_PRODUCT')
  syncProductsToElasticsearch() {
    return this.productService.syncProductsToElasticsearch();
  }
}
