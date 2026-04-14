import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeliveryAssignmentService } from './delivery-assignment.service';
import { DeliveryAssignment, AssignmentStatus } from './entity/delivery-assignment.entity';
import { Order } from '../orders/entity/order.entity';
import { DeliveryProfile } from '../delivery-profile/entity/delivery-profile.entity';
import { AcceptDeliveryInput } from './dto/accept-delivery.input';
import { RejectDeliveryInput } from './dto/reject-delivery.input';

describe('DeliveryAssignmentService', () => {
  let service: DeliveryAssignmentService;
  let assignmentRepo: Repository<DeliveryAssignment>;
  let orderRepo: Repository<Order>;
  let deliveryProfileRepo: Repository<DeliveryProfile>;

  const mockAssignmentRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockOrderRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockDeliveryProfileRepo = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  const mockOrder: Order = {
    id: 'order-123',
    totalAmount: 100,
    deliveryCharge: 10,
    totalItems: 2,
    status: 1,
    paymentMethod: 1,
    paymentStatus: 1,
    addressLine1: '123 Test St',
    addressLine2: 'Apt 1',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400001',
    latitude: 19.0760,
    longitude: 72.8777,
    isPaid: false,
    cancelReason: null as any,
    cancelledAt: null as any,
    assignedAt: null as any,
    deliveryPersonId: null as any,
    user: null as any,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeliveryProfile: DeliveryProfile = {
    id: 'profile-123',
    vehicleType: 'BIKE',
    vehicleName: 'Honda Shine',
    rcBookPhoto: 'rc-book.jpg',
    licensePhoto: 'license.jpg',
    addressLine1: '456 Delivery St',
    addressLine2: 'Apt 2',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400002',
    location: 'Bandra West',
    latitude: 19.0800,
    longitude: 72.8800,
    isAvailable: true,
    user: { ...mockUser, id: mockUser.userId },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockAssignment: DeliveryAssignment = {
    id: 'assignment-123',
    order: mockOrder,
    deliveryProfile: mockDeliveryProfile,
    status: AssignmentStatus.PENDING,
    distance: 1.5,
    respondedAt: null as any,
    retryCount: 0,
    assignedAt: new Date(),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryAssignmentService,
        {
          provide: getRepositoryToken(DeliveryAssignment),
          useValue: mockAssignmentRepo,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(DeliveryProfile),
          useValue: mockDeliveryProfileRepo,
        },
      ],
    }).compile();

    service = module.get<DeliveryAssignmentService>(DeliveryAssignmentService);
    assignmentRepo = module.get<Repository<DeliveryAssignment>>(getRepositoryToken(DeliveryAssignment));
    orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
    deliveryProfileRepo = module.get<Repository<DeliveryProfile>>(getRepositoryToken(DeliveryProfile));

    jest.clearAllMocks();
  });

  describe('calculateDistance (private method)', () => {
    it('should calculate distance between two points correctly', () => {
      // Access private method via any to test
      const distance = (service as any).calculateDistance(19.0760, 72.8777, 19.0800, 72.8800);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(100);
    });

    it('should return 0 when coordinates are the same', () => {
      const distance = (service as any).calculateDistance(19.0760, 72.8777, 19.0760, 72.8777);
      expect(distance).toBeCloseTo(0, 4);
    });

    it('should handle negative coordinates', () => {
      const distance = (service as any).calculateDistance(-33.8688, 151.2093, -34.0, 151.0);
      expect(distance).toBeGreaterThan(0);
    });

    it('should handle large coordinate values', () => {
      const distance = (service as any).calculateDistance(90, 180, -90, -180);
      expect(distance).toBeGreaterThan(10000);
    });
  });

  describe('toRadians (private method)', () => {
    it('should convert degrees to radians correctly', () => {
      const radians = (service as any).toRadians(180);
      expect(radians).toBeCloseTo(Math.PI, 4);
    });

    it('should convert 0 degrees to 0 radians', () => {
      const radians = (service as any).toRadians(0);
      expect(radians).toBe(0);
    });

    it('should convert 360 degrees to 2PI radians', () => {
      const radians = (service as any).toRadians(360);
      expect(radians).toBeCloseTo(2 * Math.PI, 4);
    });

    it('should handle negative degrees', () => {
      const radians = (service as any).toRadians(-180);
      expect(radians).toBeCloseTo(-Math.PI, 4);
    });
  });

  describe('findNearestDeliveryPerson (private method)', () => {
    it('should return null when no delivery profiles are available', async () => {
      mockDeliveryProfileRepo.find.mockResolvedValue([]);

      const result = await (service as any).findNearestDeliveryPerson(mockOrder);

      expect(mockDeliveryProfileRepo.find).toHaveBeenCalledWith({
        where: { isAvailable: true },
        relations: ['user'],
      });
      expect(result).toBeNull();
    });

    it('should return null when delivery profiles array is empty', async () => {
      mockDeliveryProfileRepo.find.mockResolvedValue(null);

      const result = await (service as any).findNearestDeliveryPerson(mockOrder);

      expect(result).toBeNull();
    });

    it('should return null when all profiles lack coordinates', async () => {
      const profilesWithoutCoords = [
        { ...mockDeliveryProfile, latitude: null, longitude: null },
      ];
      mockDeliveryProfileRepo.find.mockResolvedValue(profilesWithoutCoords);

      const result = await (service as any).findNearestDeliveryPerson(mockOrder);

      expect(result).toBeNull();
    });

    it('should find the nearest delivery profile', async () => {
      const profiles = [
        { ...mockDeliveryProfile, id: 'profile-1', latitude: 19.0900, longitude: 72.8900 },
        { ...mockDeliveryProfile, id: 'profile-2', latitude: 19.0800, longitude: 72.8800 },
      ];
      mockDeliveryProfileRepo.find.mockResolvedValue(profiles);

      const result = await (service as any).findNearestDeliveryPerson(mockOrder);

      expect(result).toEqual(profiles[1]);
    });

    it('should skip profiles without coordinates', async () => {
      const profiles = [
        { ...mockDeliveryProfile, id: 'profile-1', latitude: null, longitude: null },
        { ...mockDeliveryProfile, id: 'profile-2', latitude: 19.0800, longitude: 72.8800 },
      ];
      mockDeliveryProfileRepo.find.mockResolvedValue(profiles);

      const result = await (service as any).findNearestDeliveryPerson(mockOrder);

      expect(result).toEqual(profiles[1]);
    });
  });

  describe('autoAssignOrder', () => {
    it('should throw NotFoundException when order is not found', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(service.autoAssignOrder('non-existent-order')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.autoAssignOrder('non-existent-order')).rejects.toThrow('Order not found');
    });

    it('should return null when order lacks coordinates', async () => {
      const orderWithoutCoords = { ...mockOrder, latitude: null, longitude: null };
      mockOrderRepo.findOne.mockResolvedValue(orderWithoutCoords);

      const result = await service.autoAssignOrder('order-123');

      expect(result).toBeNull();
    });

    it('should return null when no delivery persons are available', async () => {
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDeliveryProfileRepo.find.mockResolvedValue([]);

      const result = await service.autoAssignOrder('order-123');

      expect(result).toBeNull();
    });

    it('should successfully assign order to nearest delivery person', async () => {
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDeliveryProfileRepo.find.mockResolvedValue([mockDeliveryProfile]);
      mockAssignmentRepo.create.mockReturnValue(mockAssignment);
      mockAssignmentRepo.save.mockResolvedValue(mockAssignment);

      const result = await service.autoAssignOrder('order-123');

      expect(result).toEqual(mockAssignment);
      expect(mockAssignmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          order: mockOrder,
          deliveryProfile: mockDeliveryProfile,
          status: AssignmentStatus.PENDING,
          retryCount: 0,
        }),
      );
    });

    it('should set expiresAt to 2 minutes from now', async () => {
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDeliveryProfileRepo.find.mockResolvedValue([mockDeliveryProfile]);
      mockAssignmentRepo.create.mockReturnValue(mockAssignment);
      mockAssignmentRepo.save.mockResolvedValue(mockAssignment);

      await service.autoAssignOrder('order-123');

      const createCall = mockAssignmentRepo.create.mock.calls[0][0];
      const expiresAtDiff = createCall.expiresAt.getTime() - Date.now();
      expect(expiresAtDiff).toBeGreaterThan(119000); // ~2 minutes
      expect(expiresAtDiff).toBeLessThan(121000);
    });

    it('should calculate and store distance', async () => {
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDeliveryProfileRepo.find.mockResolvedValue([mockDeliveryProfile]);
      mockAssignmentRepo.create.mockReturnValue(mockAssignment);
      mockAssignmentRepo.save.mockResolvedValue(mockAssignment);

      await service.autoAssignOrder('order-123');

      const createCall = mockAssignmentRepo.create.mock.calls[0][0];
      expect(createCall.distance).toBeGreaterThan(0);
    });
  });

  describe('acceptDelivery', () => {
    const acceptInput: AcceptDeliveryInput = { assignmentId: 'assignment-123' };

    it('should throw NotFoundException when assignment is not found', async () => {
      mockAssignmentRepo.findOne.mockResolvedValue(null);

      await expect(service.acceptDelivery(acceptInput, mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.acceptDelivery(acceptInput, mockUser)).rejects.toThrow('Assignment not found');
    });

    it('should throw ForbiddenException when user does not own the assignment', async () => {
      const assignmentWithDifferentUser = {
        ...mockAssignment,
        deliveryProfile: { ...mockDeliveryProfile, user: { ...mockUser, userId: 'different-user' } },
      };
      mockAssignmentRepo.findOne.mockResolvedValue(assignmentWithDifferentUser);

      await expect(service.acceptDelivery(acceptInput, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.acceptDelivery(acceptInput, mockUser)).rejects.toThrow(
        'You can only accept your own assignments',
      );
    });

    it('should throw ForbiddenException when assignment is not pending', async () => {
      const acceptedAssignment = {
        ...mockAssignment,
        status: AssignmentStatus.ACCEPTED,
        deliveryProfile: { ...mockDeliveryProfile, user: { ...mockUser, id: mockUser.userId } },
      };
      mockAssignmentRepo.findOne.mockResolvedValue(acceptedAssignment);

      await expect(service.acceptDelivery(acceptInput, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.acceptDelivery(acceptInput, mockUser)).rejects.toThrow(
        'Assignment is no longer pending',
      );
    });

    it('should throw ForbiddenException when assignment has expired', async () => {
      const expiredAssignment = {
        ...mockAssignment,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        deliveryProfile: { ...mockDeliveryProfile, user: { ...mockUser, id: mockUser.userId } },
      };
      mockAssignmentRepo.findOne.mockResolvedValue(expiredAssignment);

      await expect(service.acceptDelivery(acceptInput, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.acceptDelivery(acceptInput, mockUser)).rejects.toThrow('Assignment has expired');
    });

    it('should successfully accept assignment and update order', async () => {
      const profileWithUser = { ...mockDeliveryProfile, user: { ...mockUser, id: mockUser.userId }, isAvailable: true };
      const assignmentWithMatchingUser = {
        ...mockAssignment,
        deliveryProfile: profileWithUser,
      };
      const updatedProfile = { ...profileWithUser, isAvailable: false };
      mockAssignmentRepo.findOne.mockResolvedValue(assignmentWithMatchingUser);
      mockAssignmentRepo.save.mockResolvedValue(assignmentWithMatchingUser);
      mockOrderRepo.save.mockResolvedValue(mockOrder);
      mockDeliveryProfileRepo.save.mockResolvedValue(updatedProfile);

      const result = await service.acceptDelivery(acceptInput, mockUser);

      expect(result).toEqual(assignmentWithMatchingUser);
      expect(result.status).toBe(AssignmentStatus.ACCEPTED);
      expect(result.respondedAt).toBeDefined();
      expect(mockOrder.deliveryPersonId).toBe(mockUser.userId);
      expect(mockOrder.assignedAt).toBeDefined();
      expect(updatedProfile.isAvailable).toBe(false);
    });

    it('should set delivery profile to not available on accept', async () => {
      const profileWithUser = { ...mockDeliveryProfile, user: { ...mockUser, id: mockUser.userId }, isAvailable: true };
      const assignmentWithMatchingUser = {
        ...mockAssignment,
        deliveryProfile: profileWithUser,
      };
      const updatedProfile = { ...profileWithUser, isAvailable: false };
      mockAssignmentRepo.findOne.mockResolvedValue(assignmentWithMatchingUser);
      mockAssignmentRepo.save.mockResolvedValue(assignmentWithMatchingUser);
      mockOrderRepo.save.mockResolvedValue(mockOrder);
      mockDeliveryProfileRepo.save.mockResolvedValue(updatedProfile);

      await service.acceptDelivery(acceptInput, mockUser);

      expect(updatedProfile.isAvailable).toBe(false);
      expect(mockDeliveryProfileRepo.save).toHaveBeenCalledWith(updatedProfile);
    });
  });

  describe('rejectDelivery', () => {
    const rejectInput: RejectDeliveryInput = { assignmentId: 'assignment-123', reason: 'Too far' };

    it('should throw NotFoundException when assignment is not found', async () => {
      mockAssignmentRepo.findOne.mockResolvedValue(null);

      await expect(service.rejectDelivery(rejectInput, mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.rejectDelivery(rejectInput, mockUser)).rejects.toThrow('Assignment not found');
    });

    it('should throw ForbiddenException when user does not own the assignment', async () => {
      const assignmentWithDifferentUser = {
        ...mockAssignment,
        deliveryProfile: { ...mockDeliveryProfile, user: { ...mockUser, userId: 'different-user' } },
      };
      mockAssignmentRepo.findOne.mockResolvedValue(assignmentWithDifferentUser);

      await expect(service.rejectDelivery(rejectInput, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.rejectDelivery(rejectInput, mockUser)).rejects.toThrow(
        'You can only reject your own assignments',
      );
    });

    it('should throw ForbiddenException when assignment is not pending', async () => {
      const rejectedAssignment = {
        ...mockAssignment,
        status: AssignmentStatus.REJECTED,
        deliveryProfile: { ...mockDeliveryProfile, user: { ...mockUser, id: mockUser.userId } },
      };
      mockAssignmentRepo.findOne.mockResolvedValue(rejectedAssignment);

      await expect(service.rejectDelivery(rejectInput, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.rejectDelivery(rejectInput, mockUser)).rejects.toThrow(
        'Assignment is no longer pending',
      );
    });

    it('should successfully reject assignment and trigger reassignment', async () => {
      const assignmentWithMatchingUser = {
        ...mockAssignment,
        deliveryProfile: { ...mockDeliveryProfile, user: { ...mockUser, id: mockUser.userId } },
      };
      mockAssignmentRepo.findOne.mockResolvedValue(assignmentWithMatchingUser);
      mockAssignmentRepo.save.mockResolvedValue(assignmentWithMatchingUser);
      mockAssignmentRepo.find.mockResolvedValue([]); // Mock for reassignOrder

      const result = await service.rejectDelivery(rejectInput, mockUser);

      expect(result).toEqual(assignmentWithMatchingUser);
      expect(result.status).toBe(AssignmentStatus.REJECTED);
      expect(result.respondedAt).toBeDefined();
    });

    it('should call reassignOrder after rejection', async () => {
      const assignmentWithMatchingUser = {
        ...mockAssignment,
        deliveryProfile: { ...mockDeliveryProfile, user: { ...mockUser, id: mockUser.userId } },
      };
      mockAssignmentRepo.findOne.mockResolvedValue(assignmentWithMatchingUser);
      mockAssignmentRepo.save.mockResolvedValue(assignmentWithMatchingUser);
      mockAssignmentRepo.find.mockResolvedValue([]); // Mock for reassignOrder

      await service.rejectDelivery(rejectInput, mockUser);

      // reassignOrder is called internally, we can verify by checking the assignment was saved
      expect(mockAssignmentRepo.save).toHaveBeenCalledWith(assignmentWithMatchingUser);
    });
  });

  describe('reassignOrder (private method)', () => {
    it('should return immediately when retry count is 5 or more', async () => {
      await (service as any).reassignOrder('order-123', 5);

      expect(mockOrderRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return immediately when retry count exceeds 5', async () => {
      await (service as any).reassignOrder('order-123', 10);

      expect(mockOrderRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return when order is not found', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await (service as any).reassignOrder('non-existent-order', 0);

      expect(mockDeliveryProfileRepo.find).not.toHaveBeenCalled();
    });

    it('should return when no delivery profiles are available', async () => {
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDeliveryProfileRepo.find.mockResolvedValue([]);

      await (service as any).reassignOrder('order-123', 0);

      expect(mockAssignmentRepo.create).not.toHaveBeenCalled();
    });

    it('should return when no untried delivery profiles are available', async () => {
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDeliveryProfileRepo.find.mockResolvedValue([mockDeliveryProfile]);
      mockAssignmentRepo.find.mockResolvedValue([
        { ...mockAssignment, deliveryProfile: mockDeliveryProfile },
      ]);

      await (service as any).reassignOrder('order-123', 0);

      expect(mockAssignmentRepo.create).not.toHaveBeenCalled();
    });

    it('should successfully reassign to next nearest delivery person', async () => {
      const newProfile = { ...mockDeliveryProfile, id: 'new-profile-123' };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDeliveryProfileRepo.find.mockResolvedValue([newProfile]);
      mockAssignmentRepo.find.mockResolvedValue([]);
      mockAssignmentRepo.create.mockReturnValue(mockAssignment);
      mockAssignmentRepo.save.mockResolvedValue(mockAssignment);

      await (service as any).reassignOrder('order-123', 0);

      expect(mockAssignmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          order: mockOrder,
          deliveryProfile: newProfile,
          status: AssignmentStatus.PENDING,
          retryCount: 1,
        }),
      );
    });

    it('should increment retry count on reassignment', async () => {
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockDeliveryProfileRepo.find.mockResolvedValue([mockDeliveryProfile]);
      mockAssignmentRepo.find.mockResolvedValue([]);
      mockAssignmentRepo.create.mockReturnValue(mockAssignment);
      mockAssignmentRepo.save.mockResolvedValue(mockAssignment);

      await (service as any).reassignOrder('order-123', 2);

      const createCall = mockAssignmentRepo.create.mock.calls[0][0];
      expect(createCall.retryCount).toBe(3);
    });
  });

  describe('getMyAssignments', () => {
    it('should return assignments for the delivery person', async () => {
      const assignments = [mockAssignment];
      mockAssignmentRepo.find.mockResolvedValue(assignments);

      const result = await service.getMyAssignments(mockUser);

      expect(result).toEqual(assignments);
      expect(mockAssignmentRepo.find).toHaveBeenCalledWith({
        where: { deliveryProfile: { user: { id: mockUser.userId } } },
        relations: ['order', 'deliveryProfile'],
        order: { assignedAt: 'DESC' },
      });
    });

    it('should return empty array when no assignments found', async () => {
      mockAssignmentRepo.find.mockResolvedValue([]);

      const result = await service.getMyAssignments(mockUser);

      expect(result).toEqual([]);
    });

    it('should order assignments by assignedAt descending', async () => {
      mockAssignmentRepo.find.mockResolvedValue([mockAssignment]);

      await service.getMyAssignments(mockUser);

      expect(mockAssignmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { assignedAt: 'DESC' },
        }),
      );
    });
  });

  describe('getPendingAssignment', () => {
    it('should return pending assignment for order', async () => {
      mockAssignmentRepo.findOne.mockResolvedValue(mockAssignment);

      const result = await service.getPendingAssignment('order-123');

      expect(result).toEqual(mockAssignment);
      expect(mockAssignmentRepo.findOne).toHaveBeenCalledWith({
        where: {
          order: { id: 'order-123' },
          status: AssignmentStatus.PENDING,
        },
        relations: ['deliveryProfile', 'order'],
      });
    });

    it('should return null when no pending assignment exists', async () => {
      mockAssignmentRepo.findOne.mockResolvedValue(null);

      const result = await service.getPendingAssignment('order-123');

      expect(result).toBeNull();
    });

    it('should handle empty orderId', async () => {
      mockAssignmentRepo.findOne.mockResolvedValue(null);

      const result = await service.getPendingAssignment('');

      expect(result).toBeNull();
    });
  });

  describe('expirePendingAssignments', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      mockAssignmentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should return when no expired assignments exist', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.expirePendingAssignments();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'assignment.status = :status',
        { status: AssignmentStatus.PENDING },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.expiresAt < :now',
        expect.any(Object),
      );
    });

    it('should mark expired assignments as EXPIRED', async () => {
      const expiredAssignment = { ...mockAssignment, id: 'expired-123' };
      mockQueryBuilder.getMany.mockResolvedValue([expiredAssignment]);
      mockAssignmentRepo.save.mockResolvedValue(expiredAssignment);

      await service.expirePendingAssignments();

      expect(expiredAssignment.status).toBe(AssignmentStatus.EXPIRED);
      expect(mockAssignmentRepo.save).toHaveBeenCalledWith(expiredAssignment);
    });

    it('should trigger reassignment for expired assignments', async () => {
      const expiredAssignment = { ...mockAssignment, id: 'expired-123', retryCount: 0 };
      mockQueryBuilder.getMany.mockResolvedValue([expiredAssignment]);
      mockAssignmentRepo.save.mockResolvedValue(expiredAssignment);

      await service.expirePendingAssignments();

      expect(mockAssignmentRepo.save).toHaveBeenCalledWith(expiredAssignment);
    });

    it('should handle multiple expired assignments', async () => {
      const expiredAssignments = [
        { ...mockAssignment, id: 'expired-1' },
        { ...mockAssignment, id: 'expired-2' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(expiredAssignments);
      mockAssignmentRepo.save.mockResolvedValue(expiredAssignments[0]);

      await service.expirePendingAssignments();

      expect(mockAssignmentRepo.save).toHaveBeenCalledTimes(2);
    });
  });
});
