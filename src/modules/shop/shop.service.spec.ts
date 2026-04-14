import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ShopService } from './shop.service';
import { Shop } from './entity/shop.entity';
import { CreateShopInput } from './dto/create-shop.input';
import { UpdateShopInput } from './dto/update-shop.input';

describe('ShopService', () => {
  let service: ShopService;
  let shopRepo: jest.Mocked<Repository<Shop>>;

  const mockUser = {
    userId: 'user-1',
    email: 'test@example.com',
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopService,
        {
          provide: getRepositoryToken(Shop),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ShopService>(ShopService);
    shopRepo = module.get(getRepositoryToken(Shop));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createShop', () => {
    it('should create a shop successfully', async () => {
      shopRepo.create.mockReturnValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.createShop(createShopInput, mockUser);

      expect(shopRepo.create).toHaveBeenCalledWith({
        ...createShopInput,
        sellerId: mockUser.userId,
      });
      expect(shopRepo.save).toHaveBeenCalledWith(mockShop);
      expect(result).toEqual(mockShop);
    });

    it('should create a shop with minimal required fields', async () => {
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
      shopRepo.create.mockReturnValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.createShop(minimalInput, mockUser);

      expect(shopRepo.create).toHaveBeenCalledWith({
        ...minimalInput,
        sellerId: mockUser.userId,
      });
      expect(shopRepo.save).toHaveBeenCalledWith(mockShop);
    });

    it('should handle empty shop name', async () => {
      const emptyNameInput = { ...createShopInput, shopName: '' };
      shopRepo.create.mockReturnValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.createShop(emptyNameInput, mockUser);

      expect(shopRepo.create).toHaveBeenCalled();
    });

    it('should handle very long shop name', async () => {
      const longNameInput = { ...createShopInput, shopName: 'a'.repeat(1000) };
      shopRepo.create.mockReturnValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.createShop(longNameInput, mockUser);

      expect(shopRepo.create).toHaveBeenCalled();
    });

    it('should handle shop name with special characters', async () => {
      const specialNameInput = { ...createShopInput, shopName: 'Shop@#$%^&*()' };
      shopRepo.create.mockReturnValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.createShop(specialNameInput, mockUser);

      expect(shopRepo.create).toHaveBeenCalled();
    });

    it('should handle database errors during save', async () => {
      shopRepo.create.mockReturnValue(mockShop);
      shopRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createShop(createShopInput, mockUser)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle null user', async () => {
      shopRepo.create.mockReturnValue(mockShop);

      expect(() => service.createShop(createShopInput, null as any)).toThrow(TypeError);
    });

    it('should handle user with undefined userId', async () => {
      const userWithUndefinedId = { ...mockUser, userId: undefined };
      shopRepo.create.mockReturnValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.createShop(createShopInput, userWithUndefinedId);

      expect(shopRepo.create).toHaveBeenCalledWith({
        ...createShopInput,
        sellerId: undefined,
      });
    });
  });

  describe('findAllShops', () => {
    it('should return all shops for the user', async () => {
      const shops = [mockShop];
      shopRepo.find.mockResolvedValue(shops);

      const result = await service.findAllShops(mockUser);

      expect(shopRepo.find).toHaveBeenCalledWith({
        where: { sellerId: mockUser.userId },
      });
      expect(result).toEqual(shops);
    });

    it('should return empty array when no shops found', async () => {
      shopRepo.find.mockResolvedValue([]);

      const result = await service.findAllShops(mockUser);

      expect(shopRepo.find).toHaveBeenCalledWith({
        where: { sellerId: mockUser.userId },
      });
      expect(result).toEqual([]);
    });

    it('should handle multiple shops for the user', async () => {
      const shops = [
        mockShop,
        { ...mockShop, id: 'shop-2', shopName: 'Shop 2' },
        { ...mockShop, id: 'shop-3', shopName: 'Shop 3' },
      ];
      shopRepo.find.mockResolvedValue(shops);

      const result = await service.findAllShops(mockUser);

      expect(result.length).toBe(3);
    });

    it('should handle database errors', async () => {
      shopRepo.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAllShops(mockUser)).rejects.toThrow('Database error');
    });

    it('should handle null user', async () => {
      expect(() => service.findAllShops(null as any)).toThrow(TypeError);
    });

    it('should handle user with undefined userId', async () => {
      const userWithUndefinedId = { ...mockUser, userId: undefined };
      shopRepo.find.mockResolvedValue([]);

      const result = await service.findAllShops(userWithUndefinedId);

      expect(shopRepo.find).toHaveBeenCalledWith({
        where: { sellerId: undefined },
      });
    });
  });

  describe('findOneShop', () => {
    it('should return a shop by id for the owner', async () => {
      shopRepo.findOne.mockResolvedValue(mockShop);

      const result = await service.findOneShop('shop-1', mockUser);

      expect(shopRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'shop-1' },
      });
      expect(result).toEqual(mockShop);
    });

    it('should throw NotFoundException when shop not found', async () => {
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneShop('invalid-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneShop('invalid-id', mockUser)).rejects.toThrow(
        'shop not found',
      );
    });

    it('should throw ForbiddenException when user is not the owner', async () => {
      const otherUser = { userId: 'user-2', email: 'other@example.com' };
      const shopWithDifferentOwner = { ...mockShop, sellerId: 'user-2' };
      shopRepo.findOne.mockResolvedValue(shopWithDifferentOwner);

      await expect(service.findOneShop('shop-1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOneShop('shop-1', mockUser)).rejects.toThrow(
        'Access Denied',
      );
    });

    it('should handle empty shop id', async () => {
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneShop('', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle very long shop id', async () => {
      const longId = 'a'.repeat(1000);
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneShop(longId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle shop id with special characters', async () => {
      const specialId = 'shop-1_@#$%^&*()';
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneShop(specialId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle database errors', async () => {
      shopRepo.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.findOneShop('shop-1', mockUser)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle null user', async () => {
      shopRepo.findOne.mockResolvedValue(mockShop);

      await expect(service.findOneShop('shop-1', null as any)).rejects.toThrow(TypeError);
    });

    it('should handle user with undefined userId', async () => {
      const userWithUndefinedId = { ...mockUser, userId: undefined };
      shopRepo.findOne.mockResolvedValue(mockShop);

      await expect(service.findOneShop('shop-1', userWithUndefinedId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateShop', () => {
    it('should update a shop successfully', async () => {
      const updatedShop = { ...mockShop, shopName: 'Updated Shop' };
      shopRepo.findOne.mockResolvedValue(mockShop);
      shopRepo.save.mockResolvedValue(updatedShop);

      const result = await service.updateShop(updateShopInput, mockUser);

      expect(shopRepo.save).toHaveBeenCalled();
      expect(result).toEqual(updatedShop);
    });

    it('should throw NotFoundException when shop not found during update', async () => {
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.updateShop(updateShopInput, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not the owner during update', async () => {
      const otherUser = { userId: 'user-2', email: 'other@example.com' };
      const shopWithDifferentOwner = { ...mockShop, sellerId: 'user-2' };
      shopRepo.findOne.mockResolvedValue(shopWithDifferentOwner);

      await expect(service.updateShop(updateShopInput, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle partial update with only shopName', async () => {
      const partialUpdate = { id: 'shop-1', shopName: 'New Name' };
      shopRepo.findOne.mockResolvedValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.updateShop(partialUpdate, mockUser);

      expect(shopRepo.save).toHaveBeenCalled();
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
      shopRepo.findOne.mockResolvedValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.updateShop(updateWithUndefined, mockUser);

      expect(shopRepo.save).toHaveBeenCalled();
    });

    it('should handle update with empty string values', async () => {
      const emptyUpdate = { id: 'shop-1', shopName: '', city: '' };
      shopRepo.findOne.mockResolvedValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.updateShop(emptyUpdate, mockUser);

      expect(shopRepo.save).toHaveBeenCalled();
    });

    it('should handle update with very long values', async () => {
      const longUpdate = { id: 'shop-1', shopName: 'a'.repeat(1000) };
      shopRepo.findOne.mockResolvedValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.updateShop(longUpdate, mockUser);

      expect(shopRepo.save).toHaveBeenCalled();
    });

    it('should handle update with special characters', async () => {
      const specialUpdate = { id: 'shop-1', shopName: 'Shop@#$%^&*()' };
      shopRepo.findOne.mockResolvedValue(mockShop);
      shopRepo.save.mockResolvedValue(mockShop);

      const result = await service.updateShop(specialUpdate, mockUser);

      expect(shopRepo.save).toHaveBeenCalled();
    });

    it('should handle database errors during save', async () => {
      shopRepo.findOne.mockResolvedValue(mockShop);
      shopRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.updateShop(updateShopInput, mockUser)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle empty shop id', async () => {
      const emptyIdUpdate = { id: '', shopName: 'New Name' };
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.updateShop(emptyIdUpdate, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteShop', () => {
    it('should delete a shop successfully', async () => {
      shopRepo.findOne.mockResolvedValue(mockShop);
      shopRepo.remove.mockResolvedValue(mockShop);

      const result = await service.deleteShop('shop-1', mockUser);

      expect(shopRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'shop-1' },
      });
      expect(shopRepo.remove).toHaveBeenCalledWith(mockShop);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when shop not found during delete', async () => {
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteShop('invalid-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not the owner during delete', async () => {
      const otherUser = { userId: 'user-2', email: 'other@example.com' };
      const shopWithDifferentOwner = { ...mockShop, sellerId: 'user-2' };
      shopRepo.findOne.mockResolvedValue(shopWithDifferentOwner);

      await expect(service.deleteShop('shop-1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle empty shop id', async () => {
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteShop('', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle very long shop id', async () => {
      const longId = 'a'.repeat(1000);
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteShop(longId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle shop id with special characters', async () => {
      const specialId = 'shop-1_@#$%^&*()';
      shopRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteShop(specialId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle database errors during remove', async () => {
      shopRepo.findOne.mockResolvedValue(mockShop);
      shopRepo.remove.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteShop('shop-1', mockUser)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle null user', async () => {
      shopRepo.findOne.mockResolvedValue(mockShop);

      await expect(service.deleteShop('shop-1', null as any)).rejects.toThrow(TypeError);
    });

    it('should handle user with undefined userId', async () => {
      const userWithUndefinedId = { ...mockUser, userId: undefined };
      shopRepo.findOne.mockResolvedValue(mockShop);

      await expect(service.deleteShop('shop-1', userWithUndefinedId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle deleting the same shop multiple times', async () => {
      shopRepo.findOne.mockResolvedValue(mockShop);
      shopRepo.remove.mockResolvedValue(mockShop);

      const result1 = await service.deleteShop('shop-1', mockUser);
      const result2 = await service.deleteShop('shop-1', mockUser);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(shopRepo.remove).toHaveBeenCalledTimes(2);
    });
  });
});
