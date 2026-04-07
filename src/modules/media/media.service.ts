import { BadRequestException, Injectable } from '@nestjs/common';
import { CloudinaryService } from '../../config/cloudinary.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MediaService {
  constructor(private cloudinaryService: CloudinaryService) {}

  // File size limits in bytes
  private readonly FILE_SIZE_LIMITS = {
    image: 5 * 1024 * 1024, // 5MB
    video: 100 * 1024 * 1024, // 100MB
    pdf: 10 * 1024 * 1024, // 10MB
  };

  // Supported formats
  private readonly SUPPORTED_FORMATS = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    pdf: ['pdf'],
  };

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private getFileTypeFromExtension(
    extension: string,
  ): 'image' | 'video' | 'pdf' | 'raw' {
    if (this.SUPPORTED_FORMATS.image.includes(extension)) return 'image';
    if (this.SUPPORTED_FORMATS.video.includes(extension)) return 'video';
    if (this.SUPPORTED_FORMATS.pdf.includes(extension)) return 'pdf';
    return 'raw';
  }

  private validateLocalFile(filePath: string): {
    size: number;
    filetype: 'image' | 'video' | 'pdf' | 'raw';
    filename: string;
    extension: string;
  } {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException(
          'File does not exist at the specified path',
        );
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const filename = path.basename(filePath);
      const extension = this.getFileExtension(filename);

      // Check if file type is supported
      if (
        !this.SUPPORTED_FORMATS.image.includes(extension) &&
        !this.SUPPORTED_FORMATS.video.includes(extension) &&
        !this.SUPPORTED_FORMATS.pdf.includes(extension)
      ) {
        throw new BadRequestException(
          `Unsupported file format. Supported formats: ${[...this.SUPPORTED_FORMATS.image, ...this.SUPPORTED_FORMATS.video, ...this.SUPPORTED_FORMATS.pdf].join(', ')}`,
        );
      }

      // Check file size
      const filetype = this.getFileTypeFromExtension(extension);
      const maxSize = this.FILE_SIZE_LIMITS[filetype];
      if (stats.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        throw new BadRequestException(
          `File size exceeds ${maxSizeMB}MB limit for ${filetype} files. Current size: ${Math.round(stats.size / (1024 * 1024))}MB`,
        );
      }

      return {
        size: stats.size,
        filetype,
        filename,
        extension,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error accessing the local file');
    }
  }

  async uploadFile(filePath: string) {
    // Validate local file
    const fileInfo = this.validateLocalFile(filePath);
    const { size, filetype, filename, extension } = fileInfo;

    // Determine resource type for Cloudinary
    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    if (filetype === 'image') resourceType = 'image';
    if (filetype === 'video') resourceType = 'video';
    if (filetype === 'pdf') resourceType = 'raw';

    const cloudinary = this.cloudinaryService.getCloudinary();

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        {
          resource_type: resourceType,
          folder: 'media',
          // Add format-specific options
          ...(filetype === 'image' && {
            quality: 'auto:good',
            fetch_format: 'auto',
          }),
          ...(filetype === 'video' && {
            quality: 'auto',
            chunk_size: 6000000,
          }),
        },
        (err, result) => {
          if (err) return reject(err);
          resolve({
            url: result?.secure_url,
            publicId: result?.public_id, // Use exact publicId from Cloudinary
            type: resourceType,
            originalName: filename,
            size: size,
            format: extension,
            sourceUrl: filePath, // Include original file path for reference
          });
        },
      );
    });
  }

  async deleteFile(urlOrPublicId: string) {
    const cloudinary = this.cloudinaryService.getCloudinary();

    let publicId: string;
    let resourceType: 'image' | 'video' | 'raw' = 'image';

    // Check if input is a URL or just a publicId
    if (urlOrPublicId.startsWith('http')) {
      // It's a URL - extract publicId from it

      const urlParts = urlOrPublicId.split('/');
      const mediaIndex = urlParts.indexOf('media');

      if (mediaIndex === -1 || mediaIndex + 1 >= urlParts.length) {
        throw new BadRequestException(
          'Invalid Cloudinary URL format - media folder not found',
        );
      }

      // Get publicId INCLUDING the 'media' folder (Cloudinary stores it this way)
      publicId = urlParts.slice(mediaIndex).join('/');
      publicId = publicId.replace(/\.[^/.]+$/, ''); // Remove extension

      if (urlOrPublicId.includes('/video/')) resourceType = 'video';
      if (urlOrPublicId.includes('/raw/')) resourceType = 'raw';
    } else {
      // It's already a publicId - use it directly
      publicId = urlOrPublicId;

      // If publicId doesn't start with 'media/', add it
      if (!publicId.startsWith('media/')) {
        publicId = 'media/' + publicId;
      }

      // Try to determine resource type from publicId (basic heuristic)
      if (
        publicId.includes('video') ||
        publicId.includes('mp4') ||
        publicId.includes('avi')
      ) {
        resourceType = 'video';
      } else if (publicId.includes('pdf') || publicId.includes('document')) {
        resourceType = 'raw';
      }
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      // Cloudinary returns { result: "ok" } or { result: "not found" }
      // Return the result string for GraphQL
      if (result.result === 'ok') {
        return 'File deleted successfully';
      } else if (result.result === 'not found') {
        return 'File not found';
      } else {
        return 'Unknown error occurred';
      }
    } catch (error) {
      console.error('Cloudinary destroy error:', error);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }
}
