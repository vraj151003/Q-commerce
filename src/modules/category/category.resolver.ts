import { Injectable, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver, Query as GQLQuery } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CategoryService } from './category.service';
import { Category } from './entity/category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UpdateCategoryInput } from './dto/update-category.input';

@Resolver(() => Category)
@Injectable()
@UseGuards(GqlAuthGuard, PermissionsGuard)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Mutation(() => Category)
  @Permissions('CREATE_CATEGORY')
  createCategory(@Args('input') input: CreateCategoryInput) {
    return this.categoryService.createCategory(input);
  }

  @GQLQuery(() => [Category])
  getCategories() {
    return this.categoryService.findAllCategory();
  }

  @GQLQuery(() => Category)
  getCategory(@Args('id') id: string) {
    return this.categoryService.findOneCategory(id);
  }

  @Mutation(() => Category)
  @Permissions('UPDATE_CATEGORY')
  updateCategory(
    @Args('input')
    input: UpdateCategoryInput,
  ) {
    return this.categoryService.updateCategory(input);
  }

  @Mutation(() => Boolean)
  @Permissions('DELETE_CATEGORY')
  deleteCategory(@Args('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }
}
