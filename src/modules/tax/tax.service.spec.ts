import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxService } from './tax.service';
import { Tax } from './entity/tax.entity';
import { CreateTaxInput } from './dto/create-tax.input';
import { UpdateTaxInput } from './dto/update-tax.input';

const mockCategory = {
  id: 'category-id',
  name: 'Electronics',
  description: 'Electronic items',
  subCategories: [],
} as any;

const mockTax: Tax = {
  id: 'tax-id',
  category: mockCategory,
  categoryId: 'category-id',
  taxRate: 18,
  description: 'Standard GST rate',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TaxService', () => {
  let service: TaxService;
  let repo: Partial<Repository<Tax>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxService,
        {
          provide: getRepositoryToken(Tax),
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

    service = module.get<TaxService>(TaxService);
    repo = module.get(getRepositoryToken(Tax));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTax', () => {
    it('should create a tax with required fields', async () => {
      const input: CreateTaxInput = {
        categoryId: 'category-id',
        taxRate: 18,
      };
      const savedTax = { ...mockTax, ...input };
      (repo.create as jest.Mock).mockReturnValue({ ...input });
      (repo.save as jest.Mock).mockResolvedValue(savedTax);
      (repo.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // First call for duplicate check
        .mockResolvedValueOnce(savedTax); // Second call for loading category

      const result = await service.createTax(input);

      expect(repo.create).toHaveBeenCalledWith(input);
      expect(repo.save).toHaveBeenCalledWith({ ...input });
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { categoryId: input.categoryId },
      });
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: savedTax.id },
        relations: ['category'],
      });
      expect(result).toEqual(savedTax);
    });

    it('should create a tax with optional description', async () => {
      const input: CreateTaxInput = {
        categoryId: 'category-id',
        taxRate: 18,
        description: 'Standard GST rate',
      };
      const savedTax = { ...mockTax, ...input };
      (repo.create as jest.Mock).mockReturnValue({ ...input });
      (repo.save as jest.Mock).mockResolvedValue(savedTax);
      (repo.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // First call for duplicate check
        .mockResolvedValueOnce(savedTax); // Second call for loading category

      const result = await service.createTax(input);

      expect(repo.create).toHaveBeenCalledWith(input);
      expect(repo.save).toHaveBeenCalledWith({ ...input });
      expect(result).toEqual(savedTax);
    });

    it('should handle repository save error', async () => {
      const input: CreateTaxInput = {
        categoryId: 'category-id',
        taxRate: 18,
      };
      (repo.create as jest.Mock).mockReturnValue(input);
      (repo.save as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.createTax(input)).rejects.toThrow('Database error');
    });

    it('should throw BadRequestException when tax already exists for category', async () => {
      const input: CreateTaxInput = {
        categoryId: 'category-id',
        taxRate: 18,
      };
      (repo.findOne as jest.Mock).mockResolvedValue(mockTax);

      await expect(service.createTax(input)).rejects.toThrow(BadRequestException);
      await expect(service.createTax(input)).rejects.toThrow('Tax already exists for this category');
    });
  });

  describe('findAllTaxes', () => {
    it('should return all taxes with category relation', async () => {
      (repo.find as jest.Mock).mockResolvedValue([mockTax]);

      const result = await service.findAllTaxes();

      expect(repo.find).toHaveBeenCalledWith({ relations: ['category'] });
      expect(result).toEqual([mockTax]);
    });

    it('should return empty array when no taxes exist', async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllTaxes();

      expect(result).toEqual([]);
    });

    it('should handle repository find error', async () => {
      (repo.find as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.findAllTaxes()).rejects.toThrow('Database error');
    });
  });

  describe('findOneTax', () => {
    it('should return tax by id with category relation', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockTax);

      const result = await service.findOneTax('tax-id');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'tax-id' },
        relations: ['category'],
      });
      expect(result).toEqual(mockTax);
    });

    it('should throw NotFoundException when tax not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.findOneTax('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle repository findOne error', async () => {
      (repo.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.findOneTax('tax-id')).rejects.toThrow('Database error');
    });

    it('should handle null id parameter', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.findOneTax(null as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findTaxByCategory', () => {
    it('should return tax by category id when active', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockTax);

      const result = await service.findTaxByCategory('category-id');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { categoryId: 'category-id', isActive: true },
        relations: ['category'],
      });
      expect(result).toEqual(mockTax);
    });

    it('should return null when no active tax found for category', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findTaxByCategory('non-existent-category');

      expect(result).toBeNull();
    });

    it('should handle repository findOne error', async () => {
      (repo.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.findTaxByCategory('category-id')).rejects.toThrow('Database error');
    });

    it('should handle null category id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findTaxByCategory(null as any);

      expect(result).toBeNull();
    });

    it('should handle empty string category id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findTaxByCategory('');

      expect(result).toBeNull();
    });
  });

  describe('updateTax', () => {
    it('should update tax rate', async () => {
      const input: UpdateTaxInput = {
        id: 'tax-id',
        taxRate: 28,
      };
      const existingTax = { ...mockTax };
      (service.findOneTax as jest.Mock) = jest.fn().mockResolvedValue(existingTax) as any;
      (repo.save as jest.Mock).mockResolvedValue({ ...existingTax, taxRate: 28 });

      const result = await service.updateTax(input);

      expect(service.findOneTax).toHaveBeenCalledWith('tax-id');
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ taxRate: 28 }));
      expect(result).toEqual({ ...existingTax, taxRate: 28 });
    });

    it('should update tax description', async () => {
      const input: UpdateTaxInput = {
        id: 'tax-id',
        description: 'Updated GST rate',
      };
      const existingTax = { ...mockTax };
      (service.findOneTax as jest.Mock) = jest.fn().mockResolvedValue(existingTax) as any;
      (repo.save as jest.Mock).mockResolvedValue({
        ...existingTax,
        description: 'Updated GST rate',
      });

      const result = await service.updateTax(input);

      expect(service.findOneTax).toHaveBeenCalledWith('tax-id');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Updated GST rate' }),
      );
      expect(result).toEqual({ ...existingTax, description: 'Updated GST rate' });
    });

    it('should update tax isActive status', async () => {
      const input: UpdateTaxInput = {
        id: 'tax-id',
        isActive: false,
      };
      const existingTax = { ...mockTax };
      (service.findOneTax as jest.Mock) = jest.fn().mockResolvedValue(existingTax) as any;
      (repo.save as jest.Mock).mockResolvedValue({ ...existingTax, isActive: false });

      const result = await service.updateTax(input);

      expect(service.findOneTax).toHaveBeenCalledWith('tax-id');
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
      expect(result).toEqual({ ...existingTax, isActive: false });
    });

    it('should update multiple fields at once', async () => {
      const input: UpdateTaxInput = {
        id: 'tax-id',
        taxRate: 28,
        description: 'Increased GST rate',
        isActive: true,
      };
      const existingTax = { ...mockTax };
      (service.findOneTax as jest.Mock) = jest.fn().mockResolvedValue(existingTax) as any;
      (repo.save as jest.Mock).mockResolvedValue({
        ...existingTax,
        taxRate: 28,
        description: 'Increased GST rate',
        isActive: true,
      });

      const result = await service.updateTax(input);

      expect(service.findOneTax).toHaveBeenCalledWith('tax-id');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          taxRate: 28,
          description: 'Increased GST rate',
          isActive: true,
        }),
      );
      expect(result).toEqual({
        ...existingTax,
        taxRate: 28,
        description: 'Increased GST rate',
        isActive: true,
      });
    });

    it('should throw NotFoundException when tax not found', async () => {
      const input: UpdateTaxInput = {
        id: 'non-existent-id',
        taxRate: 28,
      };
      (service.findOneTax as jest.Mock) = jest.fn().mockRejectedValue(
        new NotFoundException('Tax not found'),
      ) as any;

      await expect(service.updateTax(input)).rejects.toThrow(NotFoundException);
    });

    it('should handle repository save error', async () => {
      const input: UpdateTaxInput = {
        id: 'tax-id',
        taxRate: 28,
      };
      const existingTax = { ...mockTax };
      (service.findOneTax as jest.Mock) = jest.fn().mockResolvedValue(existingTax) as any;
      (repo.save as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.updateTax(input)).rejects.toThrow('Database error');
    });
  });

  describe('deleteTax', () => {
    it('should delete tax and return true', async () => {
      const existingTax = { ...mockTax };
      (service.findOneTax as jest.Mock) = jest.fn().mockResolvedValue(existingTax) as any;
      (repo.remove as jest.Mock).mockResolvedValue(existingTax);

      const result = await service.deleteTax('tax-id');

      expect(service.findOneTax).toHaveBeenCalledWith('tax-id');
      expect(repo.remove).toHaveBeenCalledWith(existingTax);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when tax not found', async () => {
      (service.findOneTax as jest.Mock) = jest.fn().mockRejectedValue(
        new NotFoundException('Tax not found'),
      ) as any;

      await expect(service.deleteTax('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle repository remove error', async () => {
      const existingTax = { ...mockTax };
      (service.findOneTax as jest.Mock) = jest.fn().mockResolvedValue(existingTax) as any;
      (repo.remove as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.deleteTax('tax-id')).rejects.toThrow('Database error');
    });

    it('should handle null id parameter', async () => {
      (service.findOneTax as jest.Mock) = jest.fn().mockRejectedValue(
        new NotFoundException('Tax not found'),
      ) as any;

      await expect(service.deleteTax(null as any)).rejects.toThrow(NotFoundException);
    });
  });
});
