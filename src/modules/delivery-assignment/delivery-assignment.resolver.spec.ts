import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryAssignmentResolver } from './delivery-assignment.resolver';
import { DeliveryAssignmentService } from './delivery-assignment.service';
import { DeliveryAssignment, AssignmentStatus } from './entity/delivery-assignment.entity';
import { AcceptDeliveryInput } from './dto/accept-delivery.input';
import { RejectDeliveryInput } from './dto/reject-delivery.input';

describe('DeliveryAssignmentResolver', () => {
  let resolver: DeliveryAssignmentResolver;
  let service: DeliveryAssignmentService;

  const mockDeliveryAssignmentService = {
    acceptDelivery: jest.fn(),
    rejectDelivery: jest.fn(),
    getMyAssignments: jest.fn(),
    getPendingAssignment: jest.fn(),
  };

  const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  const mockAssignment: DeliveryAssignment = {
    id: 'assignment-123',
    order: null as any,
    deliveryProfile: null as any,
    status: AssignmentStatus.PENDING,
    distance: 1.5,
    respondedAt: null as any,
    retryCount: 0,
    assignedAt: new Date(),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockContext = {
    req: {
      user: mockUser,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryAssignmentResolver,
        {
          provide: DeliveryAssignmentService,
          useValue: mockDeliveryAssignmentService,
        },
      ],
    }).compile();

    resolver = module.get<DeliveryAssignmentResolver>(DeliveryAssignmentResolver);
    service = module.get<DeliveryAssignmentService>(DeliveryAssignmentService);

    jest.clearAllMocks();
  });

  describe('acceptDelivery mutation', () => {
    const acceptInput: AcceptDeliveryInput = { assignmentId: 'assignment-123' };

    it('should call service acceptDelivery with correct parameters', async () => {
      mockDeliveryAssignmentService.acceptDelivery.mockResolvedValue(mockAssignment);

      const result = await resolver.acceptDelivery(acceptInput, mockContext);

      expect(mockDeliveryAssignmentService.acceptDelivery).toHaveBeenCalledWith(
        acceptInput,
        mockUser,
      );
      expect(result).toEqual(mockAssignment);
    });

    it('should return the accepted assignment', async () => {
      mockDeliveryAssignmentService.acceptDelivery.mockResolvedValue(mockAssignment);

      const result = await resolver.acceptDelivery(acceptInput, mockContext);

      expect(result).toEqual(mockAssignment);
      expect(result.id).toBe('assignment-123');
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      mockDeliveryAssignmentService.acceptDelivery.mockRejectedValue(error);

      await expect(resolver.acceptDelivery(acceptInput, mockContext)).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle missing assignmentId in input', async () => {
      const invalidInput = { assignmentId: '' } as AcceptDeliveryInput;
      mockDeliveryAssignmentService.acceptDelivery.mockResolvedValue(null);

      const result = await resolver.acceptDelivery(invalidInput, mockContext);

      expect(mockDeliveryAssignmentService.acceptDelivery).toHaveBeenCalledWith(
        invalidInput,
        mockUser,
      );
    });

    it('should handle null assignmentId', async () => {
      const invalidInput = { assignmentId: null as any } as AcceptDeliveryInput;
      mockDeliveryAssignmentService.acceptDelivery.mockResolvedValue(null);

      const result = await resolver.acceptDelivery(invalidInput, mockContext);

      expect(mockDeliveryAssignmentService.acceptDelivery).toHaveBeenCalledWith(
        invalidInput,
        mockUser,
      );
    });

  });

  describe('rejectDelivery mutation', () => {
    const rejectInput: RejectDeliveryInput = {
      assignmentId: 'assignment-123',
      reason: 'Too far',
    };

    it('should call service rejectDelivery with correct parameters', async () => {
      mockDeliveryAssignmentService.rejectDelivery.mockResolvedValue(mockAssignment);

      const result = await resolver.rejectDelivery(rejectInput, mockContext);

      expect(mockDeliveryAssignmentService.rejectDelivery).toHaveBeenCalledWith(
        rejectInput,
        mockUser,
      );
      expect(result).toEqual(mockAssignment);
    });

    it('should return the rejected assignment', async () => {
      mockDeliveryAssignmentService.rejectDelivery.mockResolvedValue(mockAssignment);

      const result = await resolver.rejectDelivery(rejectInput, mockContext);

      expect(result).toEqual(mockAssignment);
      expect(result.id).toBe('assignment-123');
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      mockDeliveryAssignmentService.rejectDelivery.mockRejectedValue(error);

      await expect(resolver.rejectDelivery(rejectInput, mockContext)).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle missing assignmentId in input', async () => {
      const invalidInput = { assignmentId: '', reason: 'Test' } as RejectDeliveryInput;
      mockDeliveryAssignmentService.rejectDelivery.mockResolvedValue(null);

      const result = await resolver.rejectDelivery(invalidInput, mockContext);

      expect(mockDeliveryAssignmentService.rejectDelivery).toHaveBeenCalledWith(
        invalidInput,
        mockUser,
      );
    });

    it('should handle null assignmentId', async () => {
      const invalidInput = { assignmentId: null as any, reason: 'Test' } as RejectDeliveryInput;
      mockDeliveryAssignmentService.rejectDelivery.mockResolvedValue(null);

      const result = await resolver.rejectDelivery(invalidInput, mockContext);

      expect(mockDeliveryAssignmentService.rejectDelivery).toHaveBeenCalledWith(
        invalidInput,
        mockUser,
      );
    });

    it('should handle missing reason in input', async () => {
      const inputWithoutReason = { assignmentId: 'assignment-123' } as RejectDeliveryInput;
      mockDeliveryAssignmentService.rejectDelivery.mockResolvedValue(mockAssignment);

      const result = await resolver.rejectDelivery(inputWithoutReason, mockContext);

      expect(mockDeliveryAssignmentService.rejectDelivery).toHaveBeenCalledWith(
        inputWithoutReason,
        mockUser,
      );
    });

    it('should handle empty reason', async () => {
      const inputWithEmptyReason = {
        assignmentId: 'assignment-123',
        reason: '',
      } as RejectDeliveryInput;
      mockDeliveryAssignmentService.rejectDelivery.mockResolvedValue(mockAssignment);

      const result = await resolver.rejectDelivery(inputWithEmptyReason, mockContext);

      expect(mockDeliveryAssignmentService.rejectDelivery).toHaveBeenCalledWith(
        inputWithEmptyReason,
        mockUser,
      );
    });

    it('should handle null reason', async () => {
      const inputWithNullReason = {
        assignmentId: 'assignment-123',
        reason: null as any,
      } as RejectDeliveryInput;
      mockDeliveryAssignmentService.rejectDelivery.mockResolvedValue(mockAssignment);

      const result = await resolver.rejectDelivery(inputWithNullReason, mockContext);

      expect(mockDeliveryAssignmentService.rejectDelivery).toHaveBeenCalledWith(
        inputWithNullReason,
        mockUser,
      );
    });

  });

  describe('getMyAssignments query', () => {
    it('should call service getMyAssignments with correct parameters', async () => {
      const assignments = [mockAssignment];
      mockDeliveryAssignmentService.getMyAssignments.mockResolvedValue(assignments);

      const result = await resolver.getMyAssignments(mockContext);

      expect(mockDeliveryAssignmentService.getMyAssignments).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(assignments);
    });

    it('should return empty array when no assignments found', async () => {
      mockDeliveryAssignmentService.getMyAssignments.mockResolvedValue([]);

      const result = await resolver.getMyAssignments(mockContext);

      expect(result).toEqual([]);
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      mockDeliveryAssignmentService.getMyAssignments.mockRejectedValue(error);

      await expect(resolver.getMyAssignments(mockContext)).rejects.toThrow('Service error');
    });


    it('should return array of assignments', async () => {
      const assignments = [
        mockAssignment,
        { ...mockAssignment, id: 'assignment-456' },
      ];
      mockDeliveryAssignmentService.getMyAssignments.mockResolvedValue(assignments);

      const result = await resolver.getMyAssignments(mockContext);

      expect(result).toEqual(assignments);
      expect(result.length).toBe(2);
    });
  });

  describe('getPendingAssignment query', () => {
    const orderId = 'order-123';

    it('should call service getPendingAssignment with correct parameters', async () => {
      mockDeliveryAssignmentService.getPendingAssignment.mockResolvedValue(mockAssignment);

      const result = await resolver.getPendingAssignment(orderId);

      expect(mockDeliveryAssignmentService.getPendingAssignment).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(mockAssignment);
    });

    it('should return null when no pending assignment exists', async () => {
      mockDeliveryAssignmentService.getPendingAssignment.mockResolvedValue(null);

      const result = await resolver.getPendingAssignment(orderId);

      expect(result).toBeNull();
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      mockDeliveryAssignmentService.getPendingAssignment.mockRejectedValue(error);

      await expect(resolver.getPendingAssignment(orderId)).rejects.toThrow('Service error');
    });

    it('should handle empty orderId', async () => {
      mockDeliveryAssignmentService.getPendingAssignment.mockResolvedValue(null);

      const result = await resolver.getPendingAssignment('');

      expect(mockDeliveryAssignmentService.getPendingAssignment).toHaveBeenCalledWith('');
      expect(result).toBeNull();
    });

    it('should handle null orderId', async () => {
      mockDeliveryAssignmentService.getPendingAssignment.mockResolvedValue(null);

      const result = await resolver.getPendingAssignment(null as any);

      expect(mockDeliveryAssignmentService.getPendingAssignment).toHaveBeenCalledWith(null);
    });

    it('should handle undefined orderId', async () => {
      mockDeliveryAssignmentService.getPendingAssignment.mockResolvedValue(null);

      const result = await resolver.getPendingAssignment(undefined as any);

      expect(mockDeliveryAssignmentService.getPendingAssignment).toHaveBeenCalledWith(undefined);
    });

    it('should handle very long orderId', async () => {
      const longOrderId = 'a'.repeat(1000);
      mockDeliveryAssignmentService.getPendingAssignment.mockResolvedValue(null);

      const result = await resolver.getPendingAssignment(longOrderId);

      expect(mockDeliveryAssignmentService.getPendingAssignment).toHaveBeenCalledWith(longOrderId);
    });

    it('should handle special characters in orderId', async () => {
      const specialOrderId = 'order-123!@#$%^&*()';
      mockDeliveryAssignmentService.getPendingAssignment.mockResolvedValue(null);

      const result = await resolver.getPendingAssignment(specialOrderId);

      expect(mockDeliveryAssignmentService.getPendingAssignment).toHaveBeenCalledWith(specialOrderId);
    });
  });
});
