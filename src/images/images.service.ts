import { Injectable, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, QueryCommand, DeleteItemCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { PassThrough } from 'stream';
import { stringify } from 'csv-stringify';
import { Options as StringifyOptions } from 'csv-stringify';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Image } from './interfaces/image.interface';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class ImagesService {
  private readonly s3BucketName: string;
  private readonly s3AssetUrl: string;
  private readonly dynamoDbTableName = 'Images';

  constructor(
    @Inject(S3Client) private s3Client: S3Client,
    @Inject(DynamoDBClient) private dynamoDbClient: DynamoDBClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.s3BucketName = this.configService.getOrThrow<string>('PROVIDER_BUCKET');
    this.s3AssetUrl = this.configService.getOrThrow<string>('S3_ASSET_URL');
  }

  async uploadFile(userId: string, file: Express.Multer.File): Promise<{ url: string }> {
    try {
      const uniqueFileName = `${uuid()}-${file.originalname}`;

      const s3Command = new PutObjectCommand({
        Bucket: this.s3BucketName,
        Key: uniqueFileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(s3Command);

      const imageUrl = `${this.s3AssetUrl}/${this.s3BucketName}/${uniqueFileName}`;

      const newImage: Image = {
        imageId: uuid(),
        userId,
        name: file.originalname,
        s3Key: uniqueFileName,
        url: imageUrl,
        createdAt: new Date().toISOString(),
      };

      const dynamoDbCommand = new PutItemCommand({
        TableName: this.dynamoDbTableName,
        Item: marshall(newImage, { removeUndefinedValues: true }),
      });

      await this.dynamoDbClient.send(dynamoDbCommand);

      await this.cacheManager.del(`user_images:${userId}`);

      return { url: imageUrl };
    } catch (error) {
      console.error('Failed to upload file to AWS services:', error);
      throw new InternalServerErrorException('An error occurred while uploading your image.');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listImages(userId: string, name?: string, page: number = 1, limit: number = 10): Promise<Image[]> {
    const cacheKey = `user_images:${userId}`;

    if (!name) {
      const cachedImages = await this.cacheManager.get<Image[]>(cacheKey);

      if (cachedImages) {        
        return cachedImages;
      }
    }

    try {
      const params: {
        TableName: string;
        KeyConditionExpression: string;
        ExpressionAttributeValues: { [key: string]: AttributeValue };
        ScanIndexForward: boolean;
        FilterExpression?: string;
        ExpressionAttributeNames?: { [key: string]: string };
      } = {
        TableName: this.dynamoDbTableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId },
        },
        ScanIndexForward: false,
      };

      if (name) {
        params.FilterExpression = 'begins_with(#name, :name)';
        params.ExpressionAttributeNames = { '#name': 'name' };
        params.ExpressionAttributeValues[':name'] = { S: name };
      }

      const result = await this.dynamoDbClient.send(new QueryCommand(params));
      const images = result.Items?.map(item => unmarshall(item) as Image) || [];

      if (!name) {
        await this.cacheManager.set(cacheKey, images);
      }

      return images; 
    } catch (error) {
      console.error('Error listing images in DynamoDB:', error);
      throw new InternalServerErrorException('The image list could not be loaded.');
    }
  }

  async deleteImage(userId: string, name: string) {
    try {
      const queryCommand = new QueryCommand({
        TableName: this.dynamoDbTableName,
        IndexName: 'userId-name-index',
        KeyConditionExpression: 'userId = :userId AND #name = :name',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: {
          ':userId': { S: userId },
          ':name': { S: name },
        },
      });

      const { Items } = await this.dynamoDbClient.send(queryCommand);
      
      if (!Items || Items.length === 0) {
        throw new NotFoundException('Image not found or you do not have permission to delete it.');
      }

      const image = unmarshall(Items[0]) as Image;

      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.s3BucketName,
        Key: image.s3Key,
      }));

      await this.dynamoDbClient.send(new DeleteItemCommand({
        TableName: this.dynamoDbTableName,
        Key: marshall({
          userId: image.userId,
          createdAt: image.createdAt,
        }),
      }));

      await this.cacheManager.del(`user_images:${userId}`);
      
      return { message: 'Image deleted successfully' };    
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error deleting image:', error);
      throw new InternalServerErrorException('Internal error while trying to delete the image.');
    }
  }

  async exportImagesToCsv(userId: string): Promise<PassThrough> {
    try {
      const queryCommand = new QueryCommand({
        TableName: this.dynamoDbTableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId },
        },
      });

      const { Items } = await this.dynamoDbClient.send(queryCommand);

      const stringifier = stringify({
        header: true,
        columns: [
          { key: 'name', header: 'Name' },
          { key: 'url', header: 'Remote URL' },
          { key: 'createdAt', header: 'Creation Date' },
        ],
      } as StringifyOptions);

      const passThrough = new PassThrough();
      stringifier.pipe(passThrough);

      if (Items) { 
        const data = Items.map(item => unmarshall(item) as Image);
        data.forEach(row => stringifier.write(row));
      }
      
      stringifier.end();

      return passThrough;
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw new InternalServerErrorException('Could not generate the CSV report.');
    }
  }
}