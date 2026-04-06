import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entity/category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

// category.service.ts
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  createCategory(input: CreateCategoryInput) {
    return this.repo.save(this.repo.create(input));
  }

  findAllCategory() {
    return this.repo.find({ relations: ['subCategories'] });
  }

  async findOneCategory(id: string) {
    const data = await this.repo.findOne({
      where: { id },
      relations: ['subCategories'],
    });

    if (!data) throw new NotFoundException('Category not found');
    return data;
  }

  async updateCategory(input: UpdateCategoryInput) {
    const cat = await this.findOneCategory(input.id);
    Object.assign(cat, input);
    return this.repo.save(cat);
  }

  async deleteCategory(id: string) {
    const cat = await this.findOneCategory(id);
    await this.repo.remove(cat);
    return true;
  }
}
