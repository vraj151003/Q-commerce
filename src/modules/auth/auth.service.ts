import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginInput } from './dto/login.input';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entity/users.entity';
import { RegisterInput } from './dto/register.input';
import { UpdateUserProfileInput } from './dto/update-user-profile.input';
import { Role } from '../roles/entity/roles.entity';
import { Permission } from '../permission/entity/permission.entity';
import { Otp } from '../otp/entity/otp.entity';
import { MailService } from '../../common/mail/mail.service';
import { OtpType } from 'src/common/constant/status';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { isUUID } from 'class-validator';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @InjectRepository(Otp)
    private otpRepo: Repository<Otp>,
    private jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(input: RegisterInput): Promise<User> {
    const existingUser = await this.userRepo.findOne({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    let role: Role | null | undefined = undefined;
    if (input.roleId) {
      if (!isUUID(input.roleId)) {
        throw new BadRequestException('Invalid role ID format. Use UUID.');
      }

      role = await this.roleRepo.findOne({
        where: { id: input.roleId },
      });
      if (!role) {
        throw new BadRequestException('Invalid role ID');
      }
    }

    const user = this.userRepo.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: hashedPassword,
      mobile: input.mobile,
      isVerified: false,
      role: role,
    });

    const savedUser = await this.userRepo.save(user);

    const otpCode = this.generateOtp();
    await this.otpRepo.save({
      email: savedUser.email,
      otp: otpCode,
      type: OtpType.REGISTER,
      isUsed: false,
    });

    await this.mailService.sendEmail(
      savedUser.email,
      'Verify OTP',
      `Your OTP is ${otpCode}`,
    );

    return savedUser;
  }

  async login(input: LoginInput) {
    const user = await this.userRepo.findOne({
      where: { email: input.email },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(input.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }
    const isAdmin = user.role?.name?.toLowerCase() === 'admin';
    const permissions = isAdmin
      ? (await this.permissionRepo.find()).map((permission) => permission.name)
      : (user.role?.permissions?.map((permission) => permission.name) ?? []);

    const payload = {
      userId: user.id,
      role: user.role?.name,
      permissions,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user,
    };
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepo.find();
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepo.remove(user);
  }

  async approveUser(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.adminApproved = true;
    return this.userRepo.save(user);
  }

  async getCurrentUser(userId: string): Promise<User> {
    return this.getUserById(userId);
  }

  async updateUserProfile(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<User> {
    const user = await this.getUserById(userId);

    if (input.firstName !== undefined) {
      user.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
      user.lastName = input.lastName;
    }
    if (input.mobile !== undefined) {
      user.mobile = input.mobile;
    }
    if (input.password) {
      user.password = await bcrypt.hash(input.password, 10);
    }

    // Email is intentionally not updatable from this API.
    return this.userRepo.save(user);
  }

  async verifyOtp(input: VerifyOtpInput): Promise<boolean> {
    const record = await this.otpRepo.findOne({
      where: {
        email: input.email,
        otp: input.otp,
        type: OtpType.REGISTER,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      throw new BadRequestException('Invalid OTP');
    }

    const user = await this.userRepo.findOne({ where: { email: input.email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isVerified = true;
    await this.userRepo.save(user);

    record.isUsed = true;
    await this.otpRepo.save(record);

    return true;
  }

  async forgotpassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    const otpCode = this.generateOtp();

    await this.otpRepo.save({
      email,
      otp: otpCode,
      type: OtpType.FORGOT_PASSWORD,
      isUsed: false,
    });

    await this.mailService.sendEmail(
      email,
      'Reset Password OTP',
      `Your OTP for resetting password is ${otpCode}`,
    );
    return true;
  }

  async resetPassword(input: ResetPasswordInput) {
    const record = await this.otpRepo.findOne({
      where: {
        email: input.email,
        otp: input.otp,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      throw new BadRequestException('Invalid OTP');
    }

    const user = await this.userRepo.findOne({
      where: { email: input.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(input.newPassword, 10);
    await this.userRepo.save(user);
    record.isUsed = true;
    await this.otpRepo.save(record);

    return true;
  }

  async resendOtp(email: string) {
    const otpCode = this.generateOtp();

    await this.otpRepo.save({
      email,
      otp: otpCode,
      type: OtpType.REGISTER,
    });

    await this.mailService.sendEmail(
      email,
      'Resend OTP',
      `Your new OTP is ${otpCode}`,
    );
    return true;
  }
}
