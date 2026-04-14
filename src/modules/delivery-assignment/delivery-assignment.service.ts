import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryAssignment, AssignmentStatus } from './entity/delivery-assignment.entity';
import { Order } from '../orders/entity/order.entity';
import { DeliveryProfile } from '../delivery-profile/entity/delivery-profile.entity';
import { AcceptDeliveryInput } from './dto/accept-delivery.input';
import { RejectDeliveryInput } from './dto/reject-delivery.input';

@Injectable()
export class DeliveryAssignmentService {
  constructor(
    @InjectRepository(DeliveryAssignment)
    private readonly assignmentRepo: Repository<DeliveryAssignment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(DeliveryProfile)
    private readonly deliveryProfileRepo: Repository<DeliveryProfile>,
  ) {}

  // Calculate distance between two points using Haversine formula
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  // Find nearest available delivery person based on order location
  private async findNearestDeliveryPerson(order: Order): Promise<DeliveryProfile | null> {
    const deliveryProfiles = await this.deliveryProfileRepo.find({
      where: { isAvailable: true },
      relations: ['user'],
    });

    if (!deliveryProfiles || deliveryProfiles.length === 0) {
      return null;
    }

    let nearestProfile: DeliveryProfile | null = null;
    let minDistance = Infinity;

    for (const profile of deliveryProfiles) {
      if (profile.latitude && profile.longitude) {
        const distance = this.calculateDistance(
          order.latitude,
          order.longitude,
          profile.latitude,
          profile.longitude,
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestProfile = profile;
        }
      }
    }

    return nearestProfile;
  }

  // Auto-assign order to nearest delivery person when order is created
  async autoAssignOrder(orderId: string): Promise<DeliveryAssignment | null> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.latitude || !order.longitude) {
      return null; // Cannot assign without location
    }

    const nearestProfile = await this.findNearestDeliveryPerson(order);
    if (!nearestProfile) {
      return null; // No available delivery persons
    }

    // Calculate distance
    const distance = this.calculateDistance(
      order.latitude,
      order.longitude,
      nearestProfile.latitude,
      nearestProfile.longitude,
    );

    // Create assignment with 2-minute expiry
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    const assignment = this.assignmentRepo.create({
      order,
      deliveryProfile: nearestProfile,
      status: AssignmentStatus.PENDING,
      distance,
      assignedAt: new Date(),
      expiresAt,
      retryCount: 0,
    });

    return await this.assignmentRepo.save(assignment);
  }

  // Accept delivery assignment
  async acceptDelivery(input: AcceptDeliveryInput, user: any): Promise<DeliveryAssignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: input.assignmentId },
      relations: ['deliveryProfile', 'order'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Verify that the delivery person owns this assignment
    if (assignment.deliveryProfile.user.id !== user.userId) {
      throw new ForbiddenException('You can only accept your own assignments');
    }

    // Check if assignment is still pending
    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new ForbiddenException('Assignment is no longer pending');
    }

    // Check if assignment has expired
    if (new Date() > assignment.expiresAt) {
      throw new ForbiddenException('Assignment has expired');
    }

    // Update assignment status
    assignment.status = AssignmentStatus.ACCEPTED;
    assignment.respondedAt = new Date();

    // Update order with delivery person
    assignment.order.deliveryPersonId = assignment.deliveryProfile.user.id;
    assignment.order.assignedAt = new Date();

    // Set delivery profile to not available
    assignment.deliveryProfile.isAvailable = false;

    await this.assignmentRepo.save(assignment);
    await this.orderRepo.save(assignment.order);
    await this.deliveryProfileRepo.save(assignment.deliveryProfile);

    return assignment;
  }

  // Reject delivery assignment
  async rejectDelivery(input: RejectDeliveryInput, user: any): Promise<DeliveryAssignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: input.assignmentId },
      relations: ['deliveryProfile', 'order'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Verify that the delivery person owns this assignment
    if (assignment.deliveryProfile.user.id !== user.userId) {
      throw new ForbiddenException('You can only reject your own assignments');
    }

    // Check if assignment is still pending
    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new ForbiddenException('Assignment is no longer pending');
    }

    // Update assignment status
    assignment.status = AssignmentStatus.REJECTED;
    assignment.respondedAt = new Date();

    await this.assignmentRepo.save(assignment);

    // Try to reassign to next nearest delivery person
    await this.reassignOrder(assignment.order.id, assignment.retryCount);

    return assignment;
  }

  // Reassign order to next nearest delivery person
  private async reassignOrder(orderId: string, retryCount: number): Promise<void> {
    if (retryCount >= 5) {
      // Stop after 5 attempts
      return;
    }

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      return;
    }

    // Find nearest available delivery person (excluding already tried ones)
    const deliveryProfiles = await this.deliveryProfileRepo.find({
      where: { isAvailable: true },
      relations: ['user'],
    });

    if (!deliveryProfiles || deliveryProfiles.length === 0) {
      return;
    }

    // Get already tried delivery person IDs
    const previousAssignments = await this.assignmentRepo.find({
      where: { order },
      relations: ['deliveryProfile'],
    });

    const triedProfileIds = previousAssignments.map((a) => a.deliveryProfile.id);

    let nearestProfile: DeliveryProfile | null = null;
    let minDistance = Infinity;

    for (const profile of deliveryProfiles) {
      if (!triedProfileIds.includes(profile.id) && profile.latitude && profile.longitude) {
        const distance = this.calculateDistance(
          order.latitude,
          order.longitude,
          profile.latitude,
          profile.longitude,
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestProfile = profile;
        }
      }
    }

    if (!nearestProfile) {
      return;
    }

    // Create new assignment
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    const assignment = this.assignmentRepo.create({
      order,
      deliveryProfile: nearestProfile,
      status: AssignmentStatus.PENDING,
      distance: minDistance,
      assignedAt: new Date(),
      expiresAt,
      retryCount: retryCount + 1,
    });

    await this.assignmentRepo.save(assignment);
  }

  // Get assignments for a delivery person
  async getMyAssignments(user: any): Promise<DeliveryAssignment[]> {
    return await this.assignmentRepo.find({
      where: {
        deliveryProfile: { user: { id: user.userId } },
      },
      relations: ['order', 'deliveryProfile'],
      order: { assignedAt: 'DESC' },
    });
  }

  // Get pending assignment for a specific order
  async getPendingAssignment(orderId: string): Promise<DeliveryAssignment | null> {
    return await this.assignmentRepo.findOne({
      where: {
        order: { id: orderId },
        status: AssignmentStatus.PENDING,
      },
      relations: ['deliveryProfile', 'order'],
    });
  }

  // Check and expire pending assignments
  async expirePendingAssignments(): Promise<void> {
    const now = new Date();
    const expiredAssignments = await this.assignmentRepo
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.order', 'order')
      .where('assignment.status = :status', { status: AssignmentStatus.PENDING })
      .andWhere('assignment.expiresAt < :now', { now })
      .getMany();

    for (const assignment of expiredAssignments) {
      assignment.status = AssignmentStatus.EXPIRED;
      await this.assignmentRepo.save(assignment);

      // Try to reassign to next nearest delivery person
      await this.reassignOrder(assignment.order.id, assignment.retryCount);
    }
  }
}
