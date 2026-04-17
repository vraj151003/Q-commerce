import { Injectable, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver, Query as GQLQuery } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TaxService } from './tax.service';
import { Tax } from './entity/tax.entity';
import { CreateTaxInput } from './dto/create-tax.input';
import { UpdateTaxInput } from './dto/update-tax.input';

@Resolver(() => Tax)
@Injectable()
@UseGuards(GqlAuthGuard, PermissionsGuard)
export class TaxResolver {
  constructor(private readonly taxService: TaxService) {}

  @Mutation(() => Tax)
  @Permissions('CREATE_TAX')
  createTax(@Args('input') input: CreateTaxInput) {
    return this.taxService.createTax(input);
  }

  @GQLQuery(() => [Tax])
  getTaxes() {
    return this.taxService.findAllTaxes();
  }

  @GQLQuery(() => Tax)
  getTax(@Args('id') id: string) {
    return this.taxService.findOneTax(id);
  }

  @GQLQuery(() => Tax, { nullable: true })
  getTaxByCategory(@Args('categoryId') categoryId: string) {
    return this.taxService.findTaxByCategory(categoryId);
  }

  @Mutation(() => Tax)
  @Permissions('UPDATE_TAX')
  updateTax(@Args('input') input: UpdateTaxInput) {
    return this.taxService.updateTax(input);
  }

  @Mutation(() => Boolean)
  @Permissions('DELETE_TAX')
  deleteTax(@Args('id') id: string) {
    return this.taxService.deleteTax(id);
  }
}
