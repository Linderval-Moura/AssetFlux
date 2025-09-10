import { Test, TestingModule } from '@nestjs/testing';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { User } from '../users/interfaces/user.interface';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PassThrough } from 'stream';

const mockUser: User = {
  userId: 'One-user-id',
  name: 'One User',
  email: 't-de-teimoso@exmachinemail.com',
};

const mockImagesService = {
  uploadFile: jest.fn(),
  listImages: jest.fn(),
  deleteImage: jest.fn(),
  exportImagesToCsv: jest.fn(),
};

describe('ImagesController', () => {
  let controller: ImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [
        {
          provide: ImagesService,
          useValue: mockImagesService,
        },
      ],
    }).compile();

    controller = module.get<ImagesController>(ImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should call imagesService.uploadFile and return the URL', async () => {
      const mockFile = { originalname: 'test.jpg' } as Express.Multer.File;
      mockImagesService.uploadFile.mockResolvedValue({ url: 'mock-url' });
      
      const result = await controller.uploadFile(mockUser, mockFile);
      
      expect(mockImagesService.uploadFile).toHaveBeenCalledWith(mockUser.userId, mockFile);
      expect(result).toEqual({ url: 'mock-url' });
    });

    it('should throw HttpException if user is not authenticated', async () => {
      const mockFile = { originalname: 'test.jpg' } as Express.Multer.File;

      await expect(controller.uploadFile(null, mockFile))
      .rejects.toThrow(
        new HttpException('User not authenticated.', HttpStatus.FORBIDDEN)
      );
    });
  });

  describe('listImages', () => {
    it('should call imagesService.listImages and return the list of images', async () => {
      const mockImages = [{ name: 'test.jpg' }];
      mockImagesService.listImages.mockResolvedValue(mockImages);
      
      const result = await controller.listImages(mockUser, 'test', 1, 10);
      
      expect(mockImagesService.listImages).toHaveBeenCalledWith(mockUser.userId, 'test', 1, 10);
      expect(result).toEqual(mockImages);
    });

    it('should throw HttpException if user is not authenticated', async () => {
      await expect(controller.listImages(null, 'test', 1, 10))
      .rejects.toThrow(
        new HttpException('User not authenticated.', HttpStatus.FORBIDDEN)
      );
    });
  });

  describe('deleteImage', () => {
    it('should call imagesService.deleteImage and return success message', async () => {
      mockImagesService.deleteImage.mockResolvedValue({ message: 'Image deleted successfully' });
      
      const result = await controller.deleteImage(mockUser, 'test.jpg');
      
      expect(mockImagesService.deleteImage).toHaveBeenCalledWith(mockUser.userId, 'test.jpg');
      expect(result).toEqual({ message: 'Image deleted successfully' });
    });

    it('should throw HttpException if user is not authenticated', async () => {
      await expect(controller.deleteImage(null, 'test.jpg'))
      .rejects.toThrow(
        new HttpException('User not authenticated.', HttpStatus.FORBIDDEN)
      );
    });
  });

  describe('exportImages', () => {
    it('should call imagesService.exportImagesToCsv and set response headers', async () => {
      const mockCsvStream = new PassThrough();
      mockImagesService.exportImagesToCsv.mockResolvedValue(mockCsvStream);
      const mockRes = {
        header: jest.fn(),
        send: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      
      await controller.exportImages(mockUser, mockRes);
      
      expect(mockImagesService.exportImagesToCsv).toHaveBeenCalledWith(mockUser.userId);
      expect(mockRes.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.header).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="images.csv"');
      expect(mockRes.send).toHaveBeenCalledWith(mockCsvStream);
    });
  });
});