import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entity/order.entity";
import { OrderItem } from "./entity/order-item.entity";
import { Cart } from "../cart/entity/cart.entity";
import { Product } from "../products/entity/product.entity";
import { Repository } from "typeorm";
import { CreateOrderInput } from "./dto/create-order-input";
import { OrderStatus, paymentMethod, PaymentStatus } from "../../common/constant/status";
import * as ejs from 'ejs';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import { DeliveryAssignmentService } from "../delivery-assignment/delivery-assignment.service";

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private deliveryAssignmentService: DeliveryAssignmentService,
  ) {}

async createOrder(user: any, input: CreateOrderInput) {
  const cart = await this.cartRepo.findOne({
    where: { user: { id: user.userId } },
    relations: ['items'],
  });

  if (!cart || cart.items.length === 0) {
    throw new BadRequestException('Cart is empty');
  }

  // Validate stock for all items before creating order
  for (const cartItem of cart.items) {
    const product = await this.productRepo.findOne({
      where: { id: cartItem.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${cartItem.productId} not found`);
    }

    if (!product.isAvailable) {
      throw new BadRequestException(`Product ${product.name} is not available`);
    }

    if (cartItem.quantity > product.stockQuantity) {
      throw new BadRequestException(
        `Requested quantity for ${product.name} (${cartItem.quantity}) exceeds available stock (${product.stockQuantity})`
      );
    }
  }

  // Set initial payment status based on payment method
  const initialPaymentStatus = input.paymentMethod === paymentMethod.CASH_ON_DELIVERY 
    ? PaymentStatus.PENDING 
    : PaymentStatus.PENDING;

  const order = this.orderRepo.create({
    ...input,
    user: { id: user.userId },
    totalAmount: cart.totalAmount,
    totalItems: cart.totalItems,
    status: OrderStatus.PENDING,
    paymentStatus: initialPaymentStatus,
  });

  const savedOrder = await this.orderRepo.save(order);

  const items = cart.items.map((item) =>
    this.itemRepo.create({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
      order: savedOrder,
    }),
  );

  await this.itemRepo.save(items);

  // Reduce stock for each product
  for (const cartItem of cart.items) {
    await this.productRepo.manager.transaction(async (transactionalEntityManager) => {
      const product = await transactionalEntityManager.findOne(Product, {
        where: { id: cartItem.productId },
      });

      if (product && product.stockQuantity >= cartItem.quantity) {
        product.stockQuantity -= cartItem.quantity;
        await transactionalEntityManager.save(product);
      }
    });
  }

  // clear cart
  cart.items = [];
  cart.totalAmount = 0;
  cart.totalItems = 0;
  await this.cartRepo.save(cart);

  // Auto-assign to nearest delivery person
  this.deliveryAssignmentService.autoAssignOrder(savedOrder.id).catch((error) => {
    console.error('Failed to auto-assign delivery:', error);
  });

  return this.findOne(savedOrder.id);
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
    return this.findOne(id);
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
      await this.productRepo.manager.transaction(async (transactionalEntityManager) => {
        const product = await transactionalEntityManager.findOne(Product, {
          where: { id: orderItem.productId },
        });

        if (product) {
          product.stockQuantity += orderItem.quantity;
          await transactionalEntityManager.save(product);
        }
      });
    }

    // Update order status and cancellation details
    await this.orderRepo.update(id, {
      status: OrderStatus.CANCELLED,
      cancelReason,
      cancelledAt: new Date(),
    });

    return this.findOne(id);
  }

  //Seller Orders
  async getSellerOrders(sellerId: string) {
    return this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .where('item.productId IN (SELECT id FROM product WHERE sellerId = :sellerId)', { sellerId })
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