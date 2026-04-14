import { Test, TestingModule } from '@nestjs/testing';
import { ShopResolver } from './shop.resolver';
import { ShopService } from './shop.service';
import { Shop } from './entity/shop.entity';
import { CreateShopInput } from './dto/create-shop.input';
import { UpdateShopInput } from './dto/update-shop.input';

describe('ShopResolver', () => {
  let resolver: ShopResolver;
  let shopService: jest.Mocked<ShopService>;

  const mockShop: Shop = {
    id: 'shop-1',
    shopName: 'Test Shop',
    addressLine1: '123 Test St',
    addressLine2: 'Apt 4B',
    city: 'Test City',
    state: 'Test State',
    pinCode: '123456',
    country: 'India',
    pickupAddress: '123 Pickup St',
    gstNumber: 'GST123456',
    panNumber: 'PAN123456',
    businessRegistrationNumber: 'BRN123456',
    fssaiNumber: 'FSSAI123456',
    accountHolderName: 'Test Account',
    accountNumber: '1234567890',
    ifscCode: 'IFSC123456',
    bankName: 'Test Bank',
    cancelledChequeImage: 'cheque.jpg',
    alternatePhone: '9876543210',
    whatsappNumber: '9876543210',
    websiteUrl: 'https://test.com',
    instagram: '@testshop',
    facebook: 'testshop',
    sellerId: 'user-1',
    createdAt: new Date(),
    shopLicense: 'LIC123456',
  };

  const createShopInput: CreateShopInput = {
    shopName: 'Test Shop',
    addressLine1: '123 Test St',
    addressLine2: 'Apt 4B',
    city: 'Test City',
    state: 'Test State',
    pinCode: '123456',
    country: 'India',
    pickupAddress: '123 Pickup St',
    gstNumber: 'GST123456',
    panNumber: 'PAN123456',
    businessRegistrationNumber: 'BRN123456',
    fssaiNumber: 'FSSAI123456',
    accountHolderName: 'Test Account',
    accountNumber: '1234567890',
    ifscCode: 'IFSC123456',
    bankName: 'Test Bank',
    cancelledChequeImage: 'cheque.jpg',
    alternatePhone: '9876543210',
    whatsappNumber: '9876543210',
    websiteUrl: 'https://test.com',
    instagram: '@testshop',
    facebook: 'testshop',
    shopLicense: 'LIC123456',
  };

  const updateShopInput: UpdateShopInput = {
    id: 'shop-1',
    shopName: 'Updated Shop',
    city: 'Updated City',
  };

  const mockCtx = {
    req: {
      user: {
        userId: 'user-1',
        email: 'test@example.com',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopResolver,
        {
          provide: ShopService,
          useValue: {
            createShop: jest.fn(),
            findAllShops: jest.fn(),
            findOneShop: jest.fn(),
            updateShop: jest.fn(),
            deleteShop: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<ShopResolver>(ShopResolver);
    shopService = module.get(ShopService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createShop mutation', () => {
    it('should call service createShop with correct input', async () => {
      shopService.createShop.mockResolvedValue(mockShop);

      const resultPromise = resolver.createShop(createShopInput, mockCtx);
      const result = await resultPromise;
      const data = await result.data;

      expect(shopService.createShop).toHaveBeenCalledWith(
        createShopInput,
        mockCtx.req.user,
      );
      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('Shop created successfully');
      expect(data).toEqual(mockShop);
    });

    it('should handle create with minimal required fields', async () => {
      const minimalInput = {
        shopName: 'Minimal Shop',
        addressLine1: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        pinCode: '123456',
        gstNumber: 'GST123456',
        panNumber: 'PAN123456',
        accountHolderName: 'Test Account',
        accountNumber: '1234567890',
        ifscCode: 'IFSC123456',
        bankName: 'Test Bank',
      };
      shopService.createShop.mockResolvedValue(mockShop);

      const result = await resolver.createShop(minimalInput, mockCtx);
      const data = await result.data;

      expect(shopService.createShop).toHaveBeenCalledWith(minimalInput, mockCtx.req.user);
    });

    it('should handle empty shop name', async () => {
      const emptyNameInput = { ...createShopInput, shopName: '' };
      shopService.createShop.mockResolvedValue(mockShop);

      const result = await resolver.createShop(emptyNameInput, mockCtx);

      expect(shopService.createShop).toHaveBeenCalled();
    });

    it('should handle very long shop name', async () => {
      const longNameInput = { ...createShopInput, shopName: 'a'.repeat(1000) };
      shopService.createShop.mockResolvedValue(mockShop);

      const result = await resolver.createShop(longNameInput, mockCtx);

      expect(shopService.createShop).toHaveBeenCalled();
    });

    it('should handle shop name with special characters', async () => {
      const specialNameInput = { ...createShopInput, shopName: 'Shop@#$%^&*()' };
      shopService.createShop.mockResolvedValue(mockShop);

      const result = await resolver.createShop(specialNameInput, mockCtx);

      expect(shopService.createShop).toHaveBeenCalled();
    });

    it('should handle shop name with spaces', async () => {
      const spaceNameInput = { ...createShopInput, shopName: 'Test Shop Name' };
      shopService.createShop.mockResolvedValue(mockShop);

      const result = await resolver.createShop(spaceNameInput, mockCtx);

      expect(shopService.createShop).toHaveBeenCalled();
    });

    it('should handle shop name with numbers', async () => {
      const numberNameInput = { ...createShopInput, shopName: 'Shop123' };
      shopService.createShop.mockResolvedValue(mockShop);

      const result = await resolver.createShop(numberNameInput, mockCtx);

      expect(shopService.createShop).toHaveBeenCalled();
    });

    it('should handle input with undefined optional fields', async () => {
      const inputWithUndefined: CreateShopInput = {
        ...createShopInput,
        addressLine2: undefined,
        country: undefined,
        pickupAddress: undefined,
        businessRegistrationNumber: undefined,
        fssaiNumber: undefined,
        cancelledChequeImage: undefined,
        alternatePhone: undefined,
        whatsappNumber: undefined,
        websiteUrl: undefined,
        instagram: undefined,
        facebook: undefined,
        shopLicense: undefined,
      };
      shopService.createShop.mockResolvedValue(mockShop);

      const result = await resolver.createShop(inputWithUndefined, mockCtx);

      expect(shopService.createShop).toHaveBeenCalled();
    });

    it('should handle input with empty string optional fields', async () => {
      const inputWithEmpty: CreateShopInput = {
        ...createShopInput,
        addressLine2: '',
        country: '',
        pickupAddress: '',
        businessRegistrationNumber: '',
        fssaiNumber: '',
        cancelledChequeImage: '',
        alternatePhone: '',
        whatsappNumber: '',
        websiteUrl: '',
        instagram: '',
        facebook: '',
        shopLicense: '',
      };
      shopService.createShop.mockResolvedValue(mockShop);

      const result = await resolver.createShop(inputWithEmpty, mockCtx);

      expect(shopService.createShop).toHaveBeenCalled();
    });
  });

  describe('getAllShops query', () => {
    it('should return all shops for the user', async () => {
      const shops = [mockShop];
      shopService.findAllShops.mockResolvedValue(shops);

      const result = await resolver.getAllShops(mockCtx);
      const data = await result.data;

      expect(shopService.findAllShops).toHaveBeenCalledWith(mockCtx.req.user);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Shops retrieved successfully');
      expect(data).toEqual(shops);
    });

    it('should return empty array when no shops found', async () => {
      shopService.findAllShops.mockResolvedValue([]);

      const result = await resolver.getAllShops(mockCtx);
      const data = await result.data;

      expect(shopService.findAllShops).toHaveBeenCalledWith(mockCtx.req.user);
      expect(data).toEqual([]);
    });

    it('should return multiple shops', async () => {
      const shops = [
        mockShop,
        { ...mockShop, id: 'shop-2', shopName: 'Shop 2' },
        { ...mockShop, id: 'shop-3', shopName: 'Shop 3' },
      ];
      shopService.findAllShops.mockResolvedValue(shops);

      const result = await resolver.getAllShops(mockCtx);
      const data = await result.data;

      expect(data.length).toBe(3);
    });

    it('should handle null context', async () => {
      expect(() => resolver.getAllShops(null as any)).toThrow(TypeError);
    });

    it('should handle context with undefined user', async () => {
      const ctxWithUndefinedUser = { req: { user: undefined } };
      shopService.findAllShops.mockResolvedValue([]);

      const result = await resolver.getAllShops(ctxWithUndefinedUser as any);

      expect(shopService.findAllShops).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getShopbyId query', () => {
    it('should return a shop by id', async () => {
      shopService.findOneShop.mockResolvedValue(mockShop);

      const resultPromise = resolver.getShopbyId('shop-1', mockCtx);
      const result = await resultPromise;
      const data = await result.data;

      expect(shopService.findOneShop).toHaveBeenCalledWith('shop-1', mockCtx.req.user);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Shop retrieved successfully');
      expect(data).toEqual(mockShop);
    });

    it('should handle empty shop id', async () => {
      shopService.findOneShop.mockResolvedValue(mockShop);

      const result = await resolver.getShopbyId('', mockCtx);

      expect(shopService.findOneShop).toHaveBeenCalledWith('', mockCtx.req.user);
    });

    it('should handle very long shop id', async () => {
      const longId = 'a'.repeat(1000);
      shopService.findOneShop.mockResolvedValue(mockShop);

      const result = await resolver.getShopbyId(longId, mockCtx);

      expect(shopService.findOneShop).toHaveBeenCalledWith(longId, mockCtx.req.user);
    });

    it('should handle shop id with special characters', async () => {
      const specialId = 'shop-1_@#$%^&*()';
      shopService.findOneShop.mockResolvedValue(mockShop);

      const result = await resolver.getShopbyId(specialId, mockCtx);

      expect(shopService.findOneShop).toHaveBeenCalledWith(specialId, mockCtx.req.user);
    });

    it('should handle null context', async () => {
      expect(() => resolver.getShopbyId('shop-1', null as any)).toThrow(TypeError);
    });

    it('should handle context with undefined user', async () => {
      const ctxWithUndefinedUser = { req: { user: undefined } };
      shopService.findOneShop.mockResolvedValue(mockShop);

      const result = await resolver.getShopbyId('shop-1', ctxWithUndefinedUser as any);

      expect(shopService.findOneShop).toHaveBeenCalledWith('shop-1', undefined);
    });
  });

  describe('updateShopById mutation', () => {
    it('should call service updateShop with correct input', async () => {
      const updatedShop = { ...mockShop, shopName: 'Updated Shop' };
      shopService.updateShop.mockResolvedValue(updatedShop);

      const resultPromise = resolver.updateShopById(updateShopInput, mockCtx);
      const result = await resultPromise;
      const data = await result.data;

      expect(shopService.updateShop).toHaveBeenCalledWith(updateShopInput, mockCtx.req.user);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Shop updated successfully');
      expect(data).toEqual(updatedShop);
    });

    it('should handle partial update with only shopName', async () => {
      const partialUpdate = { id: 'shop-1', shopName: 'New Name' };
      shopService.updateShop.mockResolvedValue(mockShop);

      const result = await resolver.updateShopById(partialUpdate, mockCtx);

      expect(shopService.updateShop).toHaveBeenCalledWith(partialUpdate, mockCtx.req.user);
    });

    it('should handle update with undefined optional fields', async () => {
      const updateWithUndefined: UpdateShopInput = {
        id: 'shop-1',
        shopName: undefined,
        addressLine1: undefined,
        addressLine2: undefined,
        city: undefined,
        state: undefined,
        pinCode: undefined,
        country: undefined,
        pickupAddress: undefined,
        gstNumber: undefined,
        panNumber: undefined,
        businessRegistrationNumber: undefined,
        fssaiNumber: undefined,
        accountHolderName: undefined,
        accountNumber: undefined,
        ifscCode: undefined,
        bankName: undefined,
        cancelledChequeImage: undefined,
        alternatePhone: undefined,
        whatsappNumber: undefined,
        websiteUrl: undefined,
        instagram: undefined,
        facebook: undefined,
        shopLicense: undefined,
      };
      shopService.updateShop.mockResolvedValue(mockShop);

      const result = await resolver.updateShopById(updateWithUndefined, mockCtx);

      expect(shopService.updateShop).toHaveBeenCalledWith(updateWithUndefined, mockCtx.req.user);
    });

    it('should handle update with empty string values', async () => {
      const emptyUpdate = { id: 'shop-1', shopName: '', city: '' };
      shopService.updateShop.mockResolvedValue(mockShop);

      const result = await resolver.updateShopById(emptyUpdate, mockCtx);

      expect(shopService.updateShop).toHaveBeenCalledWith(emptyUpdate, mockCtx.req.user);
    });

    it('should handle update with very long values', async () => {
      const longUpdate = { id: 'shop-1', shopName: 'a'.repeat(1000) };
      shopService.updateShop.mockResolvedValue(mockShop);

      const result = await resolver.updateShopById(longUpdate, mockCtx);

      expect(shopService.updateShop).toHaveBeenCalledWith(longUpdate, mockCtx.req.user);
    });

    it('should handle update with special characters', async () => {
      const specialUpdate = { id: 'shop-1', shopName: 'Shop@#$%^&*()' };
      shopService.updateShop.mockResolvedValue(mockShop);

      const result = await resolver.updateShopById(specialUpdate, mockCtx);

      expect(shopService.updateShop).toHaveBeenCalledWith(specialUpdate, mockCtx.req.user);
    });

    it('should handle empty shop id', async () => {
      const emptyIdUpdate = { id: '', shopName: 'New Name' };
      shopService.updateShop.mockResolvedValue(mockShop);

      const result = await resolver.updateShopById(emptyIdUpdate, mockCtx);

      expect(shopService.updateShop).toHaveBeenCalledWith(emptyIdUpdate, mockCtx.req.user);
    });

    it('should handle null context', async () => {
      expect(() => resolver.updateShopById(updateShopInput, null as any)).toThrow(TypeError);
    });

    it('should handle context with undefined user', async () => {
      const ctxWithUndefinedUser = { req: { user: undefined } };
      shopService.updateShop.mockResolvedValue(mockShop);

      const result = await resolver.updateShopById(updateShopInput, ctxWithUndefinedUser as any);

      expect(shopService.updateShop).toHaveBeenCalledWith(updateShopInput, undefined);
    });
  });

  describe('deleteShopById mutation', () => {
    it('should call service deleteShop with correct id', async () => {
      shopService.deleteShop.mockResolvedValue(true);

      const result = await resolver.deleteShopById('shop-1', mockCtx);

      expect(shopService.deleteShop).toHaveBeenCalledWith('shop-1', mockCtx.req.user);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Shop deleted successfully',
        data: true,
      });
    });

    it('should handle empty shop id', async () => {
      shopService.deleteShop.mockResolvedValue(true);

      const result = await resolver.deleteShopById('', mockCtx);

      expect(shopService.deleteShop).toHaveBeenCalledWith('', mockCtx.req.user);
    });

    it('should handle very long shop id', async () => {
      const longId = 'a'.repeat(1000);
      shopService.deleteShop.mockResolvedValue(true);

      const result = await resolver.deleteShopById(longId, mockCtx);

      expect(shopService.deleteShop).toHaveBeenCalledWith(longId, mockCtx.req.user);
    });

    it('should handle shop id with special characters', async () => {
      const specialId = 'shop-1_@#$%^&*()';
      shopService.deleteShop.mockResolvedValue(true);

      const result = await resolver.deleteShopById(specialId, mockCtx);

      expect(shopService.deleteShop).toHaveBeenCalledWith(specialId, mockCtx.req.user);
    });

    it('should handle null context', async () => {
      expect(() => resolver.deleteShopById('shop-1', null as any)).toThrow(TypeError);
    });

    it('should handle context with undefined user', async () => {
      const ctxWithUndefinedUser = { req: { user: undefined } };
      shopService.deleteShop.mockResolvedValue(true);

      const result = await resolver.deleteShopById('shop-1', ctxWithUndefinedUser as any);

      expect(shopService.deleteShop).toHaveBeenCalledWith('shop-1', undefined);
    });

    it('should handle deleting the same shop multiple times', async () => {
      shopService.deleteShop.mockResolvedValue(true);

      const result1 = await resolver.deleteShopById('shop-1', mockCtx);
      const result2 = await resolver.deleteShopById('shop-1', mockCtx);

      expect(shopService.deleteShop).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(result2);
    });
  });
});
