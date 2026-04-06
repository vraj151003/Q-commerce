import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Shop } from './entity/shop.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShopInput } from './dto/create-shop.input';
import { UpdateShopInput } from './dto/update-shop.input';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private shopRepo: Repository<Shop>,
  ) {}

  createShop(input: CreateShopInput, user: any) {
    const shop = this.shopRepo.create({
      ...input,
      sellerId: user.userId,
    });
    return this.shopRepo.save(shop);
  }

  findAllShops(user: any) {
    return this.shopRepo.find({
      where: { sellerId: user.userId },
    });
  }

  async findOneShop(id: string, user: any) {
    const shop = await this.shopRepo.findOne({
      where: { id },
    });
    if (!shop) {
      throw new NotFoundException('shop not found');
    }

    if (shop.sellerId !== user.userId) {
      throw new ForbiddenException('Access Denied');
    }

    return shop;
  }

  async updateShop(input: UpdateShopInput, user: any) {
    const shop = await this.findOneShop(input.id, user);

    Object.assign(shop, input);
    return this.shopRepo.save(shop);
  }

  async deleteShop(id: string, user: any) {
    const shop = await this.findOneShop(id, user);
    await this.shopRepo.remove(shop);
    return true;
  }
}
