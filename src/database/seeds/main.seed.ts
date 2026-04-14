import { PermissionSeed } from './permission.seed';
import { UserSeed } from './user.seed';
import { CategorySeed } from './category.seed';
import { SubCategorySeed } from './subcategory.seed';
import { ShopSeed } from './shop.seed';
import { ProductSeed } from './product.seed';
import { DeliveryProfileSeed } from './delivery-profile.seed';

async function runSeeds() {
  try {
    const permissionSeed = new PermissionSeed();
    const userSeed = new UserSeed();
    const categorySeed = new CategorySeed();
    const subCategorySeed = new SubCategorySeed();
    const shopSeed = new ShopSeed();
    const productSeed = new ProductSeed();
    const deliveryProfileSeed = new DeliveryProfileSeed();

    await permissionSeed.run();
    await userSeed.run();
    await categorySeed.run();
    await subCategorySeed.run();
    await shopSeed.run();
    await productSeed.run();
    await deliveryProfileSeed.run();

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

runSeeds();
