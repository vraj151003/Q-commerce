import { Test, TestingModule } from '@nestjs/testing';
import { ProductResolver } from './product.resolver';
import { ProductService } from './product.service';
import { Product } from './entity/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

describe('ProductResolver', () => {
  let resolver: ProductResolver;
  let productService: jest.Mocked<ProductService>;

  const mockShop: any = {
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

  const mockCategory: any = {
    id: 'category-1',
    name: 'Test Category',
    description: 'Test Description',
    subCategories: [],
  };

  const mockSubCategory: any = {
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
        ProductResolver,
        {
          provide: ProductService,
          useValue: {
            createProduct: jest.fn(),
            findAllProducts: jest.fn(),
            findOneProduct: jest.fn(),
            updateProduct: jest.fn(),
            deleteProduct: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<ProductResolver>(ProductResolver);
    productService = module.get(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct mutation', () => {
    it('should call service createProduct with correct input', async () => {
      productService.createProduct.mockResolvedValue(mockProduct);

      const result = await resolver.createProduct(createProductInput);

      expect(productService.createProduct).toHaveBeenCalledWith(createProductInput);
      expect(result).toEqual(mockProduct);
    });

    it('should handle service errors gracefully', async () => {
      productService.createProduct.mockRejectedValue(new Error('Service error'));

      await expect(resolver.createProduct(createProductInput)).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle minimal input', async () => {
      const minimalInput: CreateProductInput = {
        name: 'Minimal Product',
        mrp: 100,
        sellingPrice: 80,
        stockQuantity: 50,
        unit: 'kg',
        isVeg: true,
      };
      productService.createProduct.mockResolvedValue(mockProduct);

      const result = await resolver.createProduct(minimalInput);

      expect(productService.createProduct).toHaveBeenCalledWith(minimalInput);
      expect(result).toEqual(mockProduct);
    });

    it('should handle input with all optional fields', async () => {
      const fullInput: CreateProductInput = {
        ...createProductInput,
        description: 'Description',
        longDescription: 'Long Description',
        discountPercentage: 20,
        lowStockThreshold: 10,
        unitValue: 1,
        packSize: '1kg',
        brand: 'Brand',
        expiryDays: 30,
        images: ['image1.jpg'],
        shopId: 'shop-1',
        categoryId: 'category-1',
        subCategoryId: 'subcategory-1',
      };
      productService.createProduct.mockResolvedValue(mockProduct);

      const result = await resolver.createProduct(fullInput);

      expect(productService.createProduct).toHaveBeenCalledWith(fullInput);
    });

    it('should handle input with undefined values for optional fields', async () => {
      const inputWithUndefined: CreateProductInput = {
        ...createProductInput,
        description: undefined,
        longDescription: undefined,
        discountPercentage: undefined,
        lowStockThreshold: undefined,
        unitValue: undefined,
        packSize: undefined,
        brand: undefined,
        expiryDays: undefined,
        images: undefined,
        shopId: undefined,
        categoryId: undefined,
        subCategoryId: undefined,
      };
      productService.createProduct.mockResolvedValue(mockProduct);

      const result = await resolver.createProduct(inputWithUndefined);

      expect(productService.createProduct).toHaveBeenCalledWith(inputWithUndefined);
    });

    it('should handle very long string values', async () => {
      const longInput: CreateProductInput = {
        ...createProductInput,
        name: 'a'.repeat(1000),
        description: 'b'.repeat(1000),
        longDescription: 'c'.repeat(1000),
        brand: 'd'.repeat(1000),
      };
      productService.createProduct.mockResolvedValue(mockProduct);

      const result = await resolver.createProduct(longInput);

      expect(productService.createProduct).toHaveBeenCalledWith(longInput);
    });

    it('should handle very large numbers', async () => {
      const largeNumberInput: CreateProductInput = {
        ...createProductInput,
        mrp: 999999999,
        sellingPrice: 999999999,
        stockQuantity: 999999999,
      };
      productService.createProduct.mockResolvedValue(mockProduct);

      const result = await resolver.createProduct(largeNumberInput);

      expect(productService.createProduct).toHaveBeenCalledWith(largeNumberInput);
    });

    it('should handle empty images array', async () => {
      const emptyImagesInput: CreateProductInput = {
        ...createProductInput,
        images: [],
      };
      productService.createProduct.mockResolvedValue(mockProduct);

      const result = await resolver.createProduct(emptyImagesInput);

      expect(productService.createProduct).toHaveBeenCalledWith(emptyImagesInput);
    });

    it('should handle large images array', async () => {
      const largeImagesInput: CreateProductInput = {
        ...createProductInput,
        images: Array.from({ length: 100 }, (_, i) => `image${i}.jpg`),
      };
      productService.createProduct.mockResolvedValue(mockProduct);

      const result = await resolver.createProduct(largeImagesInput);

      expect(productService.createProduct).toHaveBeenCalledWith(largeImagesInput);
    });
  });

  describe('getProducts query', () => {
    it('should return array of products', async () => {
      const products = [
        mockProduct,
        { ...mockProduct, id: 'product-2', name: 'Product 2' },
      ];
      productService.findAllProducts.mockResolvedValue(products);

      const result = await resolver.getProducts();

      expect(productService.findAllProducts).toHaveBeenCalled();
      expect(result).toEqual(products);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no products exist', async () => {
      productService.findAllProducts.mockResolvedValue([]);

      const result = await resolver.getProducts();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle service errors gracefully', async () => {
      productService.findAllProducts.mockRejectedValue(new Error('Service error'));

      await expect(resolver.getProducts()).rejects.toThrow('Service error');
    });
  });

  describe('getProduct query', () => {
    it('should return a single product by id', async () => {
      productService.findOneProduct.mockResolvedValue(mockProduct);

      const result = await resolver.getProduct('product-1');

      expect(productService.findOneProduct).toHaveBeenCalledWith('product-1');
      expect(result).toEqual(mockProduct);
    });

    it('should handle service errors gracefully', async () => {
      productService.findOneProduct.mockRejectedValue(new Error('Service error'));

      await expect(resolver.getProduct('product-1')).rejects.toThrow('Service error');
    });

    it('should handle empty id', async () => {
      productService.findOneProduct.mockResolvedValue(mockProduct);

      const result = await resolver.getProduct('');

      expect(productService.findOneProduct).toHaveBeenCalledWith('');
    });

    it('should handle very long id', async () => {
      const longId = 'a'.repeat(1000);
      productService.findOneProduct.mockResolvedValue(mockProduct);

      const result = await resolver.getProduct(longId);

      expect(productService.findOneProduct).toHaveBeenCalledWith(longId);
    });

    it('should handle special characters in id', async () => {
      const specialId = 'product-1_@#$%^&*()';
      productService.findOneProduct.mockResolvedValue(mockProduct);

      const result = await resolver.getProduct(specialId);

      expect(productService.findOneProduct).toHaveBeenCalledWith(specialId);
    });
  });

  describe('updateProduct mutation', () => {
    it('should call service updateProduct with correct input', async () => {
      const updatedProduct = { ...mockProduct, ...updateProductInput };
      productService.updateProduct.mockResolvedValue(updatedProduct);

      const result = await resolver.updateProduct(updateProductInput);

      expect(productService.updateProduct).toHaveBeenCalledWith(updateProductInput);
      expect(result).toEqual(updatedProduct);
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateProductInput = {
        id: 'product-1',
        name: 'Updated Name',
      };
      const updatedProduct = { ...mockProduct, name: 'Updated Name' };
      productService.updateProduct.mockResolvedValue(updatedProduct);

      const result = await resolver.updateProduct(partialUpdate);

      expect(productService.updateProduct).toHaveBeenCalledWith(partialUpdate);
      expect(result.name).toBe('Updated Name');
    });

    it('should handle service errors gracefully', async () => {
      productService.updateProduct.mockRejectedValue(new Error('Service error'));

      await expect(resolver.updateProduct(updateProductInput)).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle update with only id', async () => {
      const idOnlyUpdate: UpdateProductInput = { id: 'product-1' };
      productService.updateProduct.mockResolvedValue(mockProduct);

      const result = await resolver.updateProduct(idOnlyUpdate);

      expect(productService.updateProduct).toHaveBeenCalledWith(idOnlyUpdate);
    });

    it('should handle update with all fields', async () => {
      const fullUpdate: UpdateProductInput = {
        id: 'product-1',
        name: 'Updated Name',
        description: 'Updated Description',
        longDescription: 'Updated Long Description',
        mrp: 200,
        sellingPrice: 150,
        discountPercentage: 25,
        stockQuantity: 100,
        isAvailable: false,
        lowStockThreshold: 20,
        unit: 'lb',
        unitValue: 2,
        packSize: '2lb',
        brand: 'Updated Brand',
        isVeg: false,
        expiryDays: 60,
        images: ['new-image.jpg'],
        shopId: 'shop-2',
        categoryId: 'category-2',
        subCategoryId: 'subcategory-2',
      };
      const updatedProduct = { ...mockProduct, ...fullUpdate };
      productService.updateProduct.mockResolvedValue(updatedProduct);

      const result = await resolver.updateProduct(fullUpdate);

      expect(productService.updateProduct).toHaveBeenCalledWith(fullUpdate);
    });

    it('should handle update with undefined values for optional fields', async () => {
      const undefinedUpdate: UpdateProductInput = {
        id: 'product-1',
        description: undefined,
        longDescription: undefined,
        discountPercentage: undefined,
        lowStockThreshold: undefined,
        unitValue: undefined,
        packSize: undefined,
        brand: undefined,
        expiryDays: undefined,
        images: undefined,
      };
      productService.updateProduct.mockResolvedValue(mockProduct);

      const result = await resolver.updateProduct(undefinedUpdate);

      expect(productService.updateProduct).toHaveBeenCalledWith(undefinedUpdate);
    });

    it('should handle very long string values in update', async () => {
      const longUpdate: UpdateProductInput = {
        id: 'product-1',
        name: 'a'.repeat(1000),
        description: 'b'.repeat(1000),
        longDescription: 'c'.repeat(1000),
        brand: 'd'.repeat(1000),
      };
      productService.updateProduct.mockResolvedValue(mockProduct);

      const result = await resolver.updateProduct(longUpdate);

      expect(productService.updateProduct).toHaveBeenCalledWith(longUpdate);
    });

    it('should handle updating numeric fields', async () => {
      const numericUpdate: UpdateProductInput = {
        id: 'product-1',
        mrp: 999,
        sellingPrice: 888,
        stockQuantity: 777,
      };
      const updatedProduct = { ...mockProduct, ...numericUpdate };
      productService.updateProduct.mockResolvedValue(updatedProduct);

      const result = await resolver.updateProduct(numericUpdate);

      expect(productService.updateProduct).toHaveBeenCalledWith(numericUpdate);
    });

    it('should handle updating boolean fields', async () => {
      const booleanUpdate: UpdateProductInput = {
        id: 'product-1',
        isAvailable: false,
        isVeg: false,
      };
      const updatedProduct = { ...mockProduct, ...booleanUpdate };
      productService.updateProduct.mockResolvedValue(updatedProduct);

      const result = await resolver.updateProduct(booleanUpdate);

      expect(productService.updateProduct).toHaveBeenCalledWith(booleanUpdate);
    });
  });

  describe('deleteProduct mutation', () => {
    it('should call service deleteProduct with correct id', async () => {
      productService.deleteProduct.mockResolvedValue(true);

      const result = await resolver.deleteProduct('product-1');

      expect(productService.deleteProduct).toHaveBeenCalledWith('product-1');
      expect(result).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      productService.deleteProduct.mockRejectedValue(new Error('Service error'));

      await expect(resolver.deleteProduct('product-1')).rejects.toThrow('Service error');
    });

    it('should handle empty id', async () => {
      productService.deleteProduct.mockResolvedValue(true);

      const result = await resolver.deleteProduct('');

      expect(productService.deleteProduct).toHaveBeenCalledWith('');
    });

    it('should handle very long id', async () => {
      const longId = 'a'.repeat(1000);
      productService.deleteProduct.mockResolvedValue(true);

      const result = await resolver.deleteProduct(longId);

      expect(productService.deleteProduct).toHaveBeenCalledWith(longId);
    });

    it('should handle special characters in id', async () => {
      const specialId = 'product-1_@#$%^&*()';
      productService.deleteProduct.mockResolvedValue(true);

      const result = await resolver.deleteProduct(specialId);

      expect(productService.deleteProduct).toHaveBeenCalledWith(specialId);
    });
  });
});
