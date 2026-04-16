import { Injectable } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AppService } from './app.service';

@Injectable()
@Resolver()
export class AppResolver {
  constructor(private readonly appService: AppService) {}
}
