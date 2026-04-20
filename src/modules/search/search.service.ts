import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Product } from '../products/entity/product.entity';
import { Category } from '../category/entity/category.entity';
import { SubCategory } from '../subcategory/entity/subcategory.entity';

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  private readonly productIndex = 'products';
  private readonly categoryIndex = 'categories';
  private readonly subCategoryIndex = 'subcategories';

  async indexProduct(product: Product) {
    const productDocument = {
      id: product.id,
      name: product.name,
      description: product.description,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      category: product.category?.name,
      subCategory: product.subCategory?.name,
      shop: product.shop?.shopName,
      isAvailable: product.isAvailable,
      stockQuantity: product.stockQuantity,
    };

    await this.elasticsearchService.index({
      index: this.productIndex,
      id: product.id,
      document: productDocument,
    });
  }

  async indexCategory(category: Category) {
    const categoryDocument = {
      id: category.id,
      name: category.name,
      description: category.description,
    };

    await this.elasticsearchService.index({
      index: this.categoryIndex,
      id: category.id,
      document: categoryDocument,
    });
  }

  async indexSubCategory(subCategory: SubCategory) {
    const subCategoryDocument = {
      id: subCategory.id,
      name: subCategory.name,
      category: subCategory.category?.name,
    };

    await this.elasticsearchService.index({
      index: this.subCategoryIndex,
      id: subCategory.id,
      document: subCategoryDocument,
    });
  }

  async deleteProduct(productId: string) {
    await this.elasticsearchService.delete({
      index: this.productIndex,
      id: productId,
    });
  }

  async deleteCategory(categoryId: string) {
    await this.elasticsearchService.delete({
      index: this.categoryIndex,
      id: categoryId,
    });
  }

  async deleteSubCategory(subCategoryId: string) {
    await this.elasticsearchService.delete({
      index: this.subCategoryIndex,
      id: subCategoryId,
    });
  }

  async searchProducts(query: string) {
    const response = await this.elasticsearchService.search({
      index: this.productIndex,
      query: {
        multi_match: {
          query,
          fields: ['name', 'description', 'category', 'subCategory', 'shop'],
          fuzziness: 'AUTO',
        },
      },
    });

    return response.hits.hits.map((hit: any) => ({
      id: hit._source.id,
      name: hit._source.name,
      description: hit._source.description,
      mrp: hit._source.mrp,
      sellingPrice: hit._source.sellingPrice,
      category: hit._source.category,
      subCategory: hit._source.subCategory,
      shop: hit._source.shop,
      isAvailable: hit._source.isAvailable,
      stockQuantity: hit._source.stockQuantity,
      score: hit._score,
    }));
  }

  async searchCategories(query: string) {
    const response = await this.elasticsearchService.search({
      index: this.categoryIndex,
      query: {
        multi_match: {
          query,
          fields: ['name', 'description'],
          fuzziness: 'AUTO',
        },
      },
    });

    return response.hits.hits.map((hit: any) => ({
      id: hit._source.id,
      name: hit._source.name,
      description: hit._source.description,
      score: hit._score,
    }));
  }

  async searchSubCategories(query: string) {
    const response = await this.elasticsearchService.search({
      index: this.subCategoryIndex,
      query: {
        multi_match: {
          query,
          fields: ['name', 'category'],
          fuzziness: 'AUTO',
        },
      },
    });

    return response.hits.hits.map((hit: any) => ({
      id: hit._source.id,
      name: hit._source.name,
      category: hit._source.category,
      score: hit._score,
    }));
  }

  async bulkIndexProducts(products: Product[]) {
    const operations = products.flatMap((product) => [
      { index: { _index: this.productIndex, _id: product.id } },
      {
        id: product.id,
        name: product.name,
        description: product.description,
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        category: product.category?.name,
        subCategory: product.subCategory?.name,
        shop: product.shop?.shopName,
        isAvailable: product.isAvailable,
        stockQuantity: product.stockQuantity,
      },
    ]);

    await this.elasticsearchService.bulk({ operations });
  }

  async bulkIndexCategories(categories: Category[]) {
    const operations = categories.flatMap((category) => [
      { index: { _index: this.categoryIndex, _id: category.id } },
      {
        id: category.id,
        name: category.name,
        description: category.description,
      },
    ]);

    await this.elasticsearchService.bulk({ operations });
  }

  async bulkIndexSubCategories(subCategories: SubCategory[]) {
    const operations = subCategories.flatMap((subCategory) => [
      { index: { _index: this.subCategoryIndex, _id: subCategory.id } },
      {
        id: subCategory.id,
        name: subCategory.name,
        category: subCategory.category?.name,
      },
    ]);

    await this.elasticsearchService.bulk({ operations });
  }
}
