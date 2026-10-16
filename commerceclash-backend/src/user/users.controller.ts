import { Controller, Get, Body, Patch, Delete, NotFoundException, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiCookieAuth, ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { users as User } from '@prisma/client';
import { ApiGetUser, ApiUpdateUser, ApiDeleteUser } from './docs/api-docs.decorator';
import { Auth } from '@decorators/auth.decorator';

@ApiExcludeController()
@Auth()
@ApiCookieAuth()
@ApiTags('User Self')
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiGetUser()
  async findOne(@Req() req: Request): Promise<User> {
    const userId = req.user.id;
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  @Patch()
  @ApiUpdateUser()
  async update(@Req() req: Request, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    try {
      return await this.usersService.update(req.user.id, updateUserDto);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${req.user.id} not found`);
      }
      throw error;
    }
  }

  @Delete()
  @ApiDeleteUser()
  async remove(@Req() req: Request): Promise<User> {
    try {
      return await this.usersService.remove(req.user.id);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${req.user.id} not found`);
      }
      throw error;
    }
  }
}
