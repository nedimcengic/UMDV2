import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/apikey')
  getApiKey(): string {
    return this.appService.getApiKey(); // Returns the API key from the service
  }
}
