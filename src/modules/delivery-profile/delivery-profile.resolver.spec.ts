import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryProfileResolver } from './delivery-profile.resolver';
import { DeliveryProfileService } from './delivery-profile.service';
import { DeliveryProfile } from './entity/delivery-profile.entity';
import { CreateDeliveryProfileInput } from './dto/create-delivery-profile.input';
import { UpdateDeliveryProfileInput } from './dto/update-delivery-profile.input';

describe('DeliveryProfileResolver', () => {
  let resolver: DeliveryProfileResolver;
  let service: DeliveryProfileService;

  const mockDeliveryProfileService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
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

  const mockContext = {
    req: {
      user: mockUser,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryProfileResolver,
        {
          provide: DeliveryProfileService,
          useValue: mockDeliveryProfileService,
        },
      ],
    }).compile();

    resolver = module.get<DeliveryProfileResolver>(DeliveryProfileResolver);
    service = module.get<DeliveryProfileService>(DeliveryProfileService);

    jest.clearAllMocks();
  });

  describe('createDeliveryProfile mutation', () => {
    it('should call service create with correct parameters', async () => {
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(createProfileInput, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(
        createProfileInput,
        mockUser,
      );
      expect(result).toEqual(mockDeliveryProfile);
    });

    it('should return the created profile', async () => {
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(createProfileInput, mockContext);

      expect(result).toEqual(mockDeliveryProfile);
      expect(result?.id).toBe('profile-123');
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      mockDeliveryProfileService.create.mockRejectedValue(error);

      await expect(
        resolver.createDeliveryProfile(createProfileInput, mockContext),
      ).rejects.toThrow('Service error');
    });

    it('should handle missing required fields in input', async () => {
      const incompleteInput = {
        vehicleType: 'BIKE',
      } as CreateDeliveryProfileInput;
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(incompleteInput, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(
        incompleteInput,
        mockUser,
      );
    });

    it('should handle empty input', async () => {
      const emptyInput = {} as CreateDeliveryProfileInput;
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(emptyInput, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(emptyInput, mockUser);
    });

    it('should handle null input', async () => {
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(null as any, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(null, mockUser);
    });

    it('should handle undefined input', async () => {
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(undefined as any, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(undefined, mockUser);
    });


    it('should handle very long string values in input', async () => {
      const longInput = {
        ...createProfileInput,
        vehicleName: 'a'.repeat(1000),
        addressLine1: 'b'.repeat(1000),
      };
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(longInput, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(longInput, mockUser);
    });

    it('should handle special characters in input', async () => {
      const specialInput = {
        ...createProfileInput,
        vehicleName: 'Honda!@#$%^&*()',
        city: 'Mumbai<>?/"',
      };
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(specialInput, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(specialInput, mockUser);
    });

    it('should handle negative coordinates', async () => {
      const negativeCoordsInput = {
        ...createProfileInput,
        latitude: -33.8688,
        longitude: -151.2093,
      };
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(negativeCoordsInput, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(negativeCoordsInput, mockUser);
    });

    it('should handle zero coordinates', async () => {
      const zeroCoordsInput = {
        ...createProfileInput,
        latitude: 0,
        longitude: 0,
      };
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(zeroCoordsInput, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(zeroCoordsInput, mockUser);
    });

    it('should handle very large coordinates', async () => {
      const largeCoordsInput = {
        ...createProfileInput,
        latitude: 90,
        longitude: 180,
      };
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(largeCoordsInput, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(largeCoordsInput, mockUser);
    });

    it('should handle invalid vehicleType', async () => {
      const invalidVehicleInput = {
        ...createProfileInput,
        vehicleType: 'INVALID_TYPE' as any,
      };
      mockDeliveryProfileService.create.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.createDeliveryProfile(invalidVehicleInput, mockContext);

      expect(mockDeliveryProfileService.create).toHaveBeenCalledWith(invalidVehicleInput, mockUser);
    });
  });

  describe('getDeliveryProfiles query', () => {
    it('should call service findAll with correct parameters', async () => {
      const profiles = [mockDeliveryProfile];
      mockDeliveryProfileService.findAll.mockResolvedValue(profiles);

      const result = await resolver.getDeliveryProfiles(mockContext);

      expect(mockDeliveryProfileService.findAll).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(profiles);
    });

    it('should return empty array when no profiles found', async () => {
      mockDeliveryProfileService.findAll.mockResolvedValue([]);

      const result = await resolver.getDeliveryProfiles(mockContext);

      expect(result).toEqual([]);
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      mockDeliveryProfileService.findAll.mockRejectedValue(error);

      await expect(resolver.getDeliveryProfiles(mockContext)).rejects.toThrow('Service error');
    });


    it('should return array of profiles', async () => {
      const profiles = [
        mockDeliveryProfile,
        { ...mockDeliveryProfile, id: 'profile-456' },
      ];
      mockDeliveryProfileService.findAll.mockResolvedValue(profiles);

      const result = await resolver.getDeliveryProfiles(mockContext);

      expect(result).toEqual(profiles);
      expect(result.length).toBe(2);
    });
  });

  describe('getDeliveryProfile query', () => {
    it('should call service findOne with correct parameters', async () => {
      mockDeliveryProfileService.findOne.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.getDeliveryProfile('profile-123', mockContext);

      expect(mockDeliveryProfileService.findOne).toHaveBeenCalledWith('profile-123', mockUser);
      expect(result).toEqual(mockDeliveryProfile);
    });

    it('should return null when profile is not found', async () => {
      mockDeliveryProfileService.findOne.mockResolvedValue(null);

      const result = await resolver.getDeliveryProfile('non-existent-id', mockContext);

      expect(result).toBeNull();
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      mockDeliveryProfileService.findOne.mockRejectedValue(error);

      await expect(resolver.getDeliveryProfile('profile-123', mockContext)).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle empty id', async () => {
      mockDeliveryProfileService.findOne.mockResolvedValue(null);

      const result = await resolver.getDeliveryProfile('', mockContext);

      expect(mockDeliveryProfileService.findOne).toHaveBeenCalledWith('', mockUser);
    });

    it('should handle null id', async () => {
      mockDeliveryProfileService.findOne.mockResolvedValue(null);

      const result = await resolver.getDeliveryProfile(null as any, mockContext);

      expect(mockDeliveryProfileService.findOne).toHaveBeenCalledWith(null, mockUser);
    });

    it('should handle undefined id', async () => {
      mockDeliveryProfileService.findOne.mockResolvedValue(null);

      const result = await resolver.getDeliveryProfile(undefined as any, mockContext);

      expect(mockDeliveryProfileService.findOne).toHaveBeenCalledWith(undefined, mockUser);
    });

    it('should handle very long id', async () => {
      const longId = 'a'.repeat(1000);
      mockDeliveryProfileService.findOne.mockResolvedValue(null);

      const result = await resolver.getDeliveryProfile(longId, mockContext);

      expect(mockDeliveryProfileService.findOne).toHaveBeenCalledWith(longId, mockUser);
    });

    it('should handle special characters in id', async () => {
      const specialId = 'profile-123!@#$%^&*()';
      mockDeliveryProfileService.findOne.mockResolvedValue(null);

      const result = await resolver.getDeliveryProfile(specialId, mockContext);

      expect(mockDeliveryProfileService.findOne).toHaveBeenCalledWith(specialId, mockUser);
    });

  });

  describe('updateDeliveryProfile mutation', () => {
    it('should call service update with correct parameters', async () => {
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(updateProfileInput, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(updateProfileInput, mockUser);
      expect(result).toEqual(mockDeliveryProfile);
    });

    it('should return the updated profile', async () => {
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(updateProfileInput, mockContext);

      expect(result).toEqual(mockDeliveryProfile);
      expect(result.id).toBe('profile-123');
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      mockDeliveryProfileService.update.mockRejectedValue(error);

      await expect(
        resolver.updateDeliveryProfile(updateProfileInput, mockContext),
      ).rejects.toThrow('Service error');
    });

    it('should handle missing id in input', async () => {
      const updateWithoutId = { vehicleType: 'SCOOTER' } as UpdateDeliveryProfileInput;
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(updateWithoutId, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(updateWithoutId, mockUser);
    });

    it('should handle empty input', async () => {
      const emptyUpdate = { id: 'profile-123' } as UpdateDeliveryProfileInput;
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(emptyUpdate, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(emptyUpdate, mockUser);
    });

    it('should handle null input', async () => {
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(null as any, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(null, mockUser);
    });

    it('should handle undefined input', async () => {
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(undefined as any, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(undefined, mockUser);
    });

    it('should handle null id', async () => {
      const updateWithNullId = { id: null, vehicleType: 'SCOOTER' } as any;
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(updateWithNullId, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(updateWithNullId, mockUser);
    });


    it('should handle partial updates', async () => {
      const partialUpdate = { id: 'profile-123', isAvailable: false } as UpdateDeliveryProfileInput;
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(partialUpdate, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(partialUpdate, mockUser);
    });

    it('should handle very long string values in input', async () => {
      const longUpdate = {
        ...updateProfileInput,
        vehicleName: 'a'.repeat(1000),
        addressLine1: 'b'.repeat(1000),
      };
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(longUpdate, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(longUpdate, mockUser);
    });

    it('should handle special characters in input', async () => {
      const specialUpdate = {
        ...updateProfileInput,
        vehicleName: 'Honda!@#$%^&*()',
        city: 'Mumbai<>?/"',
      };
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(specialUpdate, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(specialUpdate, mockUser);
    });

    it('should handle negative coordinates', async () => {
      const negativeCoordsUpdate = {
        ...updateProfileInput,
        latitude: -33.8688,
        longitude: -151.2093,
      };
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(negativeCoordsUpdate, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(negativeCoordsUpdate, mockUser);
    });

    it('should handle boolean isAvailable field', async () => {
      const booleanUpdate = {
        ...updateProfileInput,
        isAvailable: true,
      };
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(booleanUpdate, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(booleanUpdate, mockUser);
    });

    it('should handle false isAvailable', async () => {
      const falseUpdate = {
        ...updateProfileInput,
        isAvailable: false,
      };
      mockDeliveryProfileService.update.mockResolvedValue(mockDeliveryProfile);

      const result = await resolver.updateDeliveryProfile(falseUpdate, mockContext);

      expect(mockDeliveryProfileService.update).toHaveBeenCalledWith(falseUpdate, mockUser);
    });
  });
});
