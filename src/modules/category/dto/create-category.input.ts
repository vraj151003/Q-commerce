import { Field, InputType } from '@nestjs/graphql';

// create-category.input.ts
@InputType()
export class CreateCategoryInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;
}
