import { Controller, Get } from '@nestjs/common';

@Controller('system')
export class SystemController {
  @Get('health')
  healthCheck(): string {
    return 'ok';
  }
}
