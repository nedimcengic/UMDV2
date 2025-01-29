import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CertifyService {
  private readonly certifyApiUrl = process.env.CERTIFY_API_URL;
  private readonly certifyApiKey = process.env.CERTIFY_API_KEY;
  private readonly certifyApiSecret = process.env.CERTIFY_API_SECRET;

  private readonly firstApproverID =
    process.env.CF || '513b3b36-ae51-4451-8a5b-8d7853231f5d';
  private readonly accountantID =
    process.env.CERTIFY_ACCOUNTANT_ID || '7a2a02cc-5635-4a75-be40-7dd1105c1860';
    
    // Expose firstApproverID
  getFirstApproverID(): string {
    return this.firstApproverID;
  }

  // Expose accountantID
  getAccountantID(): string {
    return this.accountantID;
  }
  constructor() {
      if (!this.certifyApiUrl) {
        throw new Error('CERTIFY_API_URL is not defined in the environment variables.');
      }
    }
    private getHeaders() {
      if (!this.certifyApiKey || !this.certifyApiSecret) {
        throw new Error('Certify API key or secret is not set in the environment variables.');
      }
    
      return {
        'X-Api-Key': this.certifyApiKey,
        'X-Api-Secret': this.certifyApiSecret,
        'Content-Type': 'application/json',
      };
    }
  /**
   * Check if a user exists in Certify by email
   */
  async checkIfUserExists(email: string): Promise<{ exists: boolean; userId?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Checking user existence with API URL:', this.certifyApiUrl);

    try {
      const response = await axios.get(`${this.certifyApiUrl}/users`, {
        headers: this.getHeaders(),
        params: { email: normalizedEmail },
      });

      const user = response.data.Users?.find(
        (u: any) => u.Email.toLowerCase() === normalizedEmail,
      );
      return user ? { exists: true, userId: user.ID } : { exists: false };
    } catch (error) {
      console.error(
        'Error checking user existence in Certify:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Could not verify user existence in Certify.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Upsert (create or update) a user in Certify
   */
  async upsertCertifyUser(userPayload: any, role: string | null): Promise<any> {
    if (!userPayload.ID) {
      console.log('CertifyService - No user ID provided, attempting to create a new user.');
      const userId = await this.createCertifyUser(userPayload.Email);
      userPayload.ID = userId; // Update the payload with the newly created user ID
    }
  
    try {
      const response = await axios.post(`${this.certifyApiUrl}/users`, [userPayload], {
        headers: this.getHeaders(),
      });
  
      console.log('CertifyService - Successfully upserted user:', response.data);
  
      if (role) {
        const rolePayload = {
          ID: userPayload.ID,
          Role: role,
        };
        await axios.post(`${this.certifyApiUrl}/roles`, [rolePayload], {
          headers: this.getHeaders(),
        });
      }
  
      return response.data;
    } catch (error) {
      console.error('CertifyService - Error upserting user:', error.response?.data || error.message);
      throw new HttpException(
        'Failed to upsert user in Certify.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  
  async createCertifyUser(email: string): Promise<string> {
    console.log('CertifyService - Creating user with email:', email);
  
    try {
      const response = await axios.put(
        `${this.certifyApiUrl}/users`, // Use PUT as required by the API
        { Email: email },
        {
          headers: this.getHeaders(),
        }
      );
  
      console.log('CertifyService - User creation response:', response.data);
  
      const userId = response.data?.ID;
      if (!userId) {
        console.error('CertifyService - Failed to create user. No ID returned.');
        throw new HttpException('Failed to create user in Certify.', HttpStatus.BAD_REQUEST);
      }
  
      return userId;
    } catch (error) {
      console.error('CertifyService - Error creating user:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.message || 'Failed to create user in Certify.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
}  