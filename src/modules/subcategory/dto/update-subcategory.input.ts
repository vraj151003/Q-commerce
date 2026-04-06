import { Field, InputType } from '@nestjs/graphql';

// update-subcategory.input.ts
@InputType()
export class UpdateSubCategoryInput {
  @Field()
  id: string;

  @Field()
  name: string;
}
