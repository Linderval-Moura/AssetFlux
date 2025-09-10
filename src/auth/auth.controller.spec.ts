import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/interfaces/user.interface';

const mockUser: User = {
  userId: 'One-user-id',
  name: 'One User',
  email: 't-de-teimoso@exmachinemail.com',
};

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.register when registering a new user', async () => {
    mockAuthService.register.mockResolvedValue(mockUser);
    const createUserDto: CreateUserDto = {
      name: 'One User',
      email: 't-de-teimoso@exmachinemail.com',
      password: 'UmaSenhaM@isQ3,14',
    };
    const result = await controller.register(createUserDto);
    expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
    expect(result).toEqual(mockUser);
  });

  it('should call authService.login when a user logs in', async () => {
    mockAuthService.login.mockResolvedValue({ access_token: 'mock-token' });
    const loginDto: LoginDto = {
      email: 't-de-teimoso@exmachinemail.com',
      password: 'UmaSenhaM@isQ3,14',
    };
    const result = await controller.login(loginDto);
    expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    expect(result).toEqual({ access_token: 'mock-token' });
  });
});