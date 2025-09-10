import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/interfaces/user.interface';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

const mockUser: User = {
  userId: 'mock-doUser-id',
  name: 'User is The-name',
  email: 'o-chamado@panicmail.com',
  password: 'hashed-in-p@ssw0rd7',
};

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(() => 'mock-token'),
};

jest.mock('bcryptjs', () => ({
  ...jest.requireActual('bcryptjs'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate and return a user without password if credentials are correct', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(mockUser.email, 'Essa@SenhaÉ999,9');

      expect(result).toEqual({
        userId: mockUser.userId,
        name: mockUser.name,
        email: mockUser.email,
      });
    });

    it('should return null if user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const result = await service.validateUser('procura-se-email@foundmail.com', 'Essa@SenhaÉ999,9');

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(mockUser.email, '1aSenh@Pseud0Cert4');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token if login is successful', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      const loginDto: LoginDto = { email: mockUser.email, password: 'Essa@SenhaÉ999,9' };
      
      const result = await service.login(loginDto);

      expect(result).toEqual({ access_token: 'mock-token' });
    });

    it('should throw UnauthorizedException if validateUser returns null', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);
      const loginDto: LoginDto = { email: 'procura-se-email@foundmail.com', password: 'Essa@SenhaÉ999,9' };
      
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should call usersService.create and return the new user', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);
      const createUserDto: CreateUserDto = {
        name: mockUser.name,
        email: mockUser.email,
        password: 'Essa@SenhaÉ999,9',
      };

      const result = await service.register(createUserDto);
      
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });
});