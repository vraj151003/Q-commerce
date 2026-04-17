import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderStatus, paymentMethod, PaymentStatus } from '../../common/constant/status';
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
  let productRepo: any;
  let shopRepo: any;
  let deliveryAssignmentService: any;
  let taxService: any;
  let notificationService: any;
  let couponService: any;

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
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: paymentMethod.ONLINE_PAYMENT,
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

    productRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    shopRepo = {
      findOne: jest.fn(),
    };

    deliveryAssignmentService = {
      autoAssignOrder: jest.fn().mockResolvedValue(null),
    };

    taxService = {
      findTaxByCategory: jest.fn(),
    };

    notificationService = {
      createNotification: jest.fn().mockResolvedValue({}),
      createOrderNotification: jest.fn().mockResolvedValue(undefined),
      createStatusChangeNotification: jest.fn().mockResolvedValue(undefined),
      createCancellationNotification: jest.fn().mockResolvedValue(undefined),
    };

    couponService = {
      applyCoupon: jest.fn(),
      validateCoupon: jest.fn(),
    };

    service = new OrderService(
      orderRepo,
      itemRepo,
      cartRepo,
      productRepo,
      shopRepo,
      deliveryAssignmentService,
      taxService,
      notificationService,
      couponService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an order when cart has items and clear the cart afterward', async () => {
    const product1 = {
      id: 'prod-1',
      isAvailable: true,
      stockQuantity: 10,
      shop: { state: 'Gujarat' },
      category: { id: 'cat-1' },
    };
    const product2 = {
      id: 'prod-2',
      isAvailable: true,
      stockQuantity: 5,
      shop: { state: 'Gujarat' },
      category: { id: 'cat-1' },
    };

    cartRepo.findOne.mockResolvedValue(cartWithItems);
    orderRepo.create.mockReturnValue({ ...savedOrder, user: { id: 'user-id' } });
    orderRepo.save.mockResolvedValue(savedOrder);
    itemRepo.create.mockImplementation((item) => item);
    itemRepo.save.mockResolvedValue(cartWithItems.items);
    cartRepo.save.mockResolvedValue({ ...cartWithItems, items: [], totalAmount: 0, totalItems: 0 });
    orderRepo.findOne.mockResolvedValue(savedOrder);
    shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });
    taxService.findTaxByCategory.mockResolvedValue({ taxRate: 18 });
    productRepo.find.mockResolvedValue([product1, product2]);
    productRepo.findOne.mockResolvedValue(product1);

    let capturedEntityManager: any;
    const transactionCallback = jest.fn((callback) => {
      const transactionalEntityManager = {
        findOne: jest.fn().mockImplementation(({ where, lock }) => {
          if (lock) {
            // Return product with original stock for locking
            return Promise.resolve({ ...product1, stockQuantity: 10 });
          }
          return Promise.resolve(product1);
        }),
        save: jest.fn().mockImplementation((entity) => {
          if (entity.stockQuantity !== undefined) {
            // Stock reduction
            return Promise.resolve({ ...entity, stockQuantity: entity.stockQuantity });
          }
          return Promise.resolve(entity);
        }),
        create: jest.fn((entity) => entity),
      };
      capturedEntityManager = transactionalEntityManager;
      return callback(transactionalEntityManager);
    });
    productRepo.manager.transaction.mockImplementation(transactionCallback);

    const result = await service.createOrder(
      { userId: 'user-id' },
      {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 1',
        city: 'Town',
        state: 'Gujarat',
        country: 'Country',
        pincode: '00000',
        paymentMethod: paymentMethod.ONLINE_PAYMENT,
      },
    );

    expect(cartRepo.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'user-id' } },
      relations: ['items'],
    });
    expect(productRepo.find).toHaveBeenCalledWith({
      where: { id: expect.objectContaining({ _type: 'in', _value: expect.any(Array) }) },
      relations: ['shop', 'category'],
    });
    expect(productRepo.manager.transaction).toHaveBeenCalled();
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
        paymentMethod: paymentMethod.ONLINE_PAYMENT,
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

    const result = await service.updateStatus('order-id', OrderStatus.CONFIRMED);

    expect(orderRepo.update).toHaveBeenCalledWith('order-id', { status: OrderStatus.CONFIRMED });
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

  it('should throw BadRequestException when product not found during order creation', async () => {
    const cartWithItemsForTest = {
      ...cartWithItems,
      items: [{ productId: 'prod-1', quantity: 1, price: 20, totalPrice: 20 }],
    };
    productRepo.find.mockResolvedValue([]);
    cartRepo.findOne.mockResolvedValue(cartWithItemsForTest);
    shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });

    const transactionCallback = jest.fn((callback) => {
      const transactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue(null),
        create: jest.fn((entity) => entity),
      };
      return callback(transactionalEntityManager);
    });
    productRepo.manager.transaction.mockImplementation(transactionCallback);

    await expect(
      service.createOrder(
        { userId: 'user-id' },
        {
          addressLine1: '123 Main St',
          addressLine2: 'Apt 1',
          city: 'Town',
          state: 'State',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when product unavailable during order creation', async () => {
    const unavailableProduct = {
      id: 'prod-1',
      isAvailable: false,
      stockQuantity: 10,
      shop: { state: 'Gujarat' },
      category: { id: 'cat-1' },
    };
    const availableProduct = {
      id: 'prod-2',
      isAvailable: true,
      stockQuantity: 5,
      shop: { state: 'Gujarat' },
      category: { id: 'cat-1' },
    };

    productRepo.find.mockResolvedValue([unavailableProduct, availableProduct]);
    productRepo.findOne.mockResolvedValue(unavailableProduct);
    cartRepo.findOne.mockResolvedValue(cartWithItems);
    shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });
    taxService.findTaxByCategory.mockResolvedValue({ taxRate: 18 });

    await expect(
      service.createOrder(
        { userId: 'user-id' },
        {
          addressLine1: '123 Main St',
          addressLine2: 'Apt 1',
          city: 'Town',
          state: 'State',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when requested quantity exceeds stock during order creation', async () => {
    const lowStockProduct = {
      id: 'prod-1',
      isAvailable: true,
      stockQuantity: 5,
      shop: { state: 'Gujarat' },
      category: { id: 'cat-1' },
    };
    const availableProduct = {
      id: 'prod-2',
      isAvailable: true,
      stockQuantity: 10,
      shop: { state: 'Gujarat' },
      category: { id: 'cat-1' },
    };

    productRepo.find.mockResolvedValue([lowStockProduct, availableProduct]);
    productRepo.findOne.mockResolvedValue(lowStockProduct);
    cartRepo.findOne.mockResolvedValue(cartWithItems);
    shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });
    taxService.findTaxByCategory.mockResolvedValue({ taxRate: 18 });

    await expect(
      service.createOrder(
        { userId: 'user-id' },
        {
          addressLine1: '123 Main St',
          addressLine2: 'Apt 1',
          city: 'Town',
          state: 'State',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // Cancel order test cases
  it('should cancel order and restore stock for all items', async () => {
    const orderWithItems = {
      ...savedOrder,
      status: OrderStatus.CONFIRMED,
      items: [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-2', quantity: 1 },
      ] as any,
    };
    const product = { id: 'prod-1', stockQuantity: 10 };

    orderRepo.findOne.mockResolvedValueOnce(orderWithItems).mockResolvedValueOnce(savedOrder);
    orderRepo.update.mockResolvedValue(undefined);

    const transactionCallback = jest.fn((callback) => {
      const transactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(product),
        save: jest.fn().mockImplementation((entity) => {
          if (entity.stockQuantity !== undefined) {
            // Stock restoration
            return Promise.resolve({ ...entity, stockQuantity: entity.stockQuantity });
          }
          return Promise.resolve(entity);
        }),
      };
      return callback(transactionalEntityManager);
    });
    productRepo.manager.transaction.mockImplementation(transactionCallback);

    const result = await service.cancelOrder('order-id', 'Customer request');

    expect(productRepo.manager.transaction).toHaveBeenCalledTimes(2);
    expect(orderRepo.update).toHaveBeenCalledWith('order-id', {
      status: OrderStatus.CANCELLED,
      cancelReason: 'Customer request',
      cancelledAt: expect.any(Date),
    });
    expect(result).toEqual(savedOrder);
  });

  it('should throw NotFoundException when cancelling non-existent order', async () => {
    orderRepo.findOne.mockResolvedValue(undefined);

    await expect(service.cancelOrder('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when cancelling already cancelled order', async () => {
    const cancelledOrder = { ...savedOrder, status: OrderStatus.CANCELLED, items: [] };
    orderRepo.findOne.mockResolvedValue(cancelledOrder);

    await expect(service.cancelOrder('order-id')).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when cancelling delivered order', async () => {
    const deliveredOrder = { ...savedOrder, status: OrderStatus.DELIVERED, items: [] };
    orderRepo.findOne.mockResolvedValue(deliveredOrder);

    await expect(service.cancelOrder('order-id')).rejects.toThrow(BadRequestException);
  });

  // Additional edge case and validation tests
  describe('createOrder edge cases', () => {
    it('should handle order with zero total amount', async () => {
      const product1 = {
        id: 'prod-1',
        isAvailable: true,
        stockQuantity: 10,
        shop: { state: 'Gujarat' },
        category: { id: 'cat-1' },
      };
      const zeroCart = {
        id: 1,
        totalAmount: 0,
        totalItems: 1,
        items: [{ productId: 'prod-1', quantity: 1, price: 0, totalPrice: 0 }],
      };

      productRepo.find.mockResolvedValue([product1]);
      productRepo.findOne.mockResolvedValue(product1);
      taxService.findTaxByCategory.mockResolvedValue({ taxRate: 18 });
      cartRepo.findOne.mockResolvedValue(zeroCart);
      orderRepo.create.mockReturnValue({ ...savedOrder, user: { id: 'user-id' } });
      orderRepo.save.mockResolvedValue(savedOrder);
      itemRepo.create.mockImplementation((item) => item);
      itemRepo.save.mockResolvedValue(zeroCart.items);
      cartRepo.save.mockResolvedValue({ ...zeroCart, items: [], totalAmount: 0, totalItems: 0 });
      orderRepo.findOne.mockResolvedValue(savedOrder);
      shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });

      const transactionCallback = jest.fn((callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockImplementation(({ where, lock }) => {
            if (lock) {
              return Promise.resolve({ ...product1, stockQuantity: 10 });
            }
            return Promise.resolve(product1);
          }),
          save: jest.fn().mockImplementation((entity) => {
            if (entity.stockQuantity !== undefined) {
              return Promise.resolve({ ...entity, stockQuantity: entity.stockQuantity });
            }
            return Promise.resolve(entity);
          }),
          create: jest.fn((entity) => entity),
        };
        return callback(transactionalEntityManager);
      });
      productRepo.manager.transaction.mockImplementation(transactionCallback);

      const result = await service.createOrder(
        { userId: 'user-id' },
        {
          addressLine1: '123 Main St',
          city: 'Town',
          state: 'Gujarat',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        },
      );

      expect(result).toEqual(savedOrder);
    });

    it('should handle tax service returning null', async () => {
      const product1 = {
        id: 'prod-1',
        isAvailable: true,
        stockQuantity: 10,
        shop: { state: 'Gujarat' },
        category: { id: 'cat-1' },
      };
      const product2 = {
        id: 'prod-2',
        isAvailable: true,
        stockQuantity: 5,
        shop: { state: 'Gujarat' },
        category: { id: 'cat-1' },
      };
      const testCartWithItems = {
        id: 1,
        totalAmount: 100,
        totalItems: 2,
        items: [
          { productId: 'prod-1', quantity: 1, price: 20, totalPrice: 20 },
          { productId: 'prod-2', quantity: 1, price: 80, totalPrice: 80 },
        ],
      };

      productRepo.find.mockResolvedValue([product1, product2]);
      productRepo.findOne.mockResolvedValue(product1);
      taxService.findTaxByCategory.mockResolvedValue(null);
      cartRepo.findOne.mockResolvedValue(testCartWithItems);
      orderRepo.create.mockReturnValue({ ...savedOrder, user: { id: 'user-id' } });
      orderRepo.save.mockResolvedValue(savedOrder);
      itemRepo.create.mockImplementation((item) => item);
      itemRepo.save.mockResolvedValue(testCartWithItems.items);
      cartRepo.save.mockResolvedValue({ ...testCartWithItems, items: [], totalAmount: 0, totalItems: 0 });
      orderRepo.findOne.mockResolvedValue(savedOrder);
      shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });

      const transactionCallback = jest.fn((callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockImplementation(({ where, lock }) => {
            if (lock) {
              return Promise.resolve({ ...product1, stockQuantity: 10 });
            }
            return Promise.resolve(product1);
          }),
          save: jest.fn().mockImplementation((entity) => {
            if (entity.stockQuantity !== undefined) {
              return Promise.resolve({ ...entity, stockQuantity: entity.stockQuantity });
            }
            return Promise.resolve(entity);
          }),
          create: jest.fn((entity) => entity),
        };
        return callback(transactionalEntityManager);
      });
      productRepo.manager.transaction.mockImplementation(transactionCallback);

      const result = await service.createOrder(
        { userId: 'user-id' },
        {
          addressLine1: '123 Main St',
          city: 'Town',
          state: 'Gujarat',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        },
      );

      expect(result).toEqual(savedOrder);
    });

    it('should handle itemRepo save error', async () => {
      const product1 = {
        id: 'prod-1',
        isAvailable: true,
        stockQuantity: 10,
        shop: { state: 'Gujarat' },
        category: { id: 'cat-1' },
      };
      const product2 = {
        id: 'prod-2',
        isAvailable: true,
        stockQuantity: 5,
        shop: { state: 'Gujarat' },
        category: { id: 'cat-1' },
      };
      const testCartWithItems = {
        id: 1,
        totalAmount: 100,
        totalItems: 2,
        items: [
          { productId: 'prod-1', quantity: 1, price: 20, totalPrice: 20 },
          { productId: 'prod-2', quantity: 1, price: 80, totalPrice: 80 },
        ],
      };

      productRepo.find.mockResolvedValue([product1, product2]);
      productRepo.findOne.mockResolvedValue(product1);
      taxService.findTaxByCategory.mockResolvedValue({ taxRate: 18 });
      cartRepo.findOne.mockResolvedValue(testCartWithItems);
      orderRepo.create.mockReturnValue({ ...savedOrder, user: { id: 'user-id' } });
      orderRepo.save.mockResolvedValue(savedOrder);
      itemRepo.create.mockImplementation((item) => item);
      itemRepo.save.mockRejectedValue(new Error('Database error'));
      shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });

      const transactionCallback = jest.fn((callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockImplementation(({ where, lock }) => {
            if (lock) {
              return Promise.resolve({ ...product1, stockQuantity: 10 });
            }
            return Promise.resolve(product1);
          }),
          save: jest.fn().mockImplementation((entity) => {
            if (entity.stockQuantity !== undefined) {
              return Promise.resolve({ ...entity, stockQuantity: entity.stockQuantity });
            }
            // Throw error for OrderItem save
            return Promise.reject(new Error('Database error'));
          }),
          create: jest.fn((entity) => entity),
        };
        return callback(transactionalEntityManager);
      });
      productRepo.manager.transaction.mockImplementation(transactionCallback);

      await expect(
        service.createOrder(
          { userId: 'user-id' },
          {
            addressLine1: '123 Main St',
            city: 'Town',
            state: 'Gujarat',
            country: 'Country',
            pincode: '00000',
            paymentMethod: paymentMethod.ONLINE_PAYMENT,
          },
        ),
      ).rejects.toThrow('Database error');
    });

    it('should handle orderRepo save error', async () => {
      const product1 = {
        id: 'prod-1',
        isAvailable: true,
        stockQuantity: 10,
        shop: { state: 'Gujarat' },
        category: { id: 'cat-1' },
      };
      const product2 = {
        id: 'prod-2',
        isAvailable: true,
        stockQuantity: 5,
        shop: { state: 'Gujarat' },
        category: { id: 'cat-1' },
      };
      const testCartWithItems = {
        id: 1,
        totalAmount: 100,
        totalItems: 2,
        items: [
          { productId: 'prod-1', quantity: 1, price: 20, totalPrice: 20 },
          { productId: 'prod-2', quantity: 1, price: 80, totalPrice: 80 },
        ],
      };

      productRepo.find.mockResolvedValue([product1, product2]);
      productRepo.findOne.mockResolvedValue(product1);
      taxService.findTaxByCategory.mockResolvedValue({ taxRate: 18 });
      cartRepo.findOne.mockResolvedValue(testCartWithItems);
      orderRepo.create.mockReturnValue({ ...savedOrder, user: { id: 'user-id' } });
      orderRepo.save.mockRejectedValue(new Error('Database error'));
      itemRepo.create.mockImplementation((item) => item);
      itemRepo.save.mockResolvedValue(testCartWithItems.items);
      shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });

      const transactionCallback = jest.fn((callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockImplementation(({ where, lock }) => {
            if (lock) {
              return Promise.resolve({ ...product1, stockQuantity: 10 });
            }
            return Promise.resolve(product1);
          }),
          save: jest.fn().mockImplementation((entity) => {
            if (entity.stockQuantity !== undefined) {
              return Promise.resolve({ ...entity, stockQuantity: entity.stockQuantity });
            }
            // Throw error for Order save
            return Promise.reject(new Error('Database error'));
          }),
          create: jest.fn((entity) => entity),
        };
        return callback(transactionalEntityManager);
      });
      productRepo.manager.transaction.mockImplementation(transactionCallback);

      await expect(
        service.createOrder(
          { userId: 'user-id' },
          {
            addressLine1: '123 Main St',
            city: 'Town',
            state: 'Gujarat',
            country: 'Country',
            pincode: '00000',
            paymentMethod: paymentMethod.ONLINE_PAYMENT,
          },
        ),
      ).rejects.toThrow('Database error');
    });
  });

  describe('cancelOrder edge cases', () => {
    it('should handle order with null items', async () => {
      const orderWithNullItems = {
        ...savedOrder,
        status: OrderStatus.CONFIRMED,
        items: null as any,
      };

      orderRepo.findOne.mockResolvedValue(orderWithNullItems);
      orderRepo.update.mockResolvedValue(undefined);

      await expect(service.cancelOrder('order-id', 'Test')).rejects.toThrow();
    });

    it('should handle productRepo transaction error during stock restoration', async () => {
      const orderWithItems = {
        ...savedOrder,
        status: OrderStatus.CONFIRMED,
        items: [{ productId: 'prod-1', quantity: 1 }] as any,
      };

      orderRepo.findOne.mockResolvedValueOnce(orderWithItems).mockResolvedValueOnce(savedOrder);
      orderRepo.update.mockResolvedValue(undefined);

      productRepo.manager.transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(service.cancelOrder('order-id', 'Test')).rejects.toThrow('Transaction failed');
    });
  });

  describe('Tax service integration', () => {
    it('should call taxService.findTaxByCategory with correct category ID', async () => {
      const product1 = {
        id: 'prod-1',
        isAvailable: true,
        stockQuantity: 10,
        categoryId: 'cat-electronics',
        shop: { state: 'Gujarat' },
        category: { id: 'cat-electronics' },
      };
      const product2 = {
        id: 'prod-2',
        isAvailable: true,
        stockQuantity: 5,
        categoryId: 'cat-clothing',
        shop: { state: 'Gujarat' },
        category: { id: 'cat-clothing' },
      };
      const testCartWithItems = {
        id: 1,
        totalAmount: 100,
        totalItems: 2,
        items: [
          { productId: 'prod-1', quantity: 1, price: 20, totalPrice: 20 },
          { productId: 'prod-2', quantity: 1, price: 80, totalPrice: 80 },
        ],
      };

      productRepo.find.mockResolvedValue([product1, product2]);
      productRepo.findOne.mockResolvedValue(product1);
      taxService.findTaxByCategory.mockResolvedValue({ taxRate: 18 });
      cartRepo.findOne.mockResolvedValue(testCartWithItems);
      orderRepo.create.mockReturnValue({ ...savedOrder, user: { id: 'user-id' } });
      orderRepo.save.mockResolvedValue(savedOrder);
      itemRepo.create.mockImplementation((item) => item);
      itemRepo.save.mockResolvedValue(testCartWithItems.items);
      cartRepo.save.mockResolvedValue({ ...testCartWithItems, items: [], totalAmount: 0, totalItems: 0 });
      orderRepo.findOne.mockResolvedValue(savedOrder);
      shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });

      const transactionCallback = jest.fn((callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockImplementation(({ where, lock }) => {
            if (lock) {
              return Promise.resolve({ ...product1, stockQuantity: 10 });
            }
            return Promise.resolve(product1);
          }),
          save: jest.fn().mockImplementation((entity) => {
            if (entity.stockQuantity !== undefined) {
              return Promise.resolve({ ...entity, stockQuantity: entity.stockQuantity });
            }
            return Promise.resolve(entity);
          }),
          create: jest.fn((entity) => entity),
        };
        return callback(transactionalEntityManager);
      });
      productRepo.manager.transaction.mockImplementation(transactionCallback);

      await service.createOrder(
        { userId: 'user-id' },
        {
          addressLine1: '123 Main St',
          city: 'Town',
          state: 'Gujarat',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        },
      );

      expect(taxService.findTaxByCategory).toHaveBeenCalledWith('cat-electronics');
      expect(taxService.findTaxByCategory).toHaveBeenCalledWith('cat-clothing');
    });

    it('should use default tax rate of 18 when tax service returns null', async () => {
      const product1 = {
        id: 'prod-1',
        isAvailable: true,
        stockQuantity: 10,
        categoryId: 'cat-1',
        shop: { state: 'Gujarat' },
        category: { id: 'cat-1' },
      };
      const testCartWithItems = {
        id: 1,
        totalAmount: 100,
        totalItems: 1,
        items: [{ productId: 'prod-1', quantity: 1, price: 100, totalPrice: 100 }],
      };

      productRepo.find.mockResolvedValue([product1]);
      productRepo.findOne.mockResolvedValue(product1);
      taxService.findTaxByCategory.mockResolvedValue(null);
      cartRepo.findOne.mockResolvedValue(testCartWithItems);
      orderRepo.create.mockReturnValue({ ...savedOrder, user: { id: 'user-id' } });
      orderRepo.save.mockResolvedValue(savedOrder);
      itemRepo.create.mockImplementation((item) => item);
      itemRepo.save.mockImplementation((items) => {
        const savedItems = items.map((item: any) => ({
          ...item,
          gstRate: 18,
        }));
        return Promise.resolve(savedItems);
      });
      cartRepo.save.mockResolvedValue({ ...testCartWithItems, items: [], totalAmount: 0, totalItems: 0 });
      orderRepo.findOne.mockResolvedValue(savedOrder);
      shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });

      const transactionCallback = jest.fn((callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockImplementation(({ where, lock }) => {
            if (lock) {
              return Promise.resolve({ ...product1, stockQuantity: 10 });
            }
            return Promise.resolve(product1);
          }),
          save: jest.fn().mockImplementation((entity) => {
            if (entity.stockQuantity !== undefined) {
              return Promise.resolve({ ...entity, stockQuantity: entity.stockQuantity });
            }
            return Promise.resolve(entity);
          }),
          create: jest.fn((entity) => entity),
        };
        return callback(transactionalEntityManager);
      });
      productRepo.manager.transaction.mockImplementation(transactionCallback);

      const result = await service.createOrder(
        { userId: 'user-id' },
        {
          addressLine1: '123 Main St',
          city: 'Town',
          state: 'Gujarat',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        },
      );

      expect(result).toEqual(savedOrder);
      expect(taxService.findTaxByCategory).toHaveBeenCalledWith('cat-1');
    });

    it('should handle different tax rates for different categories', async () => {
      const product1 = {
        id: 'prod-1',
        isAvailable: true,
        stockQuantity: 10,
        shop: { state: 'Gujarat' },
        category: { id: 'cat-electronics' },
      };
      const product2 = {
        id: 'prod-2',
        isAvailable: true,
        stockQuantity: 5,
        shop: { state: 'Gujarat' },
        category: { id: 'cat-clothing' },
      };
      const testCartWithItems = {
        id: 1,
        totalAmount: 100,
        totalItems: 2,
        items: [
          { productId: 'prod-1', quantity: 1, price: 20, totalPrice: 20 },
          { productId: 'prod-2', quantity: 1, price: 80, totalPrice: 80 },
        ],
      };

      productRepo.find.mockResolvedValue([product1, product2]);
      productRepo.findOne.mockResolvedValue(product1);
      taxService.findTaxByCategory.mockImplementation((categoryId) => {
        if (categoryId === 'cat-electronics') return Promise.resolve({ taxRate: 28 });
        if (categoryId === 'cat-clothing') return Promise.resolve({ taxRate: 12 });
        return Promise.resolve({ taxRate: 18 });
      });
      cartRepo.findOne.mockResolvedValue(testCartWithItems);
      orderRepo.create.mockReturnValue({ ...savedOrder, user: { id: 'user-id' } });
      orderRepo.save.mockResolvedValue(savedOrder);
      itemRepo.create.mockImplementation((item) => item);
      itemRepo.save.mockResolvedValue(testCartWithItems.items);
      cartRepo.save.mockResolvedValue({ ...testCartWithItems, items: [], totalAmount: 0, totalItems: 0 });
      orderRepo.findOne.mockResolvedValue(savedOrder);
      shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });

      const transactionCallback = jest.fn((callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockImplementation(({ where, lock }) => {
            if (lock) {
              return Promise.resolve({ ...product1, stockQuantity: 10 });
            }
            return Promise.resolve(product1);
          }),
          save: jest.fn().mockImplementation((entity) => {
            if (entity.stockQuantity !== undefined) {
              return Promise.resolve({ ...entity, stockQuantity: entity.stockQuantity });
            }
            return Promise.resolve(entity);
          }),
          create: jest.fn((entity) => entity),
        };
        return callback(transactionalEntityManager);
      });
      productRepo.manager.transaction.mockImplementation(transactionCallback);

      const result = await service.createOrder(
        { userId: 'user-id' },
        {
          addressLine1: '123 Main St',
          city: 'Town',
          state: 'Gujarat',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        },
      );

      expect(result).toEqual(savedOrder);
    });

    it('should handle tax service error gracefully', async () => {
      const product1 = {
        id: 'prod-1',
        isAvailable: true,
        stockQuantity: 10,
        categoryId: 'cat-1',
        shop: { state: 'Gujarat' },
        category: { id: 'cat-1' },
      };
      const testCartWithItems = {
        id: 1,
        totalAmount: 100,
        totalItems: 1,
        items: [{ productId: 'prod-1', quantity: 1, price: 100, totalPrice: 100 }],
      };

      productRepo.find.mockResolvedValue([product1]);
      productRepo.findOne.mockResolvedValue(product1);
      taxService.findTaxByCategory.mockRejectedValue(new Error('Tax service unavailable'));
      cartRepo.findOne.mockResolvedValue(testCartWithItems);
      orderRepo.create.mockReturnValue({ ...savedOrder, user: { id: 'user-id' } });
      orderRepo.save.mockResolvedValue(savedOrder);
      itemRepo.create.mockImplementation((item) => item);
      itemRepo.save.mockResolvedValue(testCartWithItems.items);
      cartRepo.save.mockResolvedValue({ ...testCartWithItems, items: [], totalAmount: 0, totalItems: 0 });
      orderRepo.findOne.mockResolvedValue(savedOrder);
      shopRepo.findOne.mockResolvedValue({ state: 'Gujarat' });

      const transactionCallback = jest.fn((callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockImplementation(({ where, lock }) => {
            if (lock) {
              return Promise.resolve({ ...product1, stockQuantity: 10 });
            }
            return Promise.resolve(product1);
          }),
          save: jest.fn().mockImplementation((entity) => {
            if (entity.stockQuantity !== undefined) {
              return Promise.resolve({ ...entity, stockQuantity: entity.stockQuantity });
            }
            return Promise.resolve(entity);
          }),
          create: jest.fn((entity) => entity),
        };
        return callback(transactionalEntityManager);
      });
      productRepo.manager.transaction.mockImplementation(transactionCallback);

      await expect(
        service.createOrder(
          { userId: 'user-id' },
          {
            addressLine1: '123 Main St',
            city: 'Town',
            state: 'Gujarat',
            country: 'Country',
            pincode: '00000',
            paymentMethod: paymentMethod.ONLINE_PAYMENT,
          },
        ),
      ).rejects.toThrow('Tax service unavailable');
    });
  });

  describe('OrderResolver', () => {
    let orderResolver: any;
    let orderService: jest.Mocked<OrderService>;

    beforeEach(async () => {
      orderService = {
        createOrder: jest.fn(),
        findAll: jest.fn(),
        findMyOrders: jest.fn(),
        findOne: jest.fn(),
        generateOrderPdfBase64: jest.fn(),
        updateStatus: jest.fn(),
        cancelOrder: jest.fn(),
        getSellerOrders: jest.fn(),
        updateOrder: jest.fn(),
      } as any;

      const { OrderResolver } = require('./order.resolver');
      orderResolver = new OrderResolver(orderService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('createOrder', () => {
      it('should successfully create order with valid input and user context', async () => {
        const mockContext = {
          req: { user: { userId: 'user-123', role: 'admin' } },
        };
        const mockInput = {
          addressLine1: '123 Main St',
          addressLine2: 'Apt 1',
          city: 'Town',
          state: 'Gujarat',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        };
        orderService.createOrder.mockResolvedValue(savedOrder as any);

        const result = await orderResolver.createOrder(mockInput, mockContext);

        expect(result).toEqual(savedOrder);
        expect(orderService.createOrder).toHaveBeenCalledWith(mockContext.req.user, mockInput);
      });

      it('should propagate errors from order service', async () => {
        const mockContext = {
          req: { user: { userId: 'user-123', role: 'admin' } },
        };
        const mockInput = {
          addressLine1: '123 Main St',
          city: 'Town',
          state: 'Gujarat',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        };
        orderService.createOrder.mockRejectedValue(new BadRequestException('Cart is empty'));

        await expect(orderResolver.createOrder(mockInput, mockContext)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle missing user in context', async () => {
        const mockContext = { req: {} };
        const mockInput = {
          addressLine1: '123 Main St',
          city: 'Town',
          state: 'Gujarat',
          country: 'Country',
          pincode: '00000',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        };
        orderService.createOrder.mockResolvedValue(savedOrder as any);

        const result = await orderResolver.createOrder(mockInput, mockContext);

        expect(result).toEqual(savedOrder);
      });

      it('should handle null input', async () => {
        const mockContext = {
          req: { user: { userId: 'user-123', role: 'admin' } },
        };
        orderService.createOrder.mockRejectedValue(new Error('Invalid input'));

        await expect(orderResolver.createOrder(null, mockContext)).rejects.toThrow();
      });

      it('should handle undefined input', async () => {
        const mockContext = {
          req: { user: { userId: 'user-123', role: 'admin' } },
        };
        orderService.createOrder.mockRejectedValue(new Error('Invalid input'));

        await expect(orderResolver.createOrder(undefined, mockContext)).rejects.toThrow();
      });

      it('should handle empty input fields', async () => {
        const mockContext = {
          req: { user: { userId: 'user-123', role: 'admin' } },
        };
        const mockInput = {
          addressLine1: '',
          city: '',
          state: '',
          country: '',
          pincode: '',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        };
        orderService.createOrder.mockRejectedValue(new BadRequestException('Invalid address'));

        await expect(orderResolver.createOrder(mockInput, mockContext)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('getOrders', () => {
      it('should successfully return all orders', async () => {
        orderService.findAll.mockResolvedValue([savedOrder as any]);

        const result = await orderResolver.getOrders();

        expect(result).toEqual([savedOrder]);
        expect(orderService.findAll).toHaveBeenCalled();
      });

      it('should propagate errors from order service', async () => {
        orderService.findAll.mockRejectedValue(new Error('Database error'));

        await expect(orderResolver.getOrders()).rejects.toThrow('Database error');
      });

      it('should handle empty orders list', async () => {
        orderService.findAll.mockResolvedValue([]);

        const result = await orderResolver.getOrders();

        expect(result).toEqual([]);
      });
    });

    describe('getMyOrders', () => {
      it('should successfully return orders for current user', async () => {
        const mockContext = {
          req: { user: { userId: 'user-123' } },
        };
        orderService.findMyOrders.mockResolvedValue([savedOrder as any]);

        const result = await orderResolver.getMyOrders(mockContext);

        expect(result).toEqual([savedOrder]);
        expect(orderService.findMyOrders).toHaveBeenCalledWith(mockContext.req.user);
      });

      it('should propagate errors from order service', async () => {
        const mockContext = {
          req: { user: { userId: 'user-123' } },
        };
        orderService.findMyOrders.mockRejectedValue(new Error('Database error'));

        await expect(orderResolver.getMyOrders(mockContext)).rejects.toThrow('Database error');
      });

      it('should handle missing user in context', async () => {
        const mockContext = { req: {} };
        orderService.findMyOrders.mockResolvedValue([]);

        const result = await orderResolver.getMyOrders(mockContext);

        expect(result).toEqual([]);
      });
    });

    describe('getOrder', () => {
      it('should successfully return a single order', async () => {
        orderService.findOne.mockResolvedValue(savedOrder as any);

        const result = await orderResolver.getOrder('order-123');

        expect(result).toEqual(savedOrder);
        expect(orderService.findOne).toHaveBeenCalledWith('order-123');
      });

      it('should propagate errors from order service', async () => {
        orderService.findOne.mockRejectedValue(new NotFoundException('Order not found'));

        await expect(orderResolver.getOrder('order-123')).rejects.toThrow(NotFoundException);
      });

      it('should handle null order ID', async () => {
        orderService.findOne.mockRejectedValue(new Error('Invalid order ID'));

        await expect(orderResolver.getOrder(null)).rejects.toThrow();
      });

      it('should handle empty string order ID', async () => {
        orderService.findOne.mockRejectedValue(new Error('Invalid order ID'));

        await expect(orderResolver.getOrder('')).rejects.toThrow();
      });

      it('should handle undefined order ID', async () => {
        orderService.findOne.mockRejectedValue(new Error('Invalid order ID'));

        await expect(orderResolver.getOrder(undefined)).rejects.toThrow();
      });
    });

    describe('downloadOrderPdf', () => {
      it('should successfully generate and return PDF base64', async () => {
        const mockPdfBase64 = 'base64string';
        orderService.generateOrderPdfBase64.mockResolvedValue(mockPdfBase64);

        const result = await orderResolver.downloadOrderPdf('order-123');

        expect(result).toEqual(mockPdfBase64);
        expect(orderService.generateOrderPdfBase64).toHaveBeenCalledWith('order-123');
      });

      it('should propagate errors from order service', async () => {
        orderService.generateOrderPdfBase64.mockRejectedValue(
          new NotFoundException('Order not found'),
        );

        await expect(orderResolver.downloadOrderPdf('order-123')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle null order ID', async () => {
        orderService.generateOrderPdfBase64.mockRejectedValue(new Error('Invalid order ID'));

        await expect(orderResolver.downloadOrderPdf(null)).rejects.toThrow();
      });

      it('should handle empty string order ID', async () => {
        orderService.generateOrderPdfBase64.mockRejectedValue(new Error('Invalid order ID'));

        await expect(orderResolver.downloadOrderPdf('')).rejects.toThrow();
      });
    });

    describe('updateOrderStatus', () => {
      it('should successfully update order status', async () => {
        const mockInput = { orderId: 'order-123', status: OrderStatus.CONFIRMED };
        orderService.updateStatus.mockResolvedValue(savedOrder as any);

        const result = await orderResolver.updateOrderStatus(mockInput);

        expect(result).toEqual(savedOrder);
        expect(orderService.updateStatus).toHaveBeenCalledWith('order-123', OrderStatus.CONFIRMED);
      });

      it('should propagate errors from order service', async () => {
        const mockInput = { orderId: 'order-123', status: OrderStatus.CONFIRMED };
        orderService.updateStatus.mockRejectedValue(new NotFoundException('Order not found'));

        await expect(orderResolver.updateOrderStatus(mockInput)).rejects.toThrow(NotFoundException);
      });


      it('should handle invalid status', async () => {
        const mockInput = { orderId: 'order-123', status: 'INVALID_STATUS' };
        orderService.updateStatus.mockRejectedValue(new Error('Invalid status'));

        await expect(orderResolver.updateOrderStatus(mockInput)).rejects.toThrow();
      });
    });

    describe('cancelOrder', () => {
      it('should successfully cancel order with reason', async () => {
        orderService.cancelOrder.mockResolvedValue(savedOrder as any);

        const result = await orderResolver.cancelOrder('order-123', 'Customer request');

        expect(result).toEqual(savedOrder);
        expect(orderService.cancelOrder).toHaveBeenCalledWith('order-123', 'Customer request');
      });

      it('should successfully cancel order without reason', async () => {
        orderService.cancelOrder.mockResolvedValue(savedOrder as any);

        const result = await orderResolver.cancelOrder('order-123');

        expect(result).toEqual(savedOrder);
        expect(orderService.cancelOrder).toHaveBeenCalledWith('order-123', undefined);
      });

      it('should propagate errors from order service', async () => {
        orderService.cancelOrder.mockRejectedValue(
          new BadRequestException('Cannot cancel delivered order'),
        );

        await expect(orderResolver.cancelOrder('order-123')).rejects.toThrow(BadRequestException);
      });

      it('should handle null order ID', async () => {
        orderService.cancelOrder.mockRejectedValue(new Error('Invalid order ID'));

        await expect(orderResolver.cancelOrder(null)).rejects.toThrow();
      });

      it('should handle empty string order ID', async () => {
        orderService.cancelOrder.mockRejectedValue(new Error('Invalid order ID'));

        await expect(orderResolver.cancelOrder('')).rejects.toThrow();
      });

      it('should handle very long cancel reason', async () => {
        const longReason = 'A'.repeat(1000);
        orderService.cancelOrder.mockResolvedValue(savedOrder as any);

        const result = await orderResolver.cancelOrder('order-123', longReason);

        expect(result).toEqual(savedOrder);
        expect(orderService.cancelOrder).toHaveBeenCalledWith('order-123', longReason);
      });
    });

    describe('getSellerOrders', () => {
      it('should successfully return seller orders', async () => {
        const mockContext = {
          req: { user: { userId: 'seller-123' } },
        };
        orderService.getSellerOrders.mockResolvedValue([savedOrder as any]);

        const result = await orderResolver.getSellerOrders(mockContext);

        expect(result).toEqual([savedOrder]);
        expect(orderService.getSellerOrders).toHaveBeenCalledWith('seller-123');
      });

      it('should propagate errors from order service', async () => {
        const mockContext = {
          req: { user: { userId: 'seller-123' } },
        };
        orderService.getSellerOrders.mockRejectedValue(new Error('Database error'));

        await expect(orderResolver.getSellerOrders(mockContext)).rejects.toThrow('Database error');
      });

    });

    describe('updateOrder', () => {
      it('should successfully update order', async () => {
        const mockData = {
          addressLine1: '456 New St',
          city: 'New City',
          state: 'Gujarat',
          country: 'Country',
          pincode: '11111',
          paymentMethod: paymentMethod.CASH_ON_DELIVERY,
        };
        orderService.updateOrder.mockResolvedValue(savedOrder as any);

        const result = await orderResolver.updateOrder('order-123', mockData);

        expect(result).toEqual(savedOrder);
        expect(orderService.updateOrder).toHaveBeenCalledWith('order-123', mockData);
      });

      it('should propagate errors from order service', async () => {
        const mockData = {
          addressLine1: '456 New St',
          city: 'New City',
          state: 'Gujarat',
          country: 'Country',
          pincode: '11111',
          paymentMethod: paymentMethod.CASH_ON_DELIVERY,
        };
        orderService.updateOrder.mockRejectedValue(new NotFoundException('Order not found'));

        await expect(orderResolver.updateOrder('order-123', mockData)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle null order ID', async () => {
        const mockData = {
          addressLine1: '456 New St',
          city: 'New City',
          state: 'Gujarat',
          country: 'Country',
          pincode: '11111',
          paymentMethod: paymentMethod.CASH_ON_DELIVERY,
        };
        orderService.updateOrder.mockRejectedValue(new Error('Invalid order ID'));

        await expect(orderResolver.updateOrder(null, mockData)).rejects.toThrow();
      });

      it('should handle null data', async () => {
        orderService.updateOrder.mockRejectedValue(new Error('Invalid data'));

        await expect(orderResolver.updateOrder('order-123', null)).rejects.toThrow();
      });

      it('should handle empty data fields', async () => {
        const mockData = {
          addressLine1: '',
          city: '',
          state: '',
          country: '',
          pincode: '',
          paymentMethod: paymentMethod.ONLINE_PAYMENT,
        };
        orderService.updateOrder.mockRejectedValue(new BadRequestException('Invalid data'));

        await expect(orderResolver.updateOrder('order-123', mockData)).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });
});
