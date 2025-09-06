import { Global, Module, Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const awsMockProvider: Provider[] = [
  {
    provide: S3Client,
    useValue: {
      send: () => Promise.resolve({
        ETag: 'mock-etag',
        VersionId: 'mock-version-id',
      }),
    },
  },
  {
    provide: DynamoDBClient,
    useValue: {
      send: () => Promise.resolve({
        Items: [],
        Item: {},
      }),
    },
  },
];

@Global()
@Module({
  providers: [...awsMockProvider],
  exports: [...awsMockProvider],
})

export class ProvidersMockModule {}