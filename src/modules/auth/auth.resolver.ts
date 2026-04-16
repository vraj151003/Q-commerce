import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import {
  UserResponse,
  AuthResponseWrapper,
  BooleanResponse,
} from '../../common/dto/api-response.dto';
import { LoginInput } from './dto/login.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Injectable } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';

@Injectable()
@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => UserResponse)
  async register(@Args('input') input: RegisterInput) {
    const user = await this.authService.register(input);
    return {
      statusCode: 201,
      message: 'User registered successfully',
      data: user,
    };
  }

  @Mutation(() => AuthResponseWrapper)
  async login(@Args('input') input: LoginInput) {
    const authResult = await this.authService.login(input);
    return {
      statusCode: 200,
      message: 'Login successful',
      data: authResult,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => BooleanResponse)
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
  @Mutation(() => UserResponse)
  async approveUser(@Args('id') id: string) {
    const user = await this.authService.approveUser(id);
    return {
      statusCode: 200,
      message: 'User approved successfully',
      data: user,
    };
  }

  @Mutation(() => BooleanResponse)
  async verifyOtp(@Args('input') input: VerifyOtpInput) {
    const result = await this.authService.verifyOtp(input);
    return {
      statusCode: 200,
      message: result ? 'OTP verified successfully' : 'OTP verification failed',
      data: result,
    };
  }

  @Mutation(() => BooleanResponse)
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

  @Mutation(() => BooleanResponse)
  async resetPassword(@Args('input') input: ResetPasswordInput) {
    const result = await this.authService.resetPassword(input);
    return {
      statusCode: 200,
      message: result ? 'Password reset successfully' : 'Password reset failed',
      data: result,
    };
  }

  @Mutation(() => BooleanResponse)
  async resendOtp(@Args('email') email: string) {
    const result = await this.authService.resendOtp(email);
    return {
      statusCode: 200,
      message: result ? 'OTP resent successfully' : 'Failed to resend OTP',
      data: result,
    };
  }
}
