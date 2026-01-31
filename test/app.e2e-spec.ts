import * as dotenv from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3';


dotenv.config({ path: '.env.test' });

process.env.AWS_SDK_LOAD_CONFIG = '1';

describe('ImagesController (e2e)', () => {

  jest.setTimeout(30000);

  let app: INestApplication;
  let accessToken: string;
  let s3Client: S3Client;

  const bucketName = process.env.PROVIDER_BUCKET || 'bucket-linderval-compassstore';

  beforeAll(async () => {
 
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));
    
    await app.init();

    s3Client = app.get(S3Client);
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`✅ Bucket ${bucketName} preparado para testes.`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      console.log(`ℹ️ Bucket ${bucketName} já existe ou está pronto.`);
    }

    const jwtService = app.get(JwtService);
    const testSecret = process.env.JWT_SECRET || 'test-secret-key';

    const payload = { 
      email: 'test@example.com', 
      userId: 'user-id-123',
      sub: 'user-id-123'
    };

    accessToken = jwtService.sign(payload, { secret: testSecret });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/images (GET)', () => {
    it('should return 401 if no token is provided', () => {
      return request(app.getHttpServer())
        .get('/images')
        .expect(401);
    });

    it('should return 200 with list of images', () => {
      return request(app.getHttpServer())
        .get('/images')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('/images/upload (POST)', () => {
    it('should fail if no file is uploaded (Pipe validation)', () => {
      return request(app.getHttpServer())
        .post('/images/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should upload a file successfully', async () => {
      const buffer = Buffer.from('fake-image-content-e2e');
      
      const response = await request(app.getHttpServer())
        .post('/images/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', buffer, 'test-image.png');

      expect(response.status).toBe(201);
    }, 20000);
  });

  describe('/images/:name (DELETE)', () => {
    it('should delete the uploaded image by name', async () => {
      return request(app.getHttpServer())
        .delete('/images/test-image.png')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('/images/export (GET)', () => {
    it('should export images to CSV', () => {
      return request(app.getHttpServer())
        .get('/images/export')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect('Content-Type', /text\/csv/)
        .expect(200);
    });
  });
});