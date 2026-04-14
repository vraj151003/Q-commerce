import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeliveryProfileService } from './delivery-profile.service';
import { DeliveryProfile } from './entity/delivery-profile.entity';
import { CreateDeliveryProfileInput } from './dto/create-delivery-profile.input';
import { UpdateDeliveryProfileInput } from './dto/update-delivery-profile.input';

describe('DeliveryProfileService', () => {
  let service: DeliveryProfileService;
  let deliveryProfileRepo: Repository<DeliveryProfile>;

  const mockDeliveryProfileRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockDeliveryProfile: DeliveryProfile = {
    id: 'profile-123',
    vehicleType: 'BIKE',
    vehicleName: 'Honda Shine',
    rcBookPhoto: 'rc-book.jpg',
    licensePhoto: 'license.jpg',
    addressLine1: '123 Test St',
    addressLine2: 'Apt 1',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    location: 'Bandra West',
    latitude: 19.0760,
    longitude: 72.8777,
    isAvailable: true,
    user: mockUser as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const createProfileInput: CreateDeliveryProfileInput = {
    vehicleType: 'BIKE',
    vehicleName: 'Honda Shine',
    rcBookPhoto: 'rc-book.jpg',
    licensePhoto: 'license.jpg',
    addressLine1: '123 Test St',
    addressLine2: 'Apt 1',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    latitude: 19.0760,
    longitude: 72.8777,
  };

  const updateProfileInput: UpdateDeliveryProfileInput = {
    id: 'profile-123',
    vehicleType: 'SCOOTER',
    vehicleName: 'Honda Activa',
    isAvailable: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryProfileService,
        {
          provide: getRepositoryToken(DeliveryProfile),
          useValue: mockDeliveryProfileRepo,
        },
      ],
    }).compile();

    service = module.get<DeliveryProfileService>(DeliveryProfileService);
    deliveryProfileRepo = module.get<Repository<DeliveryProfile>>(getRepositoryToken(DeliveryProfile));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new delivery profile', async () => {
      mockDeliveryProfileRepo.create.mockReturnValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.save.mockResolvedValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.findOne.mockResolvedValue(mockDeliveryProfile);

      const result = await service.create(createProfileInput, mockUser);

      expect(result).toEqual(mockDeliveryProfile);
      expect(mockDeliveryProfileRepo.create).toHaveBeenCalledWith({
        ...createProfileInput,
        user: { id: mockUser.userId },
      });
      expect(mockDeliveryProfileRepo.save).toHaveBeenCalled();
    });

    it('should load user relation after creating profile', async () => {
      mockDeliveryProfileRepo.create.mockReturnValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.save.mockResolvedValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.findOne.mockResolvedValue(mockDeliveryProfile);

      await service.create(createProfileInput, mockUser);

      expect(mockDeliveryProfileRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockDeliveryProfile.id },
        relations: ['user'],
      });
    });

    it('should handle missing userId in user object', async () => {
      const userWithoutId = { ...mockUser, userId: undefined };
      mockDeliveryProfileRepo.create.mockReturnValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.save.mockResolvedValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.findOne.mockResolvedValue(mockDeliveryProfile);

      await service.create(createProfileInput, userWithoutId as any);

      expect(mockDeliveryProfileRepo.create).toHaveBeenCalledWith({
        ...createProfileInput,
        user: { id: undefined },
      });
    });

    it('should handle null userId', async () => {
      const userWithNullId = { ...mockUser, userId: null };
      mockDeliveryProfileRepo.create.mockReturnValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.save.mockResolvedValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.findOne.mockResolvedValue(mockDeliveryProfile);

      await service.create(createProfileInput, userWithNullId as any);

      expect(mockDeliveryProfileRepo.create).toHaveBeenCalledWith({
        ...createProfileInput,
        user: { id: null },
      });
    });

    it('should handle empty input', async () => {
      const emptyInput = {} as CreateDeliveryProfileInput;
      mockDeliveryProfileRepo.create.mockReturnValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.save.mockResolvedValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.findOne.mockResolvedValue(mockDeliveryProfile);

      await service.create(emptyInput, mockUser);

      expect(mockDeliveryProfileRepo.create).toHaveBeenCalledWith({
        ...emptyInput,
        user: { id: mockUser.userId },
      });
    });

    it('should handle save errors gracefully', async () => {
      mockDeliveryProfileRepo.create.mockReturnValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createProfileInput, mockUser)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle findOne errors gracefully', async () => {
      mockDeliveryProfileRepo.create.mockReturnValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.save.mockResolvedValue(mockDeliveryProfile);
      mockDeliveryProfileRepo.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createProfileInput, mockUser)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAll', () => {
    it('should return all delivery profiles for the user', async () => {
      const profiles = [mockDeliveryProfile];
      mockDeliveryProfileRepo.find.mockResolvedValue(profiles);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(profiles);
      expect(mockDeliveryProfileRepo.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.userId } },
        relations: ['user'],
      });
    });

    it('should return empty array when no profiles found', async () => {
      mockDeliveryProfileRepo.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([]);
    });

    it('should load user relation in results', async () => {
      mockDeliveryProfileRepo.find.mockResolvedValue([mockDeliveryProfile]);

      await service.findAll(mockUser);

      expect(mockDeliveryProfileRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['user'],
        }),
      );
    });

    it('should handle missing userId in user object', async () => {
      const userWithoutId = { ...mockUser, userId: undefined };
      mockDeliveryProfileRepo.find.mockResolvedValue([]);

      await service.findAll(userWithoutId as any);

      expect(mockDeliveryProfileRepo.find).toHaveBeenCalledWith({
        where: { user: { id: undefined } },
        relations: ['user'],
      });
    });

    it('should handle null userId', async () => {
      const userWithNullId = { ...mockUser, userId: null };
      mockDeliveryProfileRepo.find.mockResolvedValue([]);

      await service.findAll(userWithNullId as any);

      expect(mockDeliveryProfileRepo.find).toHaveBeenCalledWith({
        where: { user: { id: null } },
        relations: ['user'],
      });
    });

    it('should handle database errors gracefully', async () => {
      mockDeliveryProfileRepo.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll(mockUser)).rejects.toThrow('Database error');
    });

    it('should return array of profiles', async () => {
      const profiles = [
        mockDeliveryProfile,
        { ...mockDeliveryProfile, id: 'profile-456' },
      ];
      mockDeliveryProfileRepo.find.mockResolvedValue(profiles);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(profiles);
      expect(result.length).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a single delivery profile by id', async () => {
      const profileWithMatchingUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, id: mockUser.userId },
      };
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithMatchingUser);

      const result = await service.findOne('profile-123', mockUser);

      expect(result).toEqual(profileWithMatchingUser);
      expect(mockDeliveryProfileRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'profile-123' },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException when profile is not found', async () => {
      mockDeliveryProfileRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id', mockUser)).rejects.toThrow(
        'Profile not found',
      );
    });

    it('should throw ForbiddenException when user does not own the profile', async () => {
      const profileWithDifferentUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, userId: 'different-user' },
      };
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithDifferentUser);

      await expect(service.findOne('profile-123', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne('profile-123', mockUser)).rejects.toThrow('Access denied');
    });

    it('should load user relation', async () => {
      const profileWithMatchingUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, id: mockUser.userId },
      };
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithMatchingUser);

      await service.findOne('profile-123', mockUser);

      expect(mockDeliveryProfileRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['user'],
        }),
      );
    });

    it('should handle empty id', async () => {
      mockDeliveryProfileRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle null id', async () => {
      mockDeliveryProfileRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(null as any, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle undefined id', async () => {
      mockDeliveryProfileRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(undefined as any, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors gracefully', async () => {
      mockDeliveryProfileRepo.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.findOne('profile-123', mockUser)).rejects.toThrow('Database error');
    });

    it('should allow access when user owns the profile', async () => {
      const profileWithMatchingUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, id: mockUser.userId },
      };
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithMatchingUser);

      const result = await service.findOne('profile-123', mockUser);

      expect(result).toEqual(profileWithMatchingUser);
    });
  });

  describe('update', () => {
    it('should update an existing delivery profile', async () => {
      const profileWithMatchingUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, id: mockUser.userId },
      };
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithMatchingUser);
      mockDeliveryProfileRepo.save.mockResolvedValue(profileWithMatchingUser);

      const result = await service.update(updateProfileInput, mockUser);

      expect(result).toEqual(profileWithMatchingUser);
      expect(mockDeliveryProfileRepo.save).toHaveBeenCalledWith(profileWithMatchingUser);
    });

    it('should call findOne to verify ownership', async () => {
      const profileWithMatchingUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, id: mockUser.userId },
      };
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithMatchingUser);
      mockDeliveryProfileRepo.save.mockResolvedValue(profileWithMatchingUser);

      await service.update(updateProfileInput, mockUser);

      expect(mockDeliveryProfileRepo.findOne).toHaveBeenCalledWith({
        where: { id: updateProfileInput.id },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException when profile is not found during update', async () => {
      mockDeliveryProfileRepo.findOne.mockResolvedValue(null);

      await expect(service.update(updateProfileInput, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not own the profile during update', async () => {
      const profileWithDifferentUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, userId: 'different-user' },
      };
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithDifferentUser);

      await expect(service.update(updateProfileInput, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle partial updates', async () => {
      const profileWithMatchingUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, id: mockUser.userId },
      };
      const partialUpdate = { id: 'profile-123', isAvailable: false } as UpdateDeliveryProfileInput;
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithMatchingUser);
      mockDeliveryProfileRepo.save.mockResolvedValue(profileWithMatchingUser);

      await service.update(partialUpdate, mockUser);

      expect(mockDeliveryProfileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: false,
        }),
      );
    });

    it('should handle empty update input', async () => {
      const profileWithMatchingUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, id: mockUser.userId },
      };
      const emptyUpdate = { id: 'profile-123' } as UpdateDeliveryProfileInput;
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithMatchingUser);
      mockDeliveryProfileRepo.save.mockResolvedValue(profileWithMatchingUser);

      await service.update(emptyUpdate, mockUser);

      expect(mockDeliveryProfileRepo.save).toHaveBeenCalledWith(profileWithMatchingUser);
    });

    it('should handle missing id in update input', async () => {
      const updateWithoutId = { vehicleType: 'SCOOTER' } as UpdateDeliveryProfileInput;
      mockDeliveryProfileRepo.findOne.mockResolvedValue(null);

      await expect(service.update(updateWithoutId as any, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle null id', async () => {
      const updateWithNullId = { id: null, vehicleType: 'SCOOTER' } as any;
      mockDeliveryProfileRepo.findOne.mockResolvedValue(null);

      await expect(service.update(updateWithNullId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });


    it('should handle save errors gracefully', async () => {
      const profileWithMatchingUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, id: mockUser.userId },
      };
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithMatchingUser);
      mockDeliveryProfileRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.update(updateProfileInput, mockUser)).rejects.toThrow('Database error');
    });

    it('should update all provided fields', async () => {
      const profileWithMatchingUser = {
        ...mockDeliveryProfile,
        user: { ...mockUser, id: mockUser.userId },
      };
      const fullUpdate: UpdateDeliveryProfileInput = {
        id: 'profile-123',
        vehicleType: 'SCOOTER',
        vehicleName: 'Honda Activa',
        rcBookPhoto: 'new-rc.jpg',
        licensePhoto: 'new-license.jpg',
        addressLine1: '456 New St',
        addressLine2: 'Apt 2',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        latitude: 28.6139,
        longitude: 77.2090,
        isAvailable: false,
      };
      mockDeliveryProfileRepo.findOne.mockResolvedValue(profileWithMatchingUser);
      mockDeliveryProfileRepo.save.mockResolvedValue(profileWithMatchingUser);

      await service.update(fullUpdate, mockUser);

      expect(mockDeliveryProfileRepo.save).toHaveBeenCalledWith(profileWithMatchingUser);
    });
  });
});
