import { Injectable, ConflictException  } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
    
    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const { name, email, password } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      userId: uuid(),
      name,
      email,
      password: hashedPassword,
    };

    return this.usersRepository.create(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(userId: string): Promise<User | null> {
    return this.usersRepository.findById(userId);
  }
}
