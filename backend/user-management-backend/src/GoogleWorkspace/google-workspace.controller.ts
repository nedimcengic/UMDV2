import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express'; // Ensure this import is from 'express'
import { GoogleWorkspaceService } from './google-workspace.service';

@Controller('google-workspace')
export class GoogleWorkspaceController {
  constructor(private readonly googleWorkspaceService: GoogleWorkspaceService) {}

  // Endpoint to get the Google OAuth Consent URL
  @Get('auth-url')
  getAuthUrl() {
    const authUrl = this.googleWorkspaceService.getAuthUrl();
    return { authUrl };
  }

  // Endpoint to exchange an authorization code for tokens
  @Get('exchange-token')
  async exchangeToken(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      throw new HttpException('Authorization code is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const tokens = await this.googleWorkspaceService.exchangeCodeForTokens(code);

      // Redirect to frontend with tokens in the URL
      res.redirect(
        `http://localhost:3000?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
      );
    } catch (error) {
      console.error('Error exchanging token:', error.message);
      res.redirect('http://localhost:3000?status=error'); // Redirect to frontend with error
    }
  }

  // Endpoint to create a new user in Google Workspace
  @Post('create-user')
  async createUser(
    @Body() userData: { email: string; firstName: string; lastName: string; password: string }
  ) {
    try {
      const createdUser = await this.googleWorkspaceService.createUser(userData);
      return { message: 'User created successfully in Google Workspace', user: createdUser };
    } catch (error) {
      if (error.message === 'Failed to refresh access token.') {
        throw new HttpException(
          { message: 'Token expired or invalid', redirectToAuth: true },
          HttpStatus.UNAUTHORIZED
        );
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint to create a group in Google Workspace
  @Post('create-group')
  async createGroup(@Body() groupData: { email: string; name: string; description: string }) {
    try {
      const createdGroup = await this.googleWorkspaceService.createGroup(groupData);
      return { message: 'Group created successfully in Google Workspace', group: createdGroup };
    } catch (error) {
      if (error.message === 'Failed to refresh access token.') {
        throw new HttpException(
          { message: 'Token expired or invalid', redirectToAuth: true },
          HttpStatus.UNAUTHORIZED
        );
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint to add a user to a group in Google Workspace
  @Post('add-user-to-group')
  async addUserToGroup(@Body() data: { userEmail: string; groupEmail: string }) {
    try {
      const result = await this.googleWorkspaceService.addUserToGroup(data.userEmail, data.groupEmail);
      return { message: 'User added successfully to Google Workspace group', result };
    } catch (error) {
      if (error.message === 'Failed to refresh access token.') {
        throw new HttpException(
          { message: 'Token expired or invalid', redirectToAuth: true },
          HttpStatus.UNAUTHORIZED
        );
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('check-login')
  checkLogin() {
    if (this.googleWorkspaceService.isLoggedIn()) {
      return { loggedIn: true };
    } else {
      throw new HttpException('Not logged in', HttpStatus.UNAUTHORIZED);
    }
  }

  // FIXED: Correctly set the route and method for removing a user from a group
  @Delete('remove-user-from-group')
  async removeUserFromGroup(@Body() data: { userEmail: string; groupEmail: string }) {
    try {
      const result = await this.googleWorkspaceService.removeUserFromGroup(
        data.userEmail,
        data.groupEmail
      );
      return { message: 'User removed successfully from Google Workspace group', result };
    } catch (error) {
      if (error.message === 'Failed to refresh access token.') {
        throw new HttpException(
          { message: 'Token expired or invalid', redirectToAuth: true },
          HttpStatus.UNAUTHORIZED
        );
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
