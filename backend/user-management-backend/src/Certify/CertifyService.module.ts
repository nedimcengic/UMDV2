import { Module } from '@nestjs/common';
import { CertifyService } from './CertifyService.service';
import { CertifyController } from './CertifyController';

@Module({
  providers: [CertifyService],
  controllers: [CertifyController],
  exports: [CertifyService],
})
export class CertifyModule {}
