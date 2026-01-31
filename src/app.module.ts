import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ImagesModule } from './images/images.module';
import { ProvidersModule } from './providers.module';
import { ProvidersMockModule } from './providers.mock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    AuthModule,
    UsersModule,
    ImagesModule,
    process.env.NODE_ENV === 'test' ? ProvidersMockModule : ProvidersModule,
  ],
})
export class AppModule {}