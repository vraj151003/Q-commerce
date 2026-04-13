import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubCategoryService } from './subcategory.service';
import { SubCategory } from './entity/subcategory.entity';
import { Category } from '../category/entity/category.entity';
import { CreateSubCategoryInput } from './dto/create-subcategory.input';
import { UpdateSubCategoryInput } from './dto/update-subcategory.input';

const mockCategory: Category = {
  id: 'category-id',
  name: 'Beverages',
  slug: 'beverages',
  description: 'Drinks',
  image: 'image-url',
  createdAt: new Date(),
  updatedAt: new Date(),
  shop: null,
  subCategories: [],
};

const mockSubCategory: SubCategory = {
  id: 'subcategory-id',
  name: 'Cold Drinks',
  category: mockCategory,
};

describe('SubCategoryService', () => {
  let service: SubCategoryService;
  let subRepo: Partial<Repository<SubCategory>>;
  let catRepo: Partial<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubCategoryService,
        {
          provide: getRepositoryToken(SubCategory),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubCategoryService>(SubCategoryService);
    subRepo = module.get(getRepositoryToken(SubCategory));
    catRepo = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a subcategory when category exists', async () => {
    const input: CreateSubCategoryInput = { name: 'Cold Drinks', categoryId: 'category-id' };
    (catRepo.findOne as jest.Mock).mockResolvedValue(mockCategory);
    (subRepo.save as jest.Mock).mockResolvedValue(mockSubCategory);

    const result = await service.createSubcategory(input);

    expect(catRepo.findOne).toHaveBeenCalledWith({ where: { id: 'category-id' } });
    expect(subRepo.save).toHaveBeenCalledWith({ name: 'Cold Drinks', category: mockCategory });
    expect(result).toEqual(mockSubCategory);
  });

  it('should throw NotFoundException when category does not exist', async () => {
    (catRepo.findOne as jest.Mock).mockResolvedValue(undefined);
    await expect(
      service.createSubcategory({ name: 'Cold Drinks', categoryId: 'missing-category' } as any),
    ).rejects.toThrow(NotFoundException);
    expect(subRepo.save).not.toHaveBeenCalled();
  });

  it('should return all subcategories with category relation', async () => {
    (subRepo.find as jest.Mock).mockResolvedValue([mockSubCategory]);

    const result = await service.findAllSubcategory();

    expect(subRepo.find).toHaveBeenCalledWith({ relations: ['category'] });
    expect(result).toEqual([mockSubCategory]);
  });

  it('should return one subcategory by id when found', async () => {
    (subRepo.findOne as jest.Mock).mockResolvedValue(mockSubCategory);

    const result = await service.findOneSubcategory('subcategory-id');

    expect(subRepo.findOne).toHaveBeenCalledWith({ where: { id: 'subcategory-id' }, relations: ['category'] });
    expect(result).toEqual(mockSubCategory);
  });

  it('should throw NotFoundException when findOneSubcategory receives invalid id', async () => {
    (subRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(service.findOneSubcategory('invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('should update subcategory name and persist changes', async () => {
    const updatedSubCategory = { ...mockSubCategory, name: 'Hot Drinks' };
    jest.spyOn(service, 'findOneSubcategory').mockResolvedValue(mockSubCategory);
    (subRepo.save as jest.Mock).mockResolvedValue(updatedSubCategory);

    const result = await service.updateSubcategory({ id: 'subcategory-id', name: 'Hot Drinks' });

    expect(service.findOneSubcategory).toHaveBeenCalledWith('subcategory-id');
    expect(subRepo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Hot Drinks' }));
    expect(result).toEqual(updatedSubCategory);
  });

  it('should delete a subcategory and return the removed entity', async () => {
    (service.findOneSubcategory as jest.Mock) = jest.fn().mockResolvedValue(mockSubCategory) as any;
    (subRepo.remove as jest.Mock).mockResolvedValue(mockSubCategory);

    const result = await service.deleteSubcategory('subcategory-id');

    expect(service.findOneSubcategory).toHaveBeenCalledWith('subcategory-id');
    expect(subRepo.remove).toHaveBeenCalledWith(mockSubCategory);
    expect(result).toEqual(mockSubCategory);
  });
});
