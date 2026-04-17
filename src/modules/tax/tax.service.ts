import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tax } from './entity/tax.entity';
import { CreateTaxInput } from './dto/create-tax.input';
import { UpdateTaxInput } from './dto/update-tax.input';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(Tax)
    private taxRepo: Repository<Tax>,
  ) {}

  async createTax(input: CreateTaxInput) {
    const existingTax = await this.taxRepo.findOne({
      where: { categoryId: input.categoryId },
    });

    if (existingTax) {
      throw new BadRequestException('Tax already exists for this category');
    }

    const tax = await this.taxRepo.save(this.taxRepo.create(input));
    return this.taxRepo.findOne({
      where: { id: tax.id },
      relations: ['category'],
    });
  }

  findAllTaxes() {
    return this.taxRepo.find({ relations: ['category'] });
  }

  async findOneTax(id: string) {
    const tax = await this.taxRepo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!tax) throw new NotFoundException('Tax not found');
    return tax;
  }

  async findTaxByCategory(categoryId: string) {
    const tax = await this.taxRepo.findOne({
      where: { categoryId, isActive: true },
      relations: ['category'],
    });

    return tax;
  }

  async updateTax(input: UpdateTaxInput) {
    const tax = await this.findOneTax(input.id);
    Object.assign(tax, input);
    return this.taxRepo.save(tax);
  }

  async deleteTax(id: string) {
    const tax = await this.findOneTax(id);
    await this.taxRepo.remove(tax);
    return true;
  }
}
