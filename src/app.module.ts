import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ImagesModule } from './images/images.module';
import { ProvidersModule } from './providers.module';
import { ProvidersMockModule } from './providers.mock.module';

const imports = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }),
  AuthModule,
  UsersModule,
  ImagesModule,
];

if (process.env.NODE_ENV === 'test') {
  imports.push(ProvidersMockModule);
} else {
  imports.push(ProvidersModule);
}

@Module({
  imports: imports,
})
export class AppModule {}