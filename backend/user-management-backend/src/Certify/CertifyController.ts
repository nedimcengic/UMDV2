import { Controller, Post, Body, HttpException, HttpStatus, Get, Query } from '@nestjs/common';
import { CertifyService } from './CertifyService.service';

@Controller('certify')
export class CertifyController {
  constructor(private readonly certifyService: CertifyService) {}

  @Get('check-user')
  async checkUser(@Query('email') email: string) {
    console.log('CertifyController - Checking user with email:', email);

    if (!email) {
      throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const userExists = await this.certifyService.checkIfUserExists(email);
      return userExists;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to check user existence in Certify',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upsert-user')
async upsertUser(@Body() userData: any) {
  console.log(
    'CertifyController - Received payload in upsertUser:',
    JSON.stringify(userData, null, 2),
  );

  // Validate required fields
  if (!userData || !userData.Email || !userData.FirstName || !userData.LastName || !userData.DepartmentID) {
    console.error('CertifyController - Invalid payload or missing required fields.');
    throw new HttpException(
      'Invalid payload or missing required fields',
      HttpStatus.BAD_REQUEST,
    );
  }

  try {
    // Step 1: Check if the user exists
    const userCheck = await this.certifyService.checkIfUserExists(userData.Email);
    console.log('CertifyController - User check result:', userCheck);

    // Step 2: Construct EmployeeID
    const employeeID = `${userData.FirstName} ${userData.LastName}`.trim();

    // Step 3: Construct payload for upsert
    const userPayload = {
      ID: userCheck.exists ? userCheck.userId : undefined,
      Email: userData.Email,
      FirstName: userData.FirstName,
      LastName: userData.LastName,
      DepartmentID: userData.DepartmentID,
      EmployeeID: employeeID, // Add the EmployeeID with space
      FirstApproverID: this.certifyService.getFirstApproverID(),
      AccountantID: this.certifyService.getAccountantID(),
      SendWelcomeEmail: userData.SendWelcomeEmail ?? 1,
      Active: userData.Active ?? 1,
      EmpGLD1ID: 'e25f084f-2a58-43dc-9586-9ed9ffd57f7a',
    };

    // Handle manager logic
    if (userData.ManagerEmail) {
      const managerCheck = await this.certifyService.checkIfUserExists(userData.ManagerEmail);
      if (managerCheck.exists) {
        userPayload['SecondApproverID'] = managerCheck.userId;
      } else {
        console.warn(`Manager with email ${userData.ManagerEmail} not found.`);
      }
    }

    // Upsert user
    const result = await this.certifyService.upsertCertifyUser(userPayload, userData.Role || null);
    console.log('CertifyController - Successfully upserted user:', result);
    return result;
  } catch (error) {
    console.error('CertifyController - Error in upsertUser:', error.message || error);
    throw new HttpException(
      error.response?.data?.message || 'Failed to process user in Certify',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
}