// backend/user-management-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS to allow requests from the correct frontend URL
  app.enableCors({
    origin: 'http://localhost:3000',  // Use the correct Vite port for your frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  await app.listen(4000); // Run backend on port 4000
}
bootstrap();
