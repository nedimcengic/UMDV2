import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module'; // Adjust path to match your project's structure
import { AtlassianScimService } from './atlassianScim.service'; // Adjust path to your service

async function debug() {
  const app = await NestFactory.createApplicationContext(AppModule); // Bootstraps the application
  const atlassianScimService = app.get(AtlassianScimService); // Inject the service

  try {
    console.log('Starting sync of Atlassian users to database...');
    const result = await atlassianScimService.syncAllAtlassianUsersToDatabase(); // Call the function
    console.log('Sync completed successfully:', result);
  } catch (error) {
    console.error('An error occurred during sync:', error.message);
  } finally {
    await app.close(); // Gracefully shut down the app
  }
}

debug();
