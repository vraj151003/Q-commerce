import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubCategory } from './entity/subcategory.entity';
import { Repository } from 'typeorm';
import { Category } from '../category/entity/category.entity';
import { CreateSubCategoryInput } from './dto/create-subcategory.input';
import { UpdateSubCategoryInput } from './dto/update-subcategory.input';

// subcategory.service.ts
@Injectable()
export class SubCategoryService {
  constructor(
    @InjectRepository(SubCategory)
    private subRepo: Repository<SubCategory>,

    @InjectRepository(Category)
    private catRepo: Repository<Category>,
  ) {}

  async createSubcategory(input: CreateSubCategoryInput) {
    const category = await this.catRepo.findOne({
      where: { id: input.categoryId },
    });

    if (!category) throw new NotFoundException('Category not found');

    return this.subRepo.save({
      name: input.name,
      category,
    });
  }

  findAllSubcategory() {
    return this.subRepo.find({ relations: ['category'] });
  }

  async findOneSubcategory(id: string) {
    const data = await this.subRepo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!data) throw new NotFoundException('SubCategory not found');
    return data;
  }

  async updateSubcategory(input: UpdateSubCategoryInput) {
    const sub = await this.findOneSubcategory(input.id);
    sub.name = input.name;
    return this.subRepo.save(sub);
  }

  async deleteSubcategory(id: string) {
    const sub = await this.findOneSubcategory(id);
    await this.subRepo.remove(sub);
    return true;
  }
}
