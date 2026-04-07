import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PermissionSeed } from './permission.seed';
import { UserSeed } from './user.seed';

async function runSeeds() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const permissionSeed = app.get(PermissionSeed);
  const userSeed = app.get(UserSeed);

  await permissionSeed.run();

  await userSeed.run();

  await app.close();
  process.exit(0);
}

runSeeds().catch((error) => {
  console.error('Error running seeds:', error);
  process.exit(1);
});
