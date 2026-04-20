import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Product } from '../products/entity/product.entity';
import { Category } from '../category/entity/category.entity';
import { SubCategory } from '../subcategory/entity/subcategory.entity';
import { Shop } from '../shop/entity/shop.entity';

describe('SearchService', () => {
  let service: SearchService;
  let elasticsearchService: jest.Mocked<ElasticsearchService>;

  // Mock entities
  const mockShop: Shop = {
    id: 'shop-1',
    shopName: 'Test Shop',
    addressLine1: '123 Test St',
    addressLine2: undefined,
    city: 'Test City',
    state: 'Test State',
    pinCode: '12345',
    country: 'India',
    pickupAddress: undefined,
    gstNumber: 'GST123456',
    panNumber: 'PAN123456',
    businessRegistrationNumber: undefined,
    fssaiNumber: undefined,
    accountHolderName: 'Test Account',
    accountNumber: '1234567890',
    ifscCode: 'IFSC123',
    bankName: 'Test Bank',
    cancelledChequeImage: undefined,
    alternatePhone: undefined,
    whatsappNumber: undefined,
    websiteUrl: undefined,
    instagram: undefined,
    facebook: undefined,
    sellerId: undefined,
    shopLicense: undefined,
    createdAt: new Date(),
    seller: undefined,
  };

  const mockCategory: Category = {
    id: 'category-1',
    name: 'Electronics',
    description: 'Electronic items',
    subCategories: [],
  };

  const mockSubCategory: SubCategory = {
    id: 'subcategory-1',
    name: 'Mobile Phones',
    category: mockCategory,
  };

  const mockProduct: Product = {
    id: 'product-1',
    name: 'iPhone 15',
    description: 'Latest iPhone',
    longDescription: 'The most advanced iPhone',
    mrp: 99999,
    sellingPrice: 89999,
    discountPercentage: 10,
    stockQuantity: 50,
    isAvailable: true,
    lowStockThreshold: 5,
    unit: 'pieces',
    unitValue: 1,
    packSize: '1 piece',
    brand: 'Apple',
    isVeg: true,
    expiryDays: undefined as any,
    images: ['image1.jpg'],
    createdAt: new Date(),
    updatedAt: new Date(),
    shopId: 'shop-1',
    categoryId: 'category-1',
    subCategoryId: 'subcategory-1',
    shop: mockShop,
    category: mockCategory,
    subCategory: mockSubCategory,
  };

  const mockProductWithoutRelations = {
    id: 'product-2',
    name: 'Samsung Galaxy',
    description: 'Android phone',
    longDescription: '',
    mrp: 79999,
    sellingPrice: 69999,
    discountPercentage: null as any,
    stockQuantity: 30,
    isAvailable: false,
    lowStockThreshold: null as any,
    unit: 'pieces',
    unitValue: 1,
    packSize: null as any,
    brand: 'Samsung',
    isVeg: true,
    expiryDays: null as any,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    shopId: null as any,
    categoryId: null as any,
    subCategoryId: null as any,
    shop: null as any,
    category: null as any,
    subCategory: null as any,
  } as Product;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: ElasticsearchService,
          useFactory: () => ({
            index: jest.fn(),
            delete: jest.fn(),
            search: jest.fn(),
            bulk: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    elasticsearchService = module.get(ElasticsearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('indexProduct', () => {
    it('should index a product with all relations', async () => {
      // Arrange
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      // Act
      await service.indexProduct(mockProduct);

      // Assert
      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'products',
        id: 'product-1',
        document: {
          id: 'product-1',
          name: 'iPhone 15',
          description: 'Latest iPhone',
          mrp: 99999,
          sellingPrice: 89999,
          category: 'Electronics',
          subCategory: 'Mobile Phones',
          shop: 'Test Shop',
          isAvailable: true,
          stockQuantity: 50,
        },
      });
    });

    it('should index a product without relations (null values)', async () => {
      // Arrange
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      // Act
      await service.indexProduct(mockProductWithoutRelations);

      // Assert
      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'products',
        id: 'product-2',
        document: {
          id: 'product-2',
          name: 'Samsung Galaxy',
          description: 'Android phone',
          mrp: 79999,
          sellingPrice: 69999,
          category: undefined,
          subCategory: undefined,
          shop: undefined,
          isAvailable: false,
          stockQuantity: 30,
        },
      });
    });

    it('should handle Elasticsearch index error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.index.mockRejectedValue(error);

      // Act & Assert
      await expect(service.indexProduct(mockProduct)).rejects.toThrow(
        'Elasticsearch connection error',
      );
      expect(elasticsearchService.index).toHaveBeenCalledTimes(1);
    });

    it('should handle null description', async () => {
      // Arrange
      const productWithNullDescription: Product = {
        ...mockProduct,
        description: null as any,
      };
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      // Act
      await service.indexProduct(productWithNullDescription);

      // Assert
      expect(elasticsearchService.index).toHaveBeenCalledWith(
        expect.objectContaining({
          document: expect.objectContaining({
            description: null,
          }),
        }),
      );
    });

    it('should handle zero stock quantity', async () => {
      // Arrange
      const productWithZeroStock: Product = {
        ...mockProduct,
        stockQuantity: 0,
      };
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      // Act
      await service.indexProduct(productWithZeroStock);

      // Assert
      expect(elasticsearchService.index).toHaveBeenCalledWith(
        expect.objectContaining({
          document: expect.objectContaining({
            stockQuantity: 0,
          }),
        }),
      );
    });
  });

  describe('indexCategory', () => {
    it('should index a category with all fields', async () => {
      // Arrange
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      // Act
      await service.indexCategory(mockCategory);

      // Assert
      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'categories',
        id: 'category-1',
        document: {
          id: 'category-1',
          name: 'Electronics',
          description: 'Electronic items',
        },
      });
    });

    it('should index a category with null description', async () => {
      // Arrange
      const categoryWithNullDescription: Category = {
        ...mockCategory,
        description: null as any,
      };
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      // Act
      await service.indexCategory(categoryWithNullDescription);

      // Assert
      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'categories',
        id: 'category-1',
        document: {
          id: 'category-1',
          name: 'Electronics',
          description: null,
        },
      });
    });

    it('should handle Elasticsearch index error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.index.mockRejectedValue(error);

      // Act & Assert
      await expect(service.indexCategory(mockCategory)).rejects.toThrow(
        'Elasticsearch connection error',
      );
      expect(elasticsearchService.index).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string description', async () => {
      // Arrange
      const categoryWithEmptyDescription: Category = {
        ...mockCategory,
        description: '' as any,
      };
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      // Act
      await service.indexCategory(categoryWithEmptyDescription);

      // Assert
      expect(elasticsearchService.index).toHaveBeenCalledWith(
        expect.objectContaining({
          document: expect.objectContaining({
            description: '',
          }),
        }),
      );
    });
  });

  describe('indexSubCategory', () => {
    it('should index a subcategory with category relation', async () => {
      // Arrange
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      // Act
      await service.indexSubCategory(mockSubCategory);

      // Assert
      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'subcategories',
        id: 'subcategory-1',
        document: {
          id: 'subcategory-1',
          name: 'Mobile Phones',
          category: 'Electronics',
        },
      });
    });

    it('should index a subcategory without category relation', async () => {
      // Arrange
      const subCategoryWithoutCategory: SubCategory = {
        id: 'subcategory-2',
        name: 'Tablets',
        category: null as any,
      };
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      // Act
      await service.indexSubCategory(subCategoryWithoutCategory);

      // Assert
      expect(elasticsearchService.index).toHaveBeenCalledWith({
        index: 'subcategories',
        id: 'subcategory-2',
        document: {
          id: 'subcategory-2',
          name: 'Tablets',
          category: undefined,
        },
      });
    });

    it('should handle Elasticsearch index error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.index.mockRejectedValue(error);

      // Act & Assert
      await expect(service.indexSubCategory(mockSubCategory)).rejects.toThrow(
        'Elasticsearch connection error',
      );
      expect(elasticsearchService.index).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product by ID', async () => {
      // Arrange
      elasticsearchService.delete.mockResolvedValue({ result: 'deleted' } as any);

      // Act
      await service.deleteProduct('product-1');

      // Assert
      expect(elasticsearchService.delete).toHaveBeenCalledWith({
        index: 'products',
        id: 'product-1',
      });
    });

    it('should handle Elasticsearch delete error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteProduct('product-1')).rejects.toThrow(
        'Elasticsearch connection error',
      );
      expect(elasticsearchService.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle non-existent product deletion', async () => {
      // Arrange
      elasticsearchService.delete.mockResolvedValue({ result: 'not_found' } as any);

      // Act
      await service.deleteProduct('non-existent-id');

      // Assert
      expect(elasticsearchService.delete).toHaveBeenCalledWith({
        index: 'products',
        id: 'non-existent-id',
      });
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category by ID', async () => {
      // Arrange
      elasticsearchService.delete.mockResolvedValue({ result: 'deleted' } as any);

      // Act
      await service.deleteCategory('category-1');

      // Assert
      expect(elasticsearchService.delete).toHaveBeenCalledWith({
        index: 'categories',
        id: 'category-1',
      });
    });

    it('should handle Elasticsearch delete error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteCategory('category-1')).rejects.toThrow(
        'Elasticsearch connection error',
      );
      expect(elasticsearchService.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteSubCategory', () => {
    it('should delete a subcategory by ID', async () => {
      // Arrange
      elasticsearchService.delete.mockResolvedValue({ result: 'deleted' } as any);

      // Act
      await service.deleteSubCategory('subcategory-1');

      // Assert
      expect(elasticsearchService.delete).toHaveBeenCalledWith({
        index: 'subcategories',
        id: 'subcategory-1',
      });
    });

    it('should handle Elasticsearch delete error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteSubCategory('subcategory-1')).rejects.toThrow(
        'Elasticsearch connection error',
      );
      expect(elasticsearchService.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchProducts', () => {
    const mockSearchResponse = {
      hits: {
        hits: [
          {
            _source: {
              id: 'product-1',
              name: 'iPhone 15',
              description: 'Latest iPhone',
              mrp: 99999,
              sellingPrice: 89999,
              category: 'Electronics',
              subCategory: 'Mobile Phones',
              shop: 'Test Shop',
              isAvailable: true,
              stockQuantity: 50,
            },
            _score: 1.5,
          },
        ],
      },
    };

    it('should search products and return mapped results', async () => {
      // Arrange
      elasticsearchService.search.mockResolvedValue(mockSearchResponse as any);

      // Act
      const result = await service.searchProducts('iPhone');

      // Assert
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'products',
        query: {
          multi_match: {
            query: 'iPhone',
            fields: ['name', 'description', 'category', 'subCategory', 'shop'],
            fuzziness: 'AUTO',
          },
        },
      });
      expect(result).toEqual([
        {
          id: 'product-1',
          name: 'iPhone 15',
          description: 'Latest iPhone',
          mrp: 99999,
          sellingPrice: 89999,
          category: 'Electronics',
          subCategory: 'Mobile Phones',
          shop: 'Test Shop',
          isAvailable: true,
          stockQuantity: 50,
          score: 1.5,
        },
      ]);
    });

    it('should return empty array when no results found', async () => {
      // Arrange
      elasticsearchService.search.mockResolvedValue({ hits: { hits: [] } } as any);

      // Act
      const result = await service.searchProducts('nonexistent');

      // Assert
      expect(result).toEqual([]);
      expect(elasticsearchService.search).toHaveBeenCalledTimes(1);
    });

    it('should handle Elasticsearch search error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.search.mockRejectedValue(error);

      // Act & Assert
      await expect(service.searchProducts('iPhone')).rejects.toThrow(
        'Elasticsearch connection error',
      );
      expect(elasticsearchService.search).toHaveBeenCalledTimes(1);
    });

    it('should search with empty query string', async () => {
      // Arrange
      elasticsearchService.search.mockResolvedValue({ hits: { hits: [] } } as any);

      // Act
      await service.searchProducts('');

      // Assert
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'products',
        query: {
          multi_match: {
            query: '',
            fields: ['name', 'description', 'category', 'subCategory', 'shop'],
            fuzziness: 'AUTO',
          },
        },
      });
    });

    it('should handle products with null/undefined fields in search results', async () => {
      // Arrange
      const responseWithNulls = {
        hits: {
          hits: [
            {
              _source: {
                id: 'product-2',
                name: 'Test Product',
                description: null,
                mrp: 100,
                sellingPrice: 80,
                category: null,
                subCategory: null,
                shop: null,
                isAvailable: false,
                stockQuantity: 0,
              },
              _score: 0.5,
            },
          ],
        },
      };
      elasticsearchService.search.mockResolvedValue(responseWithNulls as any);

      // Act
      const result = await service.searchProducts('test');

      // Assert
      expect(result).toEqual([
        {
          id: 'product-2',
          name: 'Test Product',
          description: null,
          mrp: 100,
          sellingPrice: 80,
          category: null,
          subCategory: null,
          shop: null,
          isAvailable: false,
          stockQuantity: 0,
          score: 0.5,
        },
      ]);
    });

    it('should handle multiple search results', async () => {
      // Arrange
      const multipleResults = {
        hits: {
          hits: [
            {
              _source: {
                id: 'product-1',
                name: 'iPhone 15',
                description: 'Latest iPhone',
                mrp: 99999,
                sellingPrice: 89999,
                category: 'Electronics',
                subCategory: 'Mobile Phones',
                shop: 'Test Shop',
                isAvailable: true,
                stockQuantity: 50,
              },
              _score: 1.5,
            },
            {
              _source: {
                id: 'product-2',
                name: 'iPhone 14',
                description: 'Previous iPhone',
                mrp: 79999,
                sellingPrice: 69999,
                category: 'Electronics',
                subCategory: 'Mobile Phones',
                shop: 'Test Shop',
                isAvailable: true,
                stockQuantity: 30,
              },
              _score: 1.2,
            },
          ],
        },
      };
      elasticsearchService.search.mockResolvedValue(multipleResults as any);

      // Act
      const result = await service.searchProducts('iPhone');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('product-1');
      expect(result[1].id).toBe('product-2');
    });
  });

  describe('searchCategories', () => {
    const mockSearchResponse = {
      hits: {
        hits: [
          {
            _source: {
              id: 'category-1',
              name: 'Electronics',
              description: 'Electronic items',
            },
            _score: 1.5,
          },
        ],
      },
    };

    it('should search categories and return mapped results', async () => {
      // Arrange
      elasticsearchService.search.mockResolvedValue(mockSearchResponse as any);

      // Act
      const result = await service.searchCategories('Electronics');

      // Assert
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'categories',
        query: {
          multi_match: {
            query: 'Electronics',
            fields: ['name', 'description'],
            fuzziness: 'AUTO',
          },
        },
      });
      expect(result).toEqual([
        {
          id: 'category-1',
          name: 'Electronics',
          description: 'Electronic items',
          score: 1.5,
        },
      ]);
    });

    it('should return empty array when no results found', async () => {
      // Arrange
      elasticsearchService.search.mockResolvedValue({ hits: { hits: [] } } as any);

      // Act
      const result = await service.searchCategories('nonexistent');

      // Assert
      expect(result).toEqual([]);
      expect(elasticsearchService.search).toHaveBeenCalledTimes(1);
    });

    it('should handle Elasticsearch search error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.search.mockRejectedValue(error);

      // Act & Assert
      await expect(service.searchCategories('Electronics')).rejects.toThrow(
        'Elasticsearch connection error',
      );
      expect(elasticsearchService.search).toHaveBeenCalledTimes(1);
    });

    it('should search with empty query string', async () => {
      // Arrange
      elasticsearchService.search.mockResolvedValue({ hits: { hits: [] } } as any);

      // Act
      await service.searchCategories('');

      // Assert
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'categories',
        query: {
          multi_match: {
            query: '',
            fields: ['name', 'description'],
            fuzziness: 'AUTO',
          },
        },
      });
    });

    it('should handle categories with null description', async () => {
      // Arrange
      const responseWithNull = {
        hits: {
          hits: [
            {
              _source: {
                id: 'category-2',
                name: 'Books',
                description: null,
              },
              _score: 0.8,
            },
          ],
        },
      };
      elasticsearchService.search.mockResolvedValue(responseWithNull as any);

      // Act
      const result = await service.searchCategories('Books');

      // Assert
      expect(result).toEqual([
        {
          id: 'category-2',
          name: 'Books',
          description: null,
          score: 0.8,
        },
      ]);
    });
  });

  describe('searchSubCategories', () => {
    const mockSearchResponse = {
      hits: {
        hits: [
          {
            _source: {
              id: 'subcategory-1',
              name: 'Mobile Phones',
              category: 'Electronics',
            },
            _score: 1.5,
          },
        ],
      },
    };

    it('should search subcategories and return mapped results', async () => {
      // Arrange
      elasticsearchService.search.mockResolvedValue(mockSearchResponse as any);

      // Act
      const result = await service.searchSubCategories('Mobile');

      // Assert
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'subcategories',
        query: {
          multi_match: {
            query: 'Mobile',
            fields: ['name', 'category'],
            fuzziness: 'AUTO',
          },
        },
      });
      expect(result).toEqual([
        {
          id: 'subcategory-1',
          name: 'Mobile Phones',
          category: 'Electronics',
          score: 1.5,
        },
      ]);
    });

    it('should return empty array when no results found', async () => {
      // Arrange
      elasticsearchService.search.mockResolvedValue({ hits: { hits: [] } } as any);

      // Act
      const result = await service.searchSubCategories('nonexistent');

      // Assert
      expect(result).toEqual([]);
      expect(elasticsearchService.search).toHaveBeenCalledTimes(1);
    });

    it('should handle Elasticsearch search error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.search.mockRejectedValue(error);

      // Act & Assert
      await expect(service.searchSubCategories('Mobile')).rejects.toThrow(
        'Elasticsearch connection error',
      );
      expect(elasticsearchService.search).toHaveBeenCalledTimes(1);
    });

    it('should search with empty query string', async () => {
      // Arrange
      elasticsearchService.search.mockResolvedValue({ hits: { hits: [] } } as any);

      // Act
      await service.searchSubCategories('');

      // Assert
      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: 'subcategories',
        query: {
          multi_match: {
            query: '',
            fields: ['name', 'category'],
            fuzziness: 'AUTO',
          },
        },
      });
    });

    it('should handle subcategories with null category', async () => {
      // Arrange
      const responseWithNull = {
        hits: {
          hits: [
            {
              _source: {
                id: 'subcategory-2',
                name: 'Uncategorized',
                category: null,
              },
              _score: 0.5,
            },
          ],
        },
      };
      elasticsearchService.search.mockResolvedValue(responseWithNull as any);

      // Act
      const result = await service.searchSubCategories('Uncategorized');

      // Assert
      expect(result).toEqual([
        {
          id: 'subcategory-2',
          name: 'Uncategorized',
          category: null,
          score: 0.5,
        },
      ]);
    });
  });

  describe('bulkIndexProducts', () => {
    it('should bulk index multiple products', async () => {
      // Arrange
      const products = [mockProduct, mockProductWithoutRelations];
      elasticsearchService.bulk.mockResolvedValue({ errors: false } as any);

      // Act
      await service.bulkIndexProducts(products);

      // Assert
      expect(elasticsearchService.bulk).toHaveBeenCalledWith({
        operations: expect.arrayContaining([
          expect.objectContaining({
            index: { _index: 'products', _id: 'product-1' },
          }),
          expect.objectContaining({
            id: 'product-1',
            name: 'iPhone 15',
            description: 'Latest iPhone',
            mrp: 99999,
            sellingPrice: 89999,
            category: 'Electronics',
            subCategory: 'Mobile Phones',
            shop: 'Test Shop',
            isAvailable: true,
            stockQuantity: 50,
          }),
          expect.objectContaining({
            index: { _index: 'products', _id: 'product-2' },
          }),
          expect.objectContaining({
            id: 'product-2',
            name: 'Samsung Galaxy',
            description: 'Android phone',
            mrp: 79999,
            sellingPrice: 69999,
            category: undefined,
            subCategory: undefined,
            shop: undefined,
            isAvailable: false,
            stockQuantity: 30,
          }),
        ]),
      });
    });

    it('should handle empty array of products', async () => {
      // Arrange
      elasticsearchService.bulk.mockResolvedValue({ errors: false } as any);

      // Act
      await service.bulkIndexProducts([]);

      // Assert
      expect(elasticsearchService.bulk).toHaveBeenCalledWith({ operations: [] });
    });

    it('should handle Elasticsearch bulk error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.bulk.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.bulkIndexProducts([mockProduct]),
      ).rejects.toThrow('Elasticsearch connection error');
      expect(elasticsearchService.bulk).toHaveBeenCalledTimes(1);
    });

    it('should handle single product in bulk', async () => {
      // Arrange
      elasticsearchService.bulk.mockResolvedValue({ errors: false } as any);

      // Act
      await service.bulkIndexProducts([mockProduct]);

      // Assert
      expect(elasticsearchService.bulk).toHaveBeenCalledWith({
        operations: expect.arrayContaining([
          expect.objectContaining({
            index: { _index: 'products', _id: 'product-1' },
          }),
          expect.objectContaining({
            id: 'product-1',
            name: 'iPhone 15',
          }),
        ]),
      });
    });
  });

  describe('bulkIndexCategories', () => {
    it('should bulk index multiple categories', async () => {
      // Arrange
      const categories = [
        mockCategory,
        { ...mockCategory, id: 'category-2', name: 'Books' },
      ];
      elasticsearchService.bulk.mockResolvedValue({ errors: false } as any);

      // Act
      await service.bulkIndexCategories(categories);

      // Assert
      expect(elasticsearchService.bulk).toHaveBeenCalledWith({
        operations: expect.arrayContaining([
          expect.objectContaining({
            index: { _index: 'categories', _id: 'category-1' },
          }),
          expect.objectContaining({
            id: 'category-1',
            name: 'Electronics',
            description: 'Electronic items',
          }),
          expect.objectContaining({
            index: { _index: 'categories', _id: 'category-2' },
          }),
          expect.objectContaining({
            id: 'category-2',
            name: 'Books',
            description: 'Electronic items',
          }),
        ]),
      });
    });

    it('should handle empty array of categories', async () => {
      // Arrange
      elasticsearchService.bulk.mockResolvedValue({ errors: false } as any);

      // Act
      await service.bulkIndexCategories([]);

      // Assert
      expect(elasticsearchService.bulk).toHaveBeenCalledWith({ operations: [] });
    });

    it('should handle Elasticsearch bulk error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.bulk.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.bulkIndexCategories([mockCategory]),
      ).rejects.toThrow('Elasticsearch connection error');
      expect(elasticsearchService.bulk).toHaveBeenCalledTimes(1);
    });

    it('should handle categories with null description in bulk', async () => {
      // Arrange
      const categories = [{ ...mockCategory, description: null as any }];
      elasticsearchService.bulk.mockResolvedValue({ errors: false } as any);

      // Act
      await service.bulkIndexCategories(categories);

      // Assert
      expect(elasticsearchService.bulk).toHaveBeenCalledWith({
        operations: expect.arrayContaining([
          expect.objectContaining({
            id: 'category-1',
            description: null,
          }),
        ]),
      });
    });
  });

  describe('bulkIndexSubCategories', () => {
    it('should bulk index multiple subcategories', async () => {
      // Arrange
      const subCategories = [
        mockSubCategory,
        {
          id: 'subcategory-2',
          name: 'Tablets',
          category: mockCategory,
        },
      ];
      elasticsearchService.bulk.mockResolvedValue({ errors: false } as any);

      // Act
      await service.bulkIndexSubCategories(subCategories);

      // Assert
      expect(elasticsearchService.bulk).toHaveBeenCalledWith({
        operations: expect.arrayContaining([
          expect.objectContaining({
            index: { _index: 'subcategories', _id: 'subcategory-1' },
          }),
          expect.objectContaining({
            id: 'subcategory-1',
            name: 'Mobile Phones',
            category: 'Electronics',
          }),
          expect.objectContaining({
            index: { _index: 'subcategories', _id: 'subcategory-2' },
          }),
          expect.objectContaining({
            id: 'subcategory-2',
            name: 'Tablets',
            category: 'Electronics',
          }),
        ]),
      });
    });

    it('should handle empty array of subcategories', async () => {
      // Arrange
      elasticsearchService.bulk.mockResolvedValue({ errors: false } as any);

      // Act
      await service.bulkIndexSubCategories([]);

      // Assert
      expect(elasticsearchService.bulk).toHaveBeenCalledWith({ operations: [] });
    });

    it('should handle Elasticsearch bulk error', async () => {
      // Arrange
      const error = new Error('Elasticsearch connection error');
      elasticsearchService.bulk.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.bulkIndexSubCategories([mockSubCategory]),
      ).rejects.toThrow('Elasticsearch connection error');
      expect(elasticsearchService.bulk).toHaveBeenCalledTimes(1);
    });

    it('should handle subcategories without category in bulk', async () => {
      // Arrange
      const subCategories = [
        { id: 'subcategory-2', name: 'Uncategorized', category: null as any },
      ];
      elasticsearchService.bulk.mockResolvedValue({ errors: false } as any);

      // Act
      await service.bulkIndexSubCategories(subCategories);

      // Assert
      expect(elasticsearchService.bulk).toHaveBeenCalledWith({
        operations: expect.arrayContaining([
          expect.objectContaining({
            id: 'subcategory-2',
            name: 'Uncategorized',
            category: undefined,
          }),
        ]),
      });
    });
  });

  describe('Service initialization', () => {
    it('should be defined', () => {
      // Assert
      expect(service).toBeDefined();
    });

    it('should have correct index names', () => {
      // Assert
      expect((service as any).productIndex).toBe('products');
      expect((service as any).categoryIndex).toBe('categories');
      expect((service as any).subCategoryIndex).toBe('subcategories');
    });
  });
});
