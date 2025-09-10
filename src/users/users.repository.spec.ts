import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { User } from './interfaces/user.interface';

const mockUser: User = {
  userId: 'mock-MyUser-id',
  name: 'Test More User',
  email: 'testado-sim@expmail.com',
  password: 'Essa@SenhaÉ999,9',
};

const mockDynamoDbClient = {
  send: jest.fn(),
};

jest.mock('@aws-sdk/util-dynamodb', () => ({
  marshall: jest.fn(() => ({
    userId: { S: 'mock-MyUser-id' },
    name: { S: 'Test More User' },
    email: { S: 'testado-sim@expmail.com' },
    password: { S: 'Essa@SenhaÉ999,9' },
  })),

  unmarshall: jest.fn(() => mockUser),
}));

describe('UsersRepository', () => {
  let repository: UsersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: DynamoDBClient,
          useValue: mockDynamoDbClient,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should call dynamoDb.send with PutItemCommand and return the user', async () => {
      await repository.create(mockUser);

      expect(mockDynamoDbClient.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
      expect(marshall).toHaveBeenCalledWith(mockUser, { removeUndefinedValues: true });
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      mockDynamoDbClient.send.mockResolvedValue({ Items: [{ mock: 'item' }] });
      const result = await repository.findByEmail(mockUser.email);

      expect(mockDynamoDbClient.send).toHaveBeenCalledWith(expect.any(QueryCommand));
      expect(unmarshall).toHaveBeenCalledWith({ mock: 'item' });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found', async () => {
      mockDynamoDbClient.send.mockResolvedValue({ Items: [] });
      const result = await repository.findByEmail('procura-se-email@foundmail.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      mockDynamoDbClient.send.mockResolvedValue({ Item: { mock: 'item' } });
      const result = await repository.findById(mockUser.userId);

      expect(mockDynamoDbClient.send).toHaveBeenCalledWith(expect.any(GetItemCommand));
      expect(unmarshall).toHaveBeenCalledWith({ mock: 'item' });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found', async () => {
      mockDynamoDbClient.send.mockResolvedValue({ Item: null });
      const result = await repository.findById('nao-achamos-id');

      expect(result).toBeNull();
    });
  });
});