import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaResolver } from './media.resolver';
import { CloudinaryModule } from '../../config/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [MediaService, MediaResolver],
  exports: [MediaService],
})
export class MediaModule {}
