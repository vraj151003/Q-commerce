// src/auth/dto/auth.response.ts
import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../users/entity/users.entity';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}
