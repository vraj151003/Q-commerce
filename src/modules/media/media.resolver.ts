import { Args, Field, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { MediaService } from './media.service';

@ObjectType()
class UploadResponse {
  @Field()
  url: string;

  @Field()
  publicId: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  originalName: string;

  @Field({ nullable: true })
  size: number;

  @Field({ nullable: true })
  format: string;

  @Field({ nullable: true })
  sourceUrl: string;
}

@Resolver()
export class MediaResolver {
  constructor(private mediaService: MediaService) {}

  @Mutation(() => UploadResponse)
  uploadMedia(@Args('filePath') filePath: string) {
    return this.mediaService.uploadFile(filePath);
  }

  @Mutation(() => String)
  deleteFile(@Args('url') url: string) {
    return this.mediaService.deleteFile(url);
  }
}
