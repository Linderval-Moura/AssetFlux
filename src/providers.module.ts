import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

const awsProvider: Provider[] = [
  {
    provide: S3Client,
    useFactory: (configService: ConfigService) => {
      const config: S3ClientConfig = {
        region: 'us-east-1',
        endpoint: configService.get('S3_ENDPOINT'),
        forcePathStyle: true,
        credentials: {
          accessKeyId: configService.getOrThrow<string>('PROVIDER_ACCESS_KEY_ID'),
          secretAccessKey: configService.getOrThrow<string>('PROVIDER_SECRET_ACCESS_KEY'),
          sessionToken: configService.getOrThrow<string>('AWS_SESSION_TOKEN'),
        },
      };

      return new S3Client(config);
    },
    inject: [ConfigService],
  },
  {
    provide: DynamoDBClient,
    useFactory: (configService: ConfigService) => {
      const config: DynamoDBClientConfig = {
        region: 'us-east-1',
        credentials: {
          accessKeyId: configService.getOrThrow<string>('PROVIDER_ACCESS_KEY_ID'),
          secretAccessKey: configService.getOrThrow<string>('PROVIDER_SECRET_ACCESS_KEY'),
          sessionToken: configService.getOrThrow<string>('AWS_SESSION_TOKEN'),
        },
        endpoint: configService.getOrThrow<string>('DATABASE_URL'),
      };

      return new DynamoDBClient(config);
    },
    inject: [ConfigService],
  },
];

@Global()
@Module({
  providers: [...awsProvider],
  exports: [...awsProvider],
})

export class ProvidersModule {}