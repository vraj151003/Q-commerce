import { Field, InputType } from '@nestjs/graphql';

// create-subcategory.input.ts
@InputType()
export class CreateSubCategoryInput {
  @Field()
  name: string;

  @Field()
  categoryId: string;
}

// update-subcategory.input.ts
@InputType()
export class UpdateSubCategoryInput {
  @Field()
  id: string;

  @Field()
  name: string;
}
