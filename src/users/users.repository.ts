import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { User } from './interfaces/user.interface';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class UsersRepository {
  private tableName = 'Users';

  constructor(@Inject(DynamoDBClient) private dynamoDb: DynamoDBClient) {}

  async create(user: User): Promise<User> {
    const params = {
      TableName: this.tableName,
      Item: marshall(user, { removeUndefinedValues: true }),
    };

    await this.dynamoDb.send(new PutItemCommand(params));

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const params = {
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: email },
      },
    };
    const { Items } = await this.dynamoDb.send(new QueryCommand(params));

    if (!Items || Items.length === 0) {
      return null;
    }

    return unmarshall(Items[0]) as User;
  }

  async findById(userId: string): Promise<User | null> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ userId }),
    };
    const { Item } = await this.dynamoDb.send(new GetItemCommand(params));
    
    if (!Item) {
      return null;
    }
    
    return unmarshall(Item) as User;
  }
}