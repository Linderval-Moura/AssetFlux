import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { User } from '../users/interfaces/user.interface';


const mockConfigService = {
  getOrThrow: jest.fn( () => 'mock-secret'),
};

const mockUserPayload: User = {
  userId: 'final-id-true',
  name: 'Outro User-True',
  email: 'yu-yu-do-grau@meuemaily.com',
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy(mockConfigService as unknown as ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate the user payload and return it', async () => {
    const request = {} as Request;

    const result = await strategy.validate(request, mockUserPayload);

    expect(result).toEqual(mockUserPayload);
  });
});