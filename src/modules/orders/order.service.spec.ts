import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import * as ejs from 'ejs';
import * as puppeteer from 'puppeteer';

jest.mock('ejs', () => ({
  renderFile: jest.fn(),
}));

jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

describe('OrderService', () => {
  let service: OrderService;
  let orderRepo: any;
  let itemRepo: any;
  let cartRepo: any;

  const cartWithItems = {
    id: 1,
    totalAmount: 100,
    totalItems: 2,
    items: [
      { productId: 'prod-1', quantity: 1, price: 20, totalPrice: 20 },
      { productId: 'prod-2', quantity: 1, price: 80, totalPrice: 80 },
    ],
  };

  const savedOrder = {
    id: 'order-id',
    totalAmount: 100,
    totalItems: 2,
    status: 'PENDING',
  };

  beforeEach(() => {
    orderRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    itemRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    cartRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    service = new OrderService(orderRepo, itemRepo, cartRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an order when cart has items and clear the cart afterward', async () => {
    cartRepo.findOne.mockResolvedValue(cartWithItems);
    orderRepo.create.mockReturnValue({ ...savedOrder, user: { id: 'user-id' } });
    orderRepo.save.mockResolvedValue(savedOrder);
    itemRepo.create.mockImplementation((item) => item);
    itemRepo.save.mockResolvedValue(cartWithItems.items);
    cartRepo.save.mockResolvedValue({ ...cartWithItems, items: [], totalAmount: 0, totalItems: 0 });
    orderRepo.findOne.mockResolvedValue(savedOrder);

    const result = await service.createOrder(
      { userId: 'user-id' },
      {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 1',
        city: 'Town',
        state: 'State',
        country: 'Country',
        pincode: '00000',
      },
    );

    expect(cartRepo.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'user-id' } },
      relations: ['items'],
    });
    expect(orderRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      totalAmount: 100,
      totalItems: 2,
      status: 'PENDING',
      user: { id: 'user-id' },
    }));
    expect(itemRepo.save).toHaveBeenCalledWith(expect.any(Array));
    expect(cartRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      items: [],
      totalAmount: 0,
      totalItems: 0,
    }));
    expect(result).toEqual(savedOrder);
  });

  it('should fail to create an order when the cart is empty', async () => {
    cartRepo.findOne.mockResolvedValue({ ...cartWithItems, items: [] });

    await expect(
      service.createOrder({ userId: 'user-id' }, {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 1',
        city: 'Town',
        state: 'State',
        country: 'Country',
        pincode: '00000',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(cartRepo.findOne).toHaveBeenCalled();
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('should return all orders from the repository', async () => {
    orderRepo.find.mockResolvedValue([savedOrder]);

    const result = await service.findAll();

    expect(orderRepo.find).toHaveBeenCalledWith({ relations: ['items', 'user'] });
    expect(result).toEqual([savedOrder]);
  });

  it('should return orders for the current user', async () => {
    orderRepo.find.mockResolvedValue([savedOrder]);

    const result = await service.findMyOrders({ userId: 'user-id' });

    expect(orderRepo.find).toHaveBeenCalledWith({
      where: { user: { id: 'user-id' } },
      relations: ['items'],
    });
    expect(result).toEqual([savedOrder]);
  });

  it('should return a single order when one exists', async () => {
    orderRepo.findOne.mockResolvedValue(savedOrder);

    const result = await service.findOne('order-id');

    expect(orderRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'order-id' },
      relations: ['items', 'user'],
    });
    expect(result).toEqual(savedOrder);
  });

  it('should update order status and return the updated order', async () => {
    orderRepo.update.mockResolvedValue(undefined);
    orderRepo.findOne.mockResolvedValue(savedOrder);

    const result = await service.updateStatus('order-id', 'SHIPPED');

    expect(orderRepo.update).toHaveBeenCalledWith('order-id', { status: 'SHIPPED' });
    expect(result).toEqual(savedOrder);
  });

  it('should return seller-specific orders using query builder', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([savedOrder]),
    };

    orderRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getSellerOrders('seller-id');

    expect(orderRepo.createQueryBuilder).toHaveBeenCalledWith('order');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('order.items', 'item');
    expect(qb.where).toHaveBeenCalledWith(
      'item.productId IN (SELECT id FROM product WHERE sellerId = :sellerId)',
      { sellerId: 'seller-id' },
    );
    expect(result).toEqual([savedOrder]);
  });

  it('should update an order and then return the updated order', async () => {
    orderRepo.update.mockResolvedValue(undefined);
    orderRepo.findOne.mockResolvedValue(savedOrder);

    const result = await service.updateOrder('order-id', { status: 'CANCELLED' });

    expect(orderRepo.update).toHaveBeenCalledWith('order-id', { status: 'CANCELLED' });
    expect(result).toEqual(savedOrder);
  });

  it('should generate order PDF base64 and close the browser', async () => {
    const html = '<html></html>';
    const pdfBuffer = Buffer.from('pdf');

    orderRepo.findOne.mockResolvedValue(savedOrder);
    (ejs.renderFile as jest.Mock).mockResolvedValue(html);

    const page = {
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(pdfBuffer),
    };
    const browser = {
      newPage: jest.fn().mockResolvedValue(page),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

    const result = await service.generateOrderPdfBase64('order-id');

    expect(orderRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'order-id' },
      relations: ['items', 'user'],
    });
    expect(ejs.renderFile).toHaveBeenCalled();
    expect(puppeteer.launch).toHaveBeenCalled();
    expect(page.setContent).toHaveBeenCalledWith(html, { waitUntil: 'networkidle0' });
    expect(page.pdf).toHaveBeenCalledWith({ format: 'A4', printBackground: true });
    expect(browser.close).toHaveBeenCalled();
    expect(result).toBe(pdfBuffer.toString('base64'));
  });

  it('should throw NotFoundException when generateOrderPdfBase64 cannot find the order', async () => {
    orderRepo.findOne.mockResolvedValue(undefined);

    await expect(service.generateOrderPdfBase64('missing-order')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should close browser even when PDF generation fails', async () => {
    const html = '<html></html>';
    orderRepo.findOne.mockResolvedValue(savedOrder);
    (ejs.renderFile as jest.Mock).mockResolvedValue(html);

    const page = {
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockRejectedValue(new Error('PDF failed')),
    };
    const browser = {
      newPage: jest.fn().mockResolvedValue(page),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

    await expect(service.generateOrderPdfBase64('order-id')).rejects.toThrow('PDF failed');

    expect(browser.close).toHaveBeenCalled();
  });
});
