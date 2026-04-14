import { DataSource } from 'typeorm';
import { Shop } from '../../modules/shop/entity/shop.entity';
import { User } from '../../modules/users/entity/users.entity';
import dataSource from '../../config/data-source';

export class ShopSeed {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = dataSource;
  }

  async run() {
    await this.dataSource.initialize();
    const shopRepo = this.dataSource.getRepository(Shop);

    // Create shops without seller dependency for now
    const shops = [
      {
        shopName: 'Tech Store',
        addressLine1: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        country: 'India',
        gstNumber: '27AAAPL1234C1ZY',
        panNumber: 'AAAPL1234C',
        accountHolderName: 'John Seller',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
      },
      {
        shopName: 'Fashion Hub',
        addressLine1: '456 Park Avenue',
        city: 'Delhi',
        state: 'Delhi',
        pinCode: '110001',
        country: 'India',
        gstNumber: '07AAAPL5678B2ZX',
        panNumber: 'AAAPL5678B',
        accountHolderName: 'Jane Store',
        accountNumber: '9876543210',
        ifscCode: 'ICIC0001234',
        bankName: 'ICICI Bank',
      },
    ];

    for (const shopData of shops) {
      const existingShop = await shopRepo.findOne({
        where: { shopName: shopData.shopName },
      });

      if (!existingShop) {
        const shop = shopRepo.create(shopData);
        await shopRepo.save(shop);
      }
    }

    await this.dataSource.destroy();
  }
}
