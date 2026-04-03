import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from '../users/entity/users.entity';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './dto/auth.response';
import { LoginInput } from './dto/login.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateUserProfileInput } from './dto/update-user-profile.input';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => ApiResponse<User>)
  async register(@Args('input') input: RegisterInput) {
    const user = await this.authService.register(input);
    return {
      statusCode: 201,
      message: 'User registered successfully',
      data: user,
    };
  }

  @Mutation(() => ApiResponse<AuthResponse>)
  async login(@Args('input') input: LoginInput) {
    const authResult = await this.authService.login(input);
    return {
      statusCode: 200,
      message: 'Login successful',
      data: authResult,
    };
  }

  @Query(() => ApiResponse<User[]>)
  async getAllUserProfiles() {
    const users = await this.authService.getAllUsers();
    return {
      statusCode: 200,
      message: 'Users retrieved successfully',
      data: users,
    };
  }

  @Query(() => ApiResponse<User>)
  async getUserProfileById(@Args('id') id: string) {
    const user = await this.authService.getUserById(id);
    return {
      statusCode: 200,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => ApiResponse<User>)
  async getCurrentUserProfile(@Context() context: any) {
    const user = context.req.user;
    const currentUser = await this.authService.getCurrentUser(user.userId);
    return {
      statusCode: 200,
      message: 'Current user retrieved successfully',
      data: currentUser,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ApiResponse<User>)
  async updateUserProfile(
    @Context() context: any,
    @Args('input') input: UpdateUserProfileInput,
  ) {
    const user = context.req.user;
    const updatedUser = await this.authService.updateUserProfile(
      user.userId,
      input,
    );
    return {
      statusCode: 200,
      message: 'User profile updated successfully',
      data: updatedUser,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => ApiResponse<User>)
  async getUserById(@Args('id') id: string) {
    const user = await this.authService.getUserById(id);
    return {
      statusCode: 200,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => ApiResponse<boolean>)
  async deleteUser(@Args('id') id: string) {
    await this.authService.deleteUser(id);
    return {
      statusCode: 200,
      message: 'User deleted successfully',
      data: true,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => ApiResponse<User>)
  async approveUser(@Args('id') id: string) {
    const user = await this.authService.approveUser(id);
    return {
      statusCode: 200,
      message: 'User approved successfully',
      data: user,
    };
  }

  @Mutation(() => ApiResponse<boolean>)
  async verifyOtp(@Args('input') input: VerifyOtpInput) {
    const result = await this.authService.verifyOtp(input);
    return {
      statusCode: 200,
      message: result ? 'OTP verified successfully' : 'OTP verification failed',
      data: result,
    };
  }

  @Mutation(() => ApiResponse<boolean>)
  async forgotPassword(@Args('email') email: string) {
    const result = await this.authService.forgotpassword(email);
    return {
      statusCode: 200,
      message: result
        ? 'Password reset email sent'
        : 'Failed to send password reset email',
      data: result,
    };
  }

  @Mutation(() => ApiResponse<boolean>)
  async resetPassword(@Args('input') input: ResetPasswordInput) {
    const result = await this.authService.resetPassword(input);
    return {
      statusCode: 200,
      message: result ? 'Password reset successfully' : 'Password reset failed',
      data: result,
    };
  }

  @Mutation(() => ApiResponse<boolean>)
  async resendOtp(@Args('email') email: string) {
    const result = await this.authService.resendOtp(email);
    return {
      statusCode: 200,
      message: result ? 'OTP resent successfully' : 'Failed to resend OTP',
      data: result,
    };
  }
}
