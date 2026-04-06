import { Field, ID, ObjectType } from '@nestjs/graphql';
import { SubCategory } from '../../subcategory/entity/subcategory.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity('categories')
export class Category {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => [SubCategory], { nullable: true })
  @OneToMany(() => SubCategory, (sub) => sub.category)
  subCategories: SubCategory[];
}
