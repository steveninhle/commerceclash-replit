import { Injectable } from '@nestjs/common';
import { PrismaService } from '../utils/prisma/prisma.service';
import { users as User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<User | null> {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.users.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  }

  async update(id: string, data: Prisma.usersUpdateInput): Promise<User> {
    return this.prisma.users.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.users.delete({
      where: { id },
    });
  }
}
