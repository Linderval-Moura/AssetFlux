import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import { User } from './interfaces/user.interface';
import * as bcrypt from 'bcryptjs';

const mockUser: User = {
  userId: 'mock-doUser-id',
  name: 'Test more User',
  email: 'testado-sim@expmail.com',
  password: 'symple-p@ssw0rd7',
};

const mockCreateUserDto: CreateUserDto = {
  name: 'Test more User',
  email: 'testado-sim@expmail.com',
  password: 'symple-p@ssw0rd7',
};

const mockUsersRepository = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('symple-p@ssw0rd7')),
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-doUser-id'),
}));

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and return it', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.create.mockResolvedValue(mockUser);
      
      const result = await service.create(mockCreateUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('symple-p@ssw0rd7', 10);
      expect(mockUsersRepository.create).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(ConflictException);

      expect(mockUsersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should find and return a user by email', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      const result = await service.findByEmail(mockUser.email);

      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should find and return a user by ID', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      const result = await service.findById(mockUser.userId);

      expect(mockUsersRepository.findById).toHaveBeenCalledWith(mockUser.userId);
      expect(result).toEqual(mockUser);
    });
  });
});