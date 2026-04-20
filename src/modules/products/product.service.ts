import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entity/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { SearchProductResult } from './dto/search-product-result.dto';
import { Shop } from '../shop/entity/shop.entity';
import { Category } from '../category/entity/category.entity';
import { SubCategory } from '../subcategory/entity/subcategory.entity';
import { SearchService } from '../search/search.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Shop)
    private shopRepo: Repository<Shop>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(SubCategory)
    private subCategoryRepo: Repository<SubCategory>,
    private searchService: SearchService,
  ) {}

  async createProduct(input: CreateProductInput) {
    const product = this.productRepo.create(input);

    if (input.shopId) {
      const shop = await this.shopRepo.findOne({ where: { id: input.shopId } });
      if (!shop) throw new NotFoundException('Shop not found');
      product.shop = shop;
    }

    if (input.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: input.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
      product.category = category;
    }

    if (input.subCategoryId) {
      const subCategory = await this.subCategoryRepo.findOne({
        where: { id: input.subCategoryId },
      });
      if (!subCategory) throw new NotFoundException('SubCategory not found');
      product.subCategory = subCategory;
    }

    const savedProduct = await this.productRepo.save(product);
    
    await this.searchService.indexProduct(savedProduct);
    
    return savedProduct;
  }

  findAllProducts() {
    return this.productRepo.find({
      relations: ['shop', 'category', 'subCategory'],
    });
  }

  async findOneProduct(id: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['shop', 'category', 'subCategory'],
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(input: UpdateProductInput) {
    const product = await this.findOneProduct(input.id);

    Object.assign(product, input);

    if (input.shopId) {
      const shop = await this.shopRepo.findOne({ where: { id: input.shopId } });
      if (!shop) throw new NotFoundException('Shop not found');
      product.shop = shop;
    }

    if (input.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: input.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
      product.category = category;
    }

    if (input.subCategoryId) {
      const subCategory = await this.subCategoryRepo.findOne({
        where: { id: input.subCategoryId },
      });
      if (!subCategory) throw new NotFoundException('SubCategory not found');
      product.subCategory = subCategory;
    }

    const updatedProduct = await this.productRepo.save(product);
    
    await this.searchService.indexProduct(updatedProduct);
    
    return updatedProduct;
  }

  async deleteProduct(id: string) {
    const product = await this.findOneProduct(id);
    await this.productRepo.remove(product);
    
    await this.searchService.deleteProduct(id);
    
    return true;
  }

  async searchProducts(query: string): Promise<SearchProductResult[]> {
    return this.searchService.searchProducts(query);
  }

  async syncProductsToElasticsearch() {
    const products = await this.productRepo.find({
      relations: ['shop', 'category', 'subCategory'],
    })
    await this.searchService.bulkIndexProducts(products);
    return { indexed: products.length };
  }
}
