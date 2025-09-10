import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, QueryCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { ConfigService } from '@nestjs/config';
import { Image } from './interfaces/image.interface';
import { NotFoundException } from '@nestjs/common';
import { PassThrough } from 'stream';

const mockImage: Image = {
  imageId: 'mock-image-id',
  userId: 'One-user-id',
  name: 'test-image.jpg',
  s3Key: 'mock-s3-key-test-image.jpg',
  url: 'mock-url/test-image.jpg',
  createdAt: '2025-09-08T00:00:00.000Z',
};

const mockS3Client = {
  send: jest.fn(),
};

const mockDynamoDbClient = {
  send: jest.fn(),
};

const mockConfigService = {
   get: jest.fn((key: string) => {
    if (key === 'PROVIDER_BUCKET') {
      return 'mock-bucket-name';
    }
    return null;
  }),
  getOrThrow: jest.fn(() => 'mock-bucket-name'),
};

jest.mock('@aws-sdk/util-dynamodb', () => ({
  marshall: jest.fn(),
  unmarshall: jest.fn(),
}));

describe('ImagesService', () => {
  let service: ImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        {
          provide: S3Client,
          useValue: mockS3Client,
        },
        {
          provide: DynamoDBClient,
          useValue: mockDynamoDbClient,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file to S3 and save metadata to DynamoDB', async () => {
      const mockFile = { 
        originalname: 'test.jpg', 
        buffer: Buffer.from('mock-buffer'), 
        mimetype: 'image/jpeg' 
      } as Express.Multer.File;
      
      mockS3Client.send.mockResolvedValue({});
      mockDynamoDbClient.send.mockResolvedValue({});
      (marshall as jest.Mock).mockReturnValue({});

      const result = await service.uploadFile('One-user-id', mockFile);

      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      expect(mockDynamoDbClient.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
      expect(result.url).toContain('mock-bucket-name');
    });
  });

  describe('listImages', () => {
    it('should return a list of images from DynamoDB', async () => {
      mockDynamoDbClient.send.mockResolvedValue({ Items: [{ mock: 'item' }] });
      (unmarshall as jest.Mock).mockReturnValue(mockImage);
      
      const result = await service.listImages('One-user-id');

      expect(mockDynamoDbClient.send).toHaveBeenCalledWith(expect.any(QueryCommand));
      expect(result).toEqual([mockImage]);
    });

    it('should return an empty array if no images are found', async () => {
      mockDynamoDbClient.send.mockResolvedValue({ Items: [] });
      const result = await service.listImages('One-user-id');

      expect(result).toEqual([]);
    });
  });

  describe('deleteImage', () => {
    it('should delete image from S3 and DynamoDB if found', async () => {
      mockDynamoDbClient.send.mockResolvedValue({ Items: [{ mock: 'item' }] });
      mockS3Client.send.mockResolvedValue({});
      (unmarshall as jest.Mock).mockReturnValue(mockImage);

      const result = await service.deleteImage('One-user-id', 'test-image.jpg');

      expect(mockDynamoDbClient.send).toHaveBeenCalledWith(expect.any(QueryCommand));
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
      expect(mockDynamoDbClient.send).toHaveBeenCalledWith(expect.any(DeleteItemCommand));
      expect(result).toEqual({ message: 'Image deleted successfully' });
    });

    it('should throw NotFoundException if image is not found', async () => {
      mockDynamoDbClient.send.mockResolvedValue({ Items: [] });

      await expect(service.deleteImage('One-user-id', 'non-existent.jpg')).rejects.toThrow(NotFoundException);
      expect(mockS3Client.send).not.toHaveBeenCalled();
    });
  });

  describe('exportImagesToCsv', () => {
    it('should return a PassThrough stream for CSV export', async () => {
      mockDynamoDbClient.send.mockResolvedValue({ Items: [{ mock: 'item' }] });
      (unmarshall as jest.Mock).mockReturnValue(mockImage);

      const result = await service.exportImagesToCsv('One-user-id');

      expect(result).toBeInstanceOf(PassThrough);
    });

    it('should return an empty stream if no images are found', async () => {
        mockDynamoDbClient.send.mockResolvedValue({ Items: [] });
        const result = await service.exportImagesToCsv('One-user-id');
        
        expect(result).toBeInstanceOf(PassThrough);
    });
  });
});