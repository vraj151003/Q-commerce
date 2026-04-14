import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entity/cart.entity';
import { CartItem } from './entity/cart-item.entity';
import { Product } from '../products/entity/product.entity';
import { Repository } from 'typeorm';
import { AddToCartInput } from './dto/add-item-input';

type AuthUser = {
  userId: string;
};

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private itemRepo: Repository<CartItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartRepo.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: ['items', 'user'],
    });

    if (!cart) {
      const newCart = this.cartRepo.create({
        user: { id: userId },
      });
      await this.cartRepo.save(newCart);
      // Fetch again to get the user relation
      cart = await this.cartRepo.findOne({
        where: { user: { id: userId }, isActive: true },
        relations: ['items', 'user'],
      });
    }

    return cart!;
  }

  async addToCart(input: AddToCartInput, user: AuthUser) {
    // Check product stock
    const product = await this.productRepo.findOne({
      where: { id: input.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isAvailable) {
      throw new BadRequestException('Product is not available');
    }

    const cart = await this.getCart(user.userId);

    let item = await this.itemRepo.findOne({
      where: {
        cart: { id: cart.id },
        productId: input.productId,
      },
    });

    const newQuantity = item ? item.quantity + input.quantity : input.quantity;

    if (newQuantity > product.stockQuantity) {
      throw new BadRequestException(
        `Requested quantity (${newQuantity}) exceeds available stock (${product.stockQuantity})`
      );
    }

    if (item) {
      item.quantity += input.quantity;
      item.totalPrice = item.quantity * item.price;
    } else {
      item = this.itemRepo.create({
        productId: input.productId,
        quantity: input.quantity,
        price: input.price,
        totalPrice: input.quantity * input.price,
        cart,
      });
    }

    await this.itemRepo.save(item);

    return this.recalculateCart(cart.id);
  }

  async updateItem(productId: string, quantity: number, user: AuthUser) {
    // Check product stock
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isAvailable) {
      throw new BadRequestException('Product is not available');
    }

    if (quantity > product.stockQuantity) {
      throw new BadRequestException(
        `Requested quantity (${quantity}) exceeds available stock (${product.stockQuantity})`
      );
    }

    const cart = await this.getCart(user.userId);

    const item = await this.itemRepo.findOne({
      where: { productId, cart: { id: cart.id } },
    });

    if (!item) throw new NotFoundException('Item not found');

    item.quantity = quantity;
    item.totalPrice = quantity * item.price;

    await this.itemRepo.save(item);

    return this.recalculateCart(cart.id);
  }

  async removeItem(itemId: number, user: AuthUser) {
    const cart = await this.getCart(user.userId);

    const item = await this.itemRepo.findOne({
      where: { id: itemId, cart: { id: cart.id } },
    });

    if (!item) throw new NotFoundException('Item not found');

    await this.itemRepo.remove(item);

    return this.recalculateCart(cart.id);
  }

  async clearCart(user: AuthUser) {
    const cart = await this.getCart(user.userId);

    await this.itemRepo.delete({ cart: { id: cart.id } });

    cart.totalAmount = 0;
    cart.totalItems = 0;

    return this.cartRepo.save(cart);
  }

  async getMyCart(user: AuthUser) {
    return this.getCart(user.userId);
  }

  async recalculateCart(cartId: number) {
    const items = await this.itemRepo.find({
      where: { cart: { id: cartId } },
    });

    const totalAmount = items.reduce((sum, i) => sum + Number(i.totalPrice), 0);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

    await this.cartRepo.update(cartId, {
      totalAmount,
      totalItems,
    });

    return this.cartRepo.findOne({
      where: { id: cartId },
      relations: ['items', 'user'],
    });
  }
}
