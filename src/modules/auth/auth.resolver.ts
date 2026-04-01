import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from '../users/entity/users.entity';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './dto/auth.response';
import { LoginInput } from './dto/login.input';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateUserProfileInput } from './dto/update-user-profile.input';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => User)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => AuthResponse)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Query(() => [User])
  async getAllUserProfiles() {
    return this.authService.getAllUsers();
  }

  @Query(() => User)
  async getUserProfileById(@Args('id') id: string) {
    return this.authService.getUserById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  async getCurrentUserProfile(@Context() context: any) {
    const user = context.req.user;
    return this.authService.getCurrentUser(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => User)
  async updateUserProfile(
    @Context() context: any,
    @Args('input') input: UpdateUserProfileInput,
  ) {
    const user = context.req.user;
    return this.authService.updateUserProfile(user.userId, input);
  }
}
