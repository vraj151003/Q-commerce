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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<User> {
    const existingUser = await this.userRepo.findOne({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = this.userRepo.create({
      ...input,
      password: hashedPassword,
    });

    return this.userRepo.save(user);
  }

  async login(input: LoginInput) {
    const user = await this.userRepo.findOne({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(input.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: user.id, email: user.email };

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
}
