import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { ProvidersModule } from '../providers.module';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST'),
            port: +configService.get<number>('REDIS_PORT'),
          },
          ttl: +configService.getOrThrow('REDIS_TTL'),
        }),
      }),
      inject: [ConfigService],
    }),
    
    ProvidersModule, 
    UsersModule,
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}