// src/config/cloudinary.config.ts
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

cloudinary.config({
  cloud_name: configService.get<string>('database.cloudinary_cloud_name'),
  api_key: configService.get<string>('database.cloudinary_api_key'),
  api_secret: configService.get<string>('database.cloudinary_api_secret'),
});

export default cloudinary;
