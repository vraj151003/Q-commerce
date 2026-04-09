import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entity/cart.entity';
import { CartItem } from './entity/cart-item.entity';
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
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartRepo.findOne({
      where: { user: { id: userId }, isActive: true },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepo.create({
        user: { id: userId },
      });
      await this.cartRepo.save(cart);
    }

    return cart;
  }

  async addToCart(input: AddToCartInput, user: AuthUser) {
    const cart = await this.getCart(user.userId);

    let item = await this.itemRepo.findOne({
      where: {
        cart: { id: cart.id },
        productId: input.productId,
      },
    });

    if (item) {
      item.quantity += input.quantity;
      item.totalPrice = item.quantity * item.price;
    } else {
      item = this.itemRepo.create({
        ...input,
        totalPrice: input.quantity * input.price,
        cart,
      });
    }

    await this.itemRepo.save(item);

    return this.recalculateCart(cart.id);
  }

  async updateItem(productId: string, quantity: number, user: AuthUser) {
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
      relations: ['items'],
    });
  }
}
