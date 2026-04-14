import { DataSource } from 'typeorm';
import { Category } from '../../modules/category/entity/category.entity';
import dataSource from '../../config/data-source';

export class CategorySeed {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = dataSource;
  }

  async run() {
    await this.dataSource.initialize();
    const categoryRepo = this.dataSource.getRepository(Category);

    const categories = [
      { name: 'Electronics', description: 'Electronic devices and gadgets' },
      { name: 'Clothing', description: 'Fashion and apparel for all ages' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
      { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
      { name: 'Books & Media', description: 'Books, movies, music and digital media' },
      { name: 'Toys & Games', description: 'Toys, games and entertainment products' },
      { name: 'Health & Beauty', description: 'Personal care and beauty products' },
      { name: 'Food & Beverages', description: 'Groceries and specialty foods' },
      { name: 'Automotive', description: 'Car parts and accessories' },
      { name: 'Pet Supplies', description: 'Food and supplies for pets' },
      { name: 'Office Supplies', description: 'Stationery and office equipment' },
      { name: 'Jewelry & Accessories', description: 'Fine jewelry and fashion accessories' },
      { name: 'Baby & Kids', description: 'Products for babies and children' },
      { name: 'Tools & Hardware', description: 'Tools and hardware for DIY projects' },
      { name: 'Arts & Crafts', description: 'Art supplies and craft materials' },
    ];

    for (const categoryData of categories) {
      const existingCategory = await categoryRepo.findOne({
        where: { name: categoryData.name },
      });

      if (!existingCategory) {
        const category = categoryRepo.create(categoryData);
        await categoryRepo.save(category);
      }
    }

    await this.dataSource.destroy();
  }
}
