import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from './product.service';
import { Product } from './entity/product.entity';
import { Shop } from '../shop/entity/shop.entity';
import { Category } from '../category/entity/category.entity';
import { SubCategory } from '../subcategory/entity/subcategory.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { SearchService } from '../search/search.service';

describe('ProductService', () => {
  let service: ProductService;
  let productRepo: jest.Mocked<Repository<Product>>;
  let shopRepo: jest.Mocked<Repository<Shop>>;
  let categoryRepo: jest.Mocked<Repository<Category>>;
  let subCategoryRepo: jest.Mocked<Repository<SubCategory>>;

  const mockShop: Shop = {
    id: 'shop-1',
    shopName: 'Test Shop',
    addressLine1: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    pinCode: '123456',
    country: 'India',
    gstNumber: 'GST123456',
    panNumber: 'PAN123456',
    accountHolderName: 'Test Account',
    accountNumber: '1234567890',
    ifscCode: 'IFSC123456',
    bankName: 'Test Bank',
    createdAt: new Date(),
  };

  const mockCategory: Category = {
    id: 'category-1',
    name: 'Test Category',
    description: 'Test Description',
    subCategories: [],
  };

  const mockSubCategory: SubCategory = {
    id: 'subcategory-1',
    name: 'Test SubCategory',
    category: mockCategory,
  };

  const mockProduct: Product = {
    id: 'product-1',
    name: 'Test Product',
    description: 'Test Description',
    longDescription: 'Test Long Description',
    mrp: 100,
    sellingPrice: 80,
    discountPercentage: 20,
    stockQuantity: 50,
    isAvailable: true,
    lowStockThreshold: 10,
    unit: 'kg',
    unitValue: 1,
    packSize: '1kg',
    brand: 'Test Brand',
    isVeg: true,
    expiryDays: 30,
    images: ['image1.jpg', 'image2.jpg'],
    shopId: 'shop-1',
    categoryId: 'category-1',
    subCategoryId: 'subcategory-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    shop: mockShop,
    category: mockCategory,
    subCategory: mockSubCategory,
  };

  const createProductInput: CreateProductInput = {
    name: 'Test Product',
    description: 'Test Description',
    longDescription: 'Test Long Description',
    mrp: 100,
    sellingPrice: 80,
    discountPercentage: 20,
    stockQuantity: 50,
    isAvailable: true,
    lowStockThreshold: 10,
    unit: 'kg',
    unitValue: 1,
    packSize: '1kg',
    brand: 'Test Brand',
    isVeg: true,
    expiryDays: 30,
    images: ['image1.jpg', 'image2.jpg'],
    shopId: 'shop-1',
    categoryId: 'category-1',
    subCategoryId: 'subcategory-1',
  };

  const updateProductInput: UpdateProductInput = {
    id: 'product-1',
    name: 'Updated Product',
    description: 'Updated Description',
    mrp: 150,
    sellingPrice: 120,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Shop),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SubCategory),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: SearchService,
          useValue: {
            indexProduct: jest.fn(),
            deleteProduct: jest.fn(),
            searchProducts: jest.fn(),
            bulkIndexProducts: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepo = module.get(getRepositoryToken(Product));
    shopRepo = module.get(getRepositoryToken(Shop));
    categoryRepo = module.get(getRepositoryToken(Category));
    subCategoryRepo = module.get(getRepositoryToken(SubCategory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product without relations', async () => {
      const inputWithoutRelations: CreateProductInput = {
        name: 'Simple Product',
        mrp: 100,
        sellingPrice: 80,
        stockQuantity: 50,
        unit: 'kg',
        isVeg: true,
      };
      const simpleProduct = { ...mockProduct, ...inputWithoutRelations };

      productRepo.create.mockReturnValue(simpleProduct);
      productRepo.save.mockResolvedValue(simpleProduct);

      const result = await service.createProduct(inputWithoutRelations);

      expect(productRepo.create).toHaveBeenCalledWith(inputWithoutRelations);
      expect(productRepo.save).toHaveBeenCalledWith(simpleProduct);
      expect(result).toEqual(simpleProduct);
    });

    it('should create a product with shop relation', async () => {
      const inputWithShop: CreateProductInput = {
        ...createProductInput,
        categoryId: undefined,
        subCategoryId: undefined,
      };
      const productWithShop = { ...mockProduct, shop: mockShop };

      productRepo.create.mockReturnValue(productWithShop);
      shopRepo.findOne.mockResolvedValue(mockShop);
      productRepo.save.mockResolvedValue(productWithShop);

      const result = await service.createProduct(inputWithShop);

      expect(shopRepo.findOne).toHaveBeenCalledWith({ where: { id: 'shop-1' } });
      expect(productRepo.save).toHaveBeenCalledWith(productWithShop);
      expect(result.shop).toEqual(mockShop);
    });

    it('should create a product with category relation', async () => {
      const inputWithCategory: CreateProductInput = {
        ...createProductInput,
        shopId: undefined,
        subCategoryId: undefined,
      };
      const productWithCategory = { ...mockProduct, category: mockCategory };

      productRepo.create.mockReturnValue(productWithCategory);
      categoryRepo.findOne.mockResolvedValue(mockCategory);
      productRepo.save.mockResolvedValue(productWithCategory);

      const result = await service.createProduct(inputWithCategory);

      expect(categoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'category-1' },
      });
      expect(productRepo.save).toHaveBeenCalledWith(productWithCategory);
      expect(result.category).toEqual(mockCategory);
    });

    it('should create a product with subcategory relation', async () => {
      const inputWithSubCategory: CreateProductInput = {
        ...createProductInput,
        shopId: undefined,
        categoryId: undefined,
      };
      const productWithSubCategory = { ...mockProduct, subCategory: mockSubCategory };

      productRepo.create.mockReturnValue(productWithSubCategory);
      subCategoryRepo.findOne.mockResolvedValue(mockSubCategory);
      productRepo.save.mockResolvedValue(productWithSubCategory);

      const result = await service.createProduct(inputWithSubCategory);

      expect(subCategoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'subcategory-1' },
      });
      expect(productRepo.save).toHaveBeenCalledWith(productWithSubCategory);
      expect(result.subCategory).toEqual(mockSubCategory);
    });

    it('should create a product with all relations', async () => {
      productRepo.create.mockReturnValue(mockProduct);
      shopRepo.findOne.mockResolvedValue(mockShop);
      categoryRepo.findOne.mockResolvedValue(mockCategory);
      subCategoryRepo.findOne.mockResolvedValue(mockSubCategory);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.createProduct(createProductInput);

      expect(shopRepo.findOne).toHaveBeenCalledWith({ where: { id: 'shop-1' } });
      expect(categoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'category-1' },
      });
      expect(subCategoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'subcategory-1' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when shop is not found', async () => {
      const inputWithInvalidShop: CreateProductInput = {
        ...createProductInput,
        categoryId: undefined,
        subCategoryId: undefined,
      };

      productRepo.create.mockReturnValue(mockProduct);
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.createProduct(inputWithInvalidShop)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createProduct(inputWithInvalidShop)).rejects.toThrow(
        'Shop not found',
      );
    });

    it('should throw NotFoundException when category is not found', async () => {
      const inputWithInvalidCategory: CreateProductInput = {
        ...createProductInput,
        shopId: undefined,
        subCategoryId: undefined,
      };

      productRepo.create.mockReturnValue(mockProduct);
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.createProduct(inputWithInvalidCategory)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createProduct(inputWithInvalidCategory)).rejects.toThrow(
        'Category not found',
      );
    });

    it('should throw NotFoundException when subcategory is not found', async () => {
      const inputWithInvalidSubCategory: CreateProductInput = {
        ...createProductInput,
        shopId: undefined,
        categoryId: undefined,
      };

      productRepo.create.mockReturnValue(mockProduct);
      subCategoryRepo.findOne.mockResolvedValue(null);

      await expect(service.createProduct(inputWithInvalidSubCategory)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createProduct(inputWithInvalidSubCategory)).rejects.toThrow(
        'SubCategory not found',
      );
    });

    it('should handle minimal required fields', async () => {
      const minimalInput: CreateProductInput = {
        name: 'Minimal Product',
        mrp: 100,
        sellingPrice: 80,
        stockQuantity: 50,
        unit: 'kg',
        isVeg: true,
      };
      const minimalProduct = { ...mockProduct, ...minimalInput };

      productRepo.create.mockReturnValue(minimalProduct);
      productRepo.save.mockResolvedValue(minimalProduct);

      const result = await service.createProduct(minimalInput);

      expect(productRepo.create).toHaveBeenCalledWith(minimalInput);
      expect(productRepo.save).toHaveBeenCalledWith(minimalProduct);
      expect(result).toEqual(minimalProduct);
    });

    it('should handle empty description fields', async () => {
      const inputWithEmptyDescriptions: CreateProductInput = {
        ...createProductInput,
        description: '',
        longDescription: '',
        shopId: undefined,
        categoryId: undefined,
        subCategoryId: undefined,
      };

      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.createProduct(inputWithEmptyDescriptions);

      expect(productRepo.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });

    it('should handle zero stock quantity', async () => {
      const inputWithZeroStock: CreateProductInput = {
        ...createProductInput,
        stockQuantity: 0,
        shopId: undefined,
        categoryId: undefined,
        subCategoryId: undefined,
      };

      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.createProduct(inputWithZeroStock);

      expect(productRepo.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });

    it('should handle negative prices', async () => {
      const inputWithNegativePrice: CreateProductInput = {
        ...createProductInput,
        mrp: -100,
        sellingPrice: -80,
        shopId: undefined,
        categoryId: undefined,
        subCategoryId: undefined,
      };

      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.createProduct(inputWithNegativePrice);

      expect(productRepo.save).toHaveBeenCalledWith(mockProduct);
    });

    it('should handle very large numbers', async () => {
      const inputWithLargeNumbers: CreateProductInput = {
        ...createProductInput,
        mrp: 999999999,
        sellingPrice: 999999999,
        stockQuantity: 999999999,
        shopId: undefined,
        categoryId: undefined,
        subCategoryId: undefined,
      };

      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.createProduct(inputWithLargeNumbers);

      expect(productRepo.save).toHaveBeenCalledWith(mockProduct);
    });

    it('should handle empty images array', async () => {
      const inputWithEmptyImages: CreateProductInput = {
        ...createProductInput,
        images: [],
        shopId: undefined,
        categoryId: undefined,
        subCategoryId: undefined,
      };

      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.createProduct(inputWithEmptyImages);

      expect(productRepo.save).toHaveBeenCalledWith(mockProduct);
    });

    it('should handle save errors gracefully', async () => {
      const inputWithError: CreateProductInput = {
        ...createProductInput,
        shopId: undefined,
        categoryId: undefined,
        subCategoryId: undefined,
      };

      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createProduct(inputWithError)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAllProducts', () => {
    it('should return an array of products with relations', async () => {
      const products = [mockProduct, { ...mockProduct, id: 'product-2' }];
      productRepo.find.mockResolvedValue(products);

      const result = await service.findAllProducts();

      expect(productRepo.find).toHaveBeenCalledWith({
        relations: ['shop', 'category', 'subCategory'],
      });
      expect(result).toEqual(products);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no products exist', async () => {
      productRepo.find.mockResolvedValue([]);

      const result = await service.findAllProducts();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      productRepo.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAllProducts()).rejects.toThrow('Database error');
    });
  });

  describe('findOneProduct', () => {
    it('should return a single product by id with relations', async () => {
      productRepo.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOneProduct('product-1');

      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        relations: ['shop', 'category', 'subCategory'],
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product is not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneProduct('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneProduct('non-existent-id')).rejects.toThrow(
        'Product not found',
      );
    });

    it('should handle empty id', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneProduct('')).rejects.toThrow(NotFoundException);
    });

    it('should handle null id', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneProduct(null as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle undefined id', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneProduct(undefined as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle database errors gracefully', async () => {
      productRepo.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.findOneProduct('product-1')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('updateProduct', () => {
    it('should update product name', async () => {
      const updateNameInput: UpdateProductInput = {
        id: 'product-1',
        name: 'Updated Name',
      };
      const updatedProduct = { ...mockProduct, name: 'Updated Name' };

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(updateNameInput);

      expect(result.name).toBe('Updated Name');
      expect(productRepo.save).toHaveBeenCalledWith(updatedProduct);
    });

    it('should update product with shop relation', async () => {
      const updateWithShopInput: UpdateProductInput = {
        id: 'product-1',
        shopId: 'shop-2',
      };
      const newShop = { ...mockShop, id: 'shop-2', name: 'New Shop' };
      const updatedProduct = { ...mockProduct, shop: newShop };

      productRepo.findOne.mockResolvedValue(mockProduct);
      shopRepo.findOne.mockResolvedValue(newShop);
      productRepo.save.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(updateWithShopInput);

      expect(shopRepo.findOne).toHaveBeenCalledWith({ where: { id: 'shop-2' } });
      expect(result.shop).toEqual(newShop);
    });

    it('should update product with category relation', async () => {
      const updateWithCategoryInput: UpdateProductInput = {
        id: 'product-1',
        categoryId: 'category-2',
      };
      const newCategory = { ...mockCategory, id: 'category-2', name: 'New Category' };
      const updatedProduct = { ...mockProduct, category: newCategory };

      productRepo.findOne.mockResolvedValue(mockProduct);
      categoryRepo.findOne.mockResolvedValue(newCategory);
      productRepo.save.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(updateWithCategoryInput);

      expect(categoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'category-2' },
      });
      expect(result.category).toEqual(newCategory);
    });

    it('should update product with subcategory relation', async () => {
      const updateWithSubCategoryInput: UpdateProductInput = {
        id: 'product-1',
        subCategoryId: 'subcategory-2',
      };
      const newSubCategory = {
        ...mockSubCategory,
        id: 'subcategory-2',
        name: 'New SubCategory',
      };
      const updatedProduct = { ...mockProduct, subCategory: newSubCategory };

      productRepo.findOne.mockResolvedValue(mockProduct);
      subCategoryRepo.findOne.mockResolvedValue(newSubCategory);
      productRepo.save.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(updateWithSubCategoryInput);

      expect(subCategoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'subcategory-2' },
      });
      expect(result.subCategory).toEqual(newSubCategory);
    });

    it('should update multiple fields', async () => {
      const updatedProduct = { ...mockProduct, ...updateProductInput };

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(updateProductInput);

      expect(result.name).toBe('Updated Product');
      expect(result.description).toBe('Updated Description');
      expect(result.mrp).toBe(150);
      expect(result.sellingPrice).toBe(120);
    });

    it('should handle partial update with only id', async () => {
      const partialUpdateInput: UpdateProductInput = {
        id: 'product-1',
      };

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const result = await service.updateProduct(partialUpdateInput);

      expect(productRepo.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product to update is not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.updateProduct(updateProductInput)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateProduct(updateProductInput)).rejects.toThrow(
        'Product not found',
      );
    });

    it('should throw NotFoundException when shop to update is not found', async () => {
      const updateWithInvalidShop: UpdateProductInput = {
        id: 'product-1',
        shopId: 'invalid-shop',
      };

      productRepo.findOne.mockResolvedValue(mockProduct);
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.updateProduct(updateWithInvalidShop)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateProduct(updateWithInvalidShop)).rejects.toThrow(
        'Shop not found',
      );
    });

    it('should throw NotFoundException when category to update is not found', async () => {
      const updateWithInvalidCategory: UpdateProductInput = {
        id: 'product-1',
        categoryId: 'invalid-category',
      };

      productRepo.findOne.mockResolvedValue(mockProduct);
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.updateProduct(updateWithInvalidCategory)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateProduct(updateWithInvalidCategory)).rejects.toThrow(
        'Category not found',
      );
    });

    it('should throw NotFoundException when subcategory to update is not found', async () => {
      const updateWithInvalidSubCategory: UpdateProductInput = {
        id: 'product-1',
        subCategoryId: 'invalid-subcategory',
      };

      productRepo.findOne.mockResolvedValue(mockProduct);
      subCategoryRepo.findOne.mockResolvedValue(null);

      await expect(service.updateProduct(updateWithInvalidSubCategory)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateProduct(updateWithInvalidSubCategory)).rejects.toThrow(
        'SubCategory not found',
      );
    });

    it('should handle updating isAvailable to false', async () => {
      const updateAvailabilityInput: UpdateProductInput = {
        id: 'product-1',
        isAvailable: false,
      };
      const updatedProduct = { ...mockProduct, isAvailable: false };

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(updateAvailabilityInput);

      expect(result.isAvailable).toBe(false);
    });

    it('should handle updating stock quantity', async () => {
      const updateStockInput: UpdateProductInput = {
        id: 'product-1',
        stockQuantity: 100,
      };
      const updatedProduct = { ...mockProduct, stockQuantity: 100 };

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(updateStockInput);

      expect(result.stockQuantity).toBe(100);
    });

    it('should handle updating prices', async () => {
      const updatePriceInput: UpdateProductInput = {
        id: 'product-1',
        mrp: 200,
        sellingPrice: 150,
        discountPercentage: 25,
      };
      const updatedProduct = {
        ...mockProduct,
        mrp: 200,
        sellingPrice: 150,
        discountPercentage: 25,
      };

      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(updatePriceInput);

      expect(result.mrp).toBe(200);
      expect(result.sellingPrice).toBe(150);
      expect(result.discountPercentage).toBe(25);
    });

    it('should handle save errors gracefully', async () => {
      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.updateProduct(updateProductInput)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.remove.mockResolvedValue(mockProduct);

      const result = await service.deleteProduct('product-1');

      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        relations: ['shop', 'category', 'subCategory'],
      });
      expect(productRepo.remove).toHaveBeenCalledWith(mockProduct);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when product to delete is not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteProduct('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteProduct('non-existent-id')).rejects.toThrow(
        'Product not found',
      );
    });

    it('should handle empty id', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteProduct('')).rejects.toThrow(NotFoundException);
    });

    it('should handle null id', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteProduct(null as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle undefined id', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteProduct(undefined as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle remove errors gracefully', async () => {
      productRepo.findOne.mockResolvedValue(mockProduct);
      productRepo.remove.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteProduct('product-1')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
