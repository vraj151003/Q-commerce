import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartService } from './cart.service';
import { Cart } from './entity/cart.entity';
import { CartItem } from './entity/cart-item.entity';
import { AddToCartInput } from './dto/add-item-input';

describe('CartService', () => {
  let service: CartService;
  let cartRepo: Partial<Repository<Cart>>;
  let itemRepo: Partial<Repository<CartItem>>;

  const user = { userId: 'user-1' };

  const mockCart = {
    id: 1,
    totalAmount: 20,
    totalItems: 2,
    isActive: true,
    user: { id: user.userId },
    items: [],
  } as Cart;

  const mockItem = {
    id: 10,
    productId: 'product-1',
    quantity: 2,
    price: 10,
    totalPrice: 20,
    cart: mockCart,
  } as CartItem;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepo = module.get(getRepositoryToken(Cart));
    itemRepo = module.get(getRepositoryToken(CartItem));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the active cart when one already exists', async () => {
    (cartRepo.findOne as jest.Mock).mockResolvedValue(mockCart);

    const result = await service.getCart(user.userId);

    expect(cartRepo.findOne).toHaveBeenCalledWith({
      where: { user: { id: user.userId }, isActive: true },
      relations: ['items'],
    });
    expect(cartRepo.create).not.toHaveBeenCalled();
    expect(result).toEqual(mockCart);
  });

  it('should create and persist a new cart when no active cart exists', async () => {
    const createdCart = { ...mockCart, totalAmount: 0, totalItems: 0 } as Cart;
    (cartRepo.findOne as jest.Mock).mockResolvedValueOnce(undefined).mockResolvedValueOnce(createdCart);
    (cartRepo.create as jest.Mock).mockReturnValue(createdCart);
    (cartRepo.save as jest.Mock).mockResolvedValue(createdCart);

    const result = await service.getCart(user.userId);

    expect(cartRepo.create).toHaveBeenCalledWith({ user: { id: user.userId } });
    expect(cartRepo.save).toHaveBeenCalledWith(createdCart);
    expect(result).toEqual(createdCart);
  });

  it('should add a new item to the cart and recalculate totals', async () => {
    const input: AddToCartInput = { productId: 'product-2', quantity: 3, price: 15 };
    const createdItem = {
      id: 11,
      ...input,
      totalPrice: 45,
      cart: mockCart,
    } as CartItem;
    const updatedCart = {
      ...mockCart,
      totalAmount: 45,
      totalItems: 3,
      items: [createdItem],
    } as Cart;

    jest.spyOn(service, 'getCart').mockResolvedValue(mockCart);
    jest.spyOn(service, 'recalculateCart').mockResolvedValue(updatedCart);
    (itemRepo.findOne as jest.Mock).mockResolvedValue(undefined);
    (itemRepo.create as jest.Mock).mockReturnValue(createdItem);
    (itemRepo.save as jest.Mock).mockResolvedValue(createdItem);

    const result = await service.addToCart(input, user);

    expect(itemRepo.create).toHaveBeenCalledWith({
      ...input,
      totalPrice: 45,
      cart: mockCart,
    });
    expect(itemRepo.save).toHaveBeenCalledWith(createdItem);
    expect(service.recalculateCart).toHaveBeenCalledWith(mockCart.id);
    expect(result).toEqual(updatedCart);
  });

  it('should increase quantity for an existing cart item before recalculation', async () => {
    const existingItem = { ...mockItem } as CartItem;
    const updatedCart = {
      ...mockCart,
      totalAmount: 30,
      totalItems: 3,
      items: [{ ...existingItem, quantity: 3, totalPrice: 30 }],
    } as Cart;

    jest.spyOn(service, 'getCart').mockResolvedValue(mockCart);
    jest.spyOn(service, 'recalculateCart').mockResolvedValue(updatedCart);
    (itemRepo.findOne as jest.Mock).mockResolvedValue(existingItem);
    (itemRepo.save as jest.Mock).mockResolvedValue(existingItem);

    const result = await service.addToCart(
      { productId: existingItem.productId, quantity: 1, price: existingItem.price },
      user,
    );

    expect(existingItem.quantity).toBe(3);
    expect(existingItem.totalPrice).toBe(30);
    expect(itemRepo.save).toHaveBeenCalledWith(existingItem);
    expect(result).toEqual(updatedCart);
  });

  it('should update an item quantity and total price', async () => {
    const existingItem = { ...mockItem } as CartItem;
    const updatedCart = {
      ...mockCart,
      totalAmount: 50,
      totalItems: 5,
      items: [{ ...existingItem, quantity: 5, totalPrice: 50 }],
    } as Cart;

    jest.spyOn(service, 'getCart').mockResolvedValue(mockCart);
    jest.spyOn(service, 'recalculateCart').mockResolvedValue(updatedCart);
    (itemRepo.findOne as jest.Mock).mockResolvedValue(existingItem);
    (itemRepo.save as jest.Mock).mockResolvedValue(existingItem);

    const result = await service.updateItem(existingItem.productId, 5, user);

    expect(existingItem.quantity).toBe(5);
    expect(existingItem.totalPrice).toBe(50);
    expect(itemRepo.save).toHaveBeenCalledWith(existingItem);
    expect(result).toEqual(updatedCart);
  });

  it('should throw when updating a cart item that does not exist', async () => {
    jest.spyOn(service, 'getCart').mockResolvedValue(mockCart);
    (itemRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(service.updateItem('missing-product', 1, user)).rejects.toThrow(NotFoundException);
    expect(itemRepo.save).not.toHaveBeenCalled();
  });

  it('should remove an item and recalculate the cart', async () => {
    const updatedCart = {
      ...mockCart,
      totalAmount: 0,
      totalItems: 0,
      items: [],
    } as Cart;

    jest.spyOn(service, 'getCart').mockResolvedValue(mockCart);
    jest.spyOn(service, 'recalculateCart').mockResolvedValue(updatedCart);
    (itemRepo.findOne as jest.Mock).mockResolvedValue(mockItem);
    (itemRepo.remove as jest.Mock).mockResolvedValue(mockItem);

    const result = await service.removeItem(mockItem.id, user);

    expect(itemRepo.remove).toHaveBeenCalledWith(mockItem);
    expect(service.recalculateCart).toHaveBeenCalledWith(mockCart.id);
    expect(result).toEqual(updatedCart);
  });

  it('should throw when removing an item that does not exist', async () => {
    jest.spyOn(service, 'getCart').mockResolvedValue(mockCart);
    (itemRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(service.removeItem(999, user)).rejects.toThrow(NotFoundException);
    expect(itemRepo.remove).not.toHaveBeenCalled();
  });

  it('should clear the cart and reset totals', async () => {
    const cartToClear = { ...mockCart } as Cart;
    jest.spyOn(service, 'getCart').mockResolvedValue(cartToClear);
    (itemRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });
    (cartRepo.save as jest.Mock).mockImplementation(async (cart: Cart) => cart);

    const result = await service.clearCart(user);

    expect(itemRepo.delete).toHaveBeenCalledWith({ cart: { id: cartToClear.id } });
    expect(cartToClear.totalAmount).toBe(0);
    expect(cartToClear.totalItems).toBe(0);
    expect(cartRepo.save).toHaveBeenCalledWith(cartToClear);
    expect(result).toEqual(cartToClear);
  });

  it('should delegate getMyCart to getCart', async () => {
    const getCartSpy = jest.spyOn(service, 'getCart').mockResolvedValue(mockCart);

    const result = await service.getMyCart(user);

    expect(getCartSpy).toHaveBeenCalledWith(user.userId);
    expect(result).toEqual(mockCart);
  });

  it('should recalculate totals from all cart items and return the updated cart', async () => {
    const items = [
      { ...mockItem, quantity: 2, totalPrice: 20 },
      { ...mockItem, id: 11, productId: 'product-2', quantity: 1, totalPrice: 15 },
    ] as CartItem[];
    const updatedCart = {
      ...mockCart,
      totalAmount: 35,
      totalItems: 3,
      items,
    } as Cart;

    (itemRepo.find as jest.Mock).mockResolvedValue(items);
    (cartRepo.update as jest.Mock).mockResolvedValue({ affected: 1 });
    (cartRepo.findOne as jest.Mock).mockResolvedValue(updatedCart);

    const result = await service.recalculateCart(mockCart.id);

    expect(itemRepo.find).toHaveBeenCalledWith({ where: { cart: { id: mockCart.id } } });
    expect(cartRepo.update).toHaveBeenCalledWith(mockCart.id, {
      totalAmount: 35,
      totalItems: 3,
    });
    expect(cartRepo.findOne).toHaveBeenCalledWith({
      where: { id: mockCart.id },
      relations: ['items'],
    });
    expect(result).toEqual(updatedCart);
  });
});
