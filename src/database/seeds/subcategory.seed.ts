import { DataSource } from 'typeorm';
import { SubCategory } from '../../modules/subcategory/entity/subcategory.entity';
import { Category } from '../../modules/category/entity/category.entity';
import dataSource from '../../config/data-source';

export class SubCategorySeed {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = dataSource;
  }

  async run() {
    await this.dataSource.initialize();
    const subCategoryRepo = this.dataSource.getRepository(SubCategory);
    const categoryRepo = this.dataSource.getRepository(Category);

    const categories = await categoryRepo.find();
    const categoryMap = new Map(categories.map(cat => [cat.name, cat]));

    const subCategories = [
      // Electronics
      { name: 'Smartphones', categoryName: 'Electronics' },
      { name: 'Laptops', categoryName: 'Electronics' },
      { name: 'Tablets', categoryName: 'Electronics' },
      { name: 'Headphones', categoryName: 'Electronics' },
      { name: 'Smart Watches', categoryName: 'Electronics' },
      
      // Clothing
      { name: 'Men\'s T-Shirts', categoryName: 'Clothing' },
      { name: 'Women\'s Dresses', categoryName: 'Clothing' },
      { name: 'Kids Clothing', categoryName: 'Clothing' },
      { name: 'Shoes', categoryName: 'Clothing' },
      { name: 'Accessories', categoryName: 'Clothing' },
      
      // Home & Garden
      { name: 'Furniture', categoryName: 'Home & Garden' },
      { name: 'Kitchen Appliances', categoryName: 'Home & Garden' },
      { name: 'Garden Tools', categoryName: 'Home & Garden' },
      { name: 'Home Decor', categoryName: 'Home & Garden' },
      
      // Sports & Outdoors
      { name: 'Fitness Equipment', categoryName: 'Sports & Outdoors' },
      { name: 'Camping Gear', categoryName: 'Sports & Outdoors' },
      { name: 'Sports Clothing', categoryName: 'Sports & Outdoors' },
      
      // Books & Media
      { name: 'Fiction Books', categoryName: 'Books & Media' },
      { name: 'Educational Books', categoryName: 'Books & Media' },
      { name: 'Movies & TV Shows', categoryName: 'Books & Media' },
      
      // Health & Beauty
      { name: 'Skincare Products', categoryName: 'Health & Beauty' },
      { name: 'Makeup', categoryName: 'Health & Beauty' },
      { name: 'Personal Care', categoryName: 'Health & Beauty' },
      
      // Toys & Games
      { name: 'Board Games', categoryName: 'Toys & Games' },
      { name: 'Educational Toys', categoryName: 'Toys & Games' },
    ];

    for (const subCategoryData of subCategories) {
      const existingSubCategory = await subCategoryRepo.findOne({
        where: { name: subCategoryData.name },
        relations: ['category'],
      });

      if (!existingSubCategory) {
        const category = categoryMap.get(subCategoryData.categoryName);
        if (category) {
          const subCategory = subCategoryRepo.create({
            name: subCategoryData.name,
            category: category,
          });
          await subCategoryRepo.save(subCategory);
        }
      }
    }

    await this.dataSource.destroy();
  }
}
