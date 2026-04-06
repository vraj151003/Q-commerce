import { Field, InputType } from '@nestjs/graphql';

// update-category.input.ts
@InputType()
export class UpdateCategoryInput {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;
}
