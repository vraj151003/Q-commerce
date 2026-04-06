import { UseGuards } from '@nestjs/common';
import { SubCategory } from './entity/subcategory.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SubCategoryService } from './subcategory.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateSubCategoryInput } from './dto/create-subcategory.input';
import { UpdateSubCategoryInput } from './dto/update-subcategory.input';

@Resolver(() => SubCategory)
@UseGuards(GqlAuthGuard, PermissionsGuard)
export class SubCategoryResolver {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Mutation(() => SubCategory)
  @Permissions('CREATE_SUBCATEGORY')
  createSubCategory(@Args('input') input: CreateSubCategoryInput) {
    return this.subCategoryService.createSubcategory(input);
  }

  @Query(() => [SubCategory])
  getSubCategories() {
    return this.subCategoryService.findAllSubcategory();
  }

  @Query(() => SubCategory)
  getSubCategory(@Args('id') id: string) {
    return this.subCategoryService.findOneSubcategory(id);
  }

  @Mutation(() => SubCategory)
  @Permissions('UPDATE_SUBCATEGORY')
  updateSubCategory(@Args('input') input: UpdateSubCategoryInput) {
    return this.subCategoryService.updateSubcategory(input);
  }

  @Mutation(() => SubCategory)
  @Permissions('DELETE_SUBCATEGORY')
  deleteSubCategory(@Args('id') id: string) {
    return this.subCategoryService.deleteSubcategory(id);
  }
}
