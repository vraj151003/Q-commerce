import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

@InputType()
export class CreateTaxInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @Field()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
