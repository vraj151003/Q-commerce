import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entity/order.entity";
import { OrderItem } from "./entity/order-item.entity";
import { Cart } from "../cart/entity/cart.entity";
import { Repository } from "typeorm";
import { CreateOrderInput } from "./dto/create-order-input";
import * as ejs from 'ejs';
import * as puppeteer from 'puppeteer';
import * as path from 'path';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
  ) {}

  async createOrder(user: any, input: CreateOrderInput) {
    const cart = await this.cartRepo.findOne({
      where: { user: { id: user.userId } },
      relations: ['items'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const order = this.orderRepo.create({
      ...input,
      user: { id: user.userId },
      totalAmount: cart.totalAmount,
      totalItems: cart.totalItems,
      status: 'PENDING',
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

    // clear cart
    cart.items = [];
    cart.totalAmount = 0;
    cart.totalItems = 0;
    await this.cartRepo.save(cart);

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
  async updateStatus(id: string, status: string) {
    await this.orderRepo.update(id, { status });
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