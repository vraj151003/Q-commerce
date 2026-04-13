import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryService } from './category.service';
import { Category } from './entity/category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

const mockCategory: Category = {
  id: 'category-id',
  name: 'Beverages',
  description: 'Refreshing drinks',
  subCategories: [],
};

describe('CategoryService', () => {
  let service: CategoryService;
  let repo: Partial<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repo = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a category with required and optional fields', async () => {
    const input: CreateCategoryInput = { name: 'Beverages', description: 'Drinks category' };
    (repo.create as jest.Mock).mockReturnValue({ ...input });
    (repo.save as jest.Mock).mockResolvedValue({ ...mockCategory, ...input });

    const result = await service.createCategory(input);

    expect(repo.create).toHaveBeenCalledWith(input);
    expect(repo.save).toHaveBeenCalledWith({ ...input });
    expect(result).toEqual({ ...mockCategory, ...input });
  });

  it('should create a category when description is omitted', async () => {
    const input: CreateCategoryInput = { name: 'Snacks' };
    (repo.create as jest.Mock).mockReturnValue({ ...input });
    (repo.save as jest.Mock).mockResolvedValue({ ...mockCategory, ...input, description: undefined });

    const result = await service.createCategory(input);

    expect(repo.create).toHaveBeenCalledWith(input);
    expect(result).toEqual({ ...mockCategory, ...input, description: undefined });
  });

  it('should return all categories including subCategories relation', async () => {
    (repo.find as jest.Mock).mockResolvedValue([mockCategory]);

    const result = await service.findAllCategory();

    expect(repo.find).toHaveBeenCalledWith({ relations: ['subCategories'] });
    expect(result).toEqual([mockCategory]);
  });

  it('should return one category by id if found', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(mockCategory);

    const result = await service.findOneCategory('category-id');

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'category-id' }, relations: ['subCategories'] });
    expect(result).toEqual(mockCategory);
  });

  it('should throw NotFoundException when findOneCategory id does not exist', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(service.findOneCategory('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('should update category name and optional description', async () => {
    const existingCategory = { ...mockCategory };
    (service.findOneCategory as jest.Mock) = jest.fn().mockResolvedValue(existingCategory) as any;
    (repo.save as jest.Mock).mockResolvedValue({ ...existingCategory, name: 'Snacks', description: 'Packaged goods' });

    const result = await service.updateCategory({ id: 'category-id', name: 'Snacks', description: 'Packaged goods' });

    expect(service.findOneCategory).toHaveBeenCalledWith('category-id');
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Snacks', description: 'Packaged goods' }));
    expect(result).toEqual({ ...existingCategory, name: 'Snacks', description: 'Packaged goods' });
  });

  it('should throw NotFoundException when updateCategory references invalid id', async () => {
    (service.findOneCategory as jest.Mock) = jest.fn().mockRejectedValue(new NotFoundException('Category not found')) as any;

    await expect(service.updateCategory({ id: 'missing-id', name: 'Snacks' })).rejects.toThrow(NotFoundException);
  });

  it('should delete category and return true when deletion succeeds', async () => {
    const existingCategory = { ...mockCategory };
    (service.findOneCategory as jest.Mock) = jest.fn().mockResolvedValue(existingCategory) as any;
    (repo.remove as jest.Mock).mockResolvedValue(existingCategory);

    const result = await service.deleteCategory('category-id');

    expect(service.findOneCategory).toHaveBeenCalledWith('category-id');
    expect(repo.remove).toHaveBeenCalledWith(existingCategory);
    expect(result).toBe(true);
  });
});
