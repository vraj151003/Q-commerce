import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { Cart } from '../cart/entity/cart.entity';
import { Product } from '../products/entity/product.entity';
import { Shop } from '../shop/entity/shop.entity';
import { Repository, In } from 'typeorm';
import { CreateOrderInput } from './dto/create-order-input';
import {
  OrderStatus,
  paymentMethod,
  PaymentStatus,
} from '../../common/constant/status';
import * as ejs from 'ejs';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import { DeliveryAssignmentService } from '../delivery-assignment/delivery-assignment.service';
import { calculateGSTPerItem } from 'src/common/helper/helper';
import { TaxService } from '../tax/tax.service';
import { NotificationService } from '../notification/notification.service';
import { CouponService } from '../coupon/coupon.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Shop) private shopRepo: Repository<Shop>,
    private deliveryAssignmentService: DeliveryAssignmentService,
    private taxService: TaxService,
    private notificationService: NotificationService,
    private couponService: CouponService,
  ) {}

  async createOrder(user: any, input: CreateOrderInput) {
    // Validate user ID is a valid UUID
    if (!user.userId || user.userId === '0' || user.userId === 'undefined') {
      throw new BadRequestException('Invalid user ID');
    }

    const cart = await this.cartRepo.findOne({
      where: { user: { id: user.userId } },
      relations: ['items'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Get seller state from shop
    const customerState = input.state;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalWithTax = 0;

    // Apply coupon discount if provided
    let discountAmount = 0;
    let appliedCouponId: string | null = null;

    if (input.couponCode) {
      try {
        const couponResult = await this.couponService.applyCoupon({
          code: input.couponCode,
          orderAmount: cart.totalAmount,
        });
        discountAmount = couponResult.discountAmount;
        appliedCouponId = couponResult.coupon.id;
      } catch (error) {
        throw new BadRequestException(`Invalid coupon: ${error.message}`);
      }
    }

    const productIds = cart.items.map((i) => i.productId);
    const products = await this.productRepo.find({
      where: { id: In(productIds) },
      relations: ['shop', 'category'],
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Use transaction with row locking to prevent race conditions
    const result = await this.productRepo.manager.transaction(
      async (transactionalEntityManager) => {
        // Validate and lock stock for all items before creating order
        for (const cartItem of cart.items) {
          const product = await transactionalEntityManager.findOne(Product, {
            where: { id: cartItem.productId },
            lock: { mode: 'pessimistic_write' }, // Row locking to prevent race conditions
          });

          if (!product) {
            throw new NotFoundException(`Product ${cartItem.productId} not found`);
          }

          if (!product.isAvailable) {
            throw new BadRequestException(
              `Product ${product.name} is not available`,
            );
          }

          if (cartItem.quantity > product.stockQuantity) {
            throw new BadRequestException(
              `Requested quantity for ${product.name} (${cartItem.quantity}) exceeds available stock (${product.stockQuantity})`,
            );
          }

          // Reduce stock immediately within the transaction
          product.stockQuantity -= cartItem.quantity;
          await transactionalEntityManager.save(product);
        }

        // Set initial payment status based on payment method
        const initialPaymentStatus =
          input.paymentMethod === paymentMethod.CASH_ON_DELIVERY
            ? PaymentStatus.PENDING
            : PaymentStatus.PENDING;

        const order = transactionalEntityManager.create(Order, {
          ...input,
          user: { id: user.userId },
          totalAmount: Math.max(0, cart.totalAmount - discountAmount),
          totalItems: cart.totalItems,
          status: OrderStatus.PENDING,
          paymentStatus: initialPaymentStatus,
          couponId: appliedCouponId,
          discountAmount: discountAmount,
        });

        const savedOrder = await transactionalEntityManager.save(order);

        const items = await Promise.all(
          cart.items.map(async (item) => {
            const product = productMap.get(item.productId);

            if (!product) {
              throw new NotFoundException(`Product ${item.productId} not found`);
            }

            const sellerState = product.shop?.state || 'Gujarat';

            // Fetch tax rate by category
            let taxRate = 18; // Default fallback
            if (product.category) {
              const tax = await this.taxService.findTaxByCategory(
                product.categoryId,
              );
              if (tax) {
                taxRate = tax.taxRate;
              }
            }

            const gst = calculateGSTPerItem(
              sellerState,
              customerState,
              Number(item.totalPrice),
              taxRate,
            );
            totalCGST += Number(gst.cgst);
            totalSGST += Number(gst.sgst);
            totalIGST += Number(gst.igst);
            const itemTotlaWithTax = Number(item.totalPrice) + Number(gst.totalTax);
            totalWithTax += Number(itemTotlaWithTax);

            return transactionalEntityManager.create(OrderItem, {
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              totalPrice: item.totalPrice,

              //GST FIELDS
              cgstAmount: gst.cgst,
              sgstAmount: gst.sgst,
              igstAmount: gst.igst,
              gstRate: taxRate,
              totalAmountWithTax: itemTotlaWithTax,
              sellerState,

              order: savedOrder,
            });
          }),
        );

        await transactionalEntityManager.save(items);

        return savedOrder.id;
      },
    );

    // clear cart (outside transaction as it's not critical)
    cart.items = [];
    cart.totalAmount = 0;
    cart.totalItems = 0;
    await this.cartRepo.save(cart);

    // Auto-assign to nearest delivery person
    this.deliveryAssignmentService
      .autoAssignOrder(result)
      .catch((error) => {
        console.error('Failed to auto-assign delivery:', error);
      });

    // Send notifications to customer and seller
    const order = await this.findOne(result);
    const sellerId = products[0]?.shop?.sellerId || null;
    if (sellerId) {
      this.notificationService
        .createOrderNotification(user.userId, result, sellerId)
        .catch((error) => {
          console.error('Failed to create order notification:', error);
        });
    }

    // Increment coupon usage count if coupon was applied
    if (appliedCouponId) {
      this.couponService
        .incrementUsageCount(appliedCouponId)
        .catch((error) => {
          console.error('Failed to increment coupon usage count:', error);
        });
    }

    return order;
  }

  // Admin - All Orders
  findAll() {
    return this.orderRepo.find({ relations: ['items', 'user'] });
  }

  // Customer Orders
  findMyOrders(user: any) {
    return this.orderRepo.find({
      where: { user: { id: user.userId } },
      relations: ['items'],
    });
  }

  //  Single Order
  findOne(id: string) {
    return this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'user'],
    });
  }

  // Update Status
  async updateStatus(id: string, status: number) {
    await this.orderRepo.update(id, { status: status as OrderStatus });
    const order = await this.findOne(id);

    // Send notification to customer about status change
    if (order && order.user) {
      this.notificationService
        .createStatusChangeNotification(
          order.user.id,
          id,
          OrderStatus[status],
        )
        .catch((error) => {
          console.error('Failed to create status change notification:', error);
        });
    }

    return order;
  }

  // Cancel Order with stock restoration
  async cancelOrder(id: string, cancelReason?: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered order');
    }

    // Restore stock for each product
    for (const orderItem of order.items) {
      await this.productRepo.manager.transaction(
        async (transactionalEntityManager) => {
          const product = await transactionalEntityManager.findOne(Product, {
            where: { id: orderItem.productId },
          });

          if (product) {
            product.stockQuantity += orderItem.quantity;
            await transactionalEntityManager.save(product);
          }
        },
      );
    }

    // Update order status and cancellation details
    await this.orderRepo.update(id, {
      status: OrderStatus.CANCELLED,
      cancelReason,
      cancelledAt: new Date(),
    });

    // Send notification to customer about cancellation
    const cancelledOrder = await this.findOne(id);
    if (cancelledOrder && cancelledOrder.user) {
      this.notificationService
        .createCancellationNotification(cancelledOrder.user.id, id)
        .catch((error) => {
          console.error('Failed to create cancellation notification:', error);
        });
    }

    return cancelledOrder;
  }

  //Seller Orders
  async getSellerOrders(sellerId: string) {
    return this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .where(
        'item.productId IN (SELECT id FROM product WHERE sellerId = :sellerId)',
        { sellerId },
      )
      .getMany();
  }

  // Update Order
  async updateOrder(id: string, data: any) {
    await this.orderRepo.update(id, data);
    return this.findOne(id);
  }

  async generateOrderPdfBase64(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const templatePath = path.join(
      process.cwd(),
      'src',
      'modules',
      'orders',
      'templates',
      'order.ejs',
    );
    const html = await ejs.renderFile(templatePath, { order });

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      return Buffer.from(pdfBuffer).toString('base64');
    } finally {
      await browser.close();
    }
  }
}
