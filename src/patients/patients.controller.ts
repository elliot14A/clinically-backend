import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { CreatePatientSchema, UpdatePatientSchema } from './patients.schema';
import { PatientsService } from './patients.service';
import {
  ForgotPassowrdVerifySchema,
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema2,
  VerifyEmailSchema,
} from 'src/global/global.schema';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('/register')
  async create(
    @Body() createPatientDto: CreatePatientSchema,
    @Res() res: Response,
  ) {
    const patient = await this.patientsService.create(createPatientDto);
    console.log(patient);
    return res.status(patient.code).send(patient);
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string,) {
    return this.patientsService.findOne({ id: parseInt(id) });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientSchema,
  ) {
    return this.patientsService.update({ id: parseInt(id) }, updatePatientDto);
  }

  @Post('/verify')
  async verifyEmail(
    @Res() res: Response,
    @Body() verifyEmailDto: VerifyEmailSchema,
  ) {
    const response = await this.patientsService.verifyEmail(verifyEmailDto);

    return res.status(response.code).send(response);
  }

  @Post('/login')
  async login(@Res() res: Response, @Body() loginDto: LoginSchema) {
    const response = await this.patientsService.login(loginDto);
    return res.status(response.code).send(response);
  }

  @Post('/logout')
  async logout(@Res() res: Response) {
    const { id } = res.locals.patient;
    const response = await this.patientsService.logout(id);
    return res.status(response.code).send(response);
  }

  @Post('/resetPassword')
  async resetPassword(
    @Res() res: Response,
    @Body() resetPasswordDto: ResetPasswordSchema2,
  ) {
    const patient = res.locals.patient;
    const response = await this.patientsService.resetPassword({
      newPassword: resetPasswordDto.newPassword,
      id: patient.patient.id,
    });

    return res.status(response.code).send(response);
  }

  @Post('/forgotPassword')
  async forgotPassword(
    @Res() res: Response,
    @Body() forgotPasswordDto: ForgotPasswordSchema,
  ) {
    const response = await this.patientsService.forgotPassword(
      forgotPasswordDto.email,
    );
    return res.status(response.code).send(response);
  }

  @Post('/forgotPassword/verify')
  async forgotPasswordOtpVerification(
    @Res() res: Response,
    @Body() forgotPasswordOtpVerificationDto: ForgotPassowrdVerifySchema,
  ) {
    const response = await this.patientsService.forgotPasswordOtpVerification(
      forgotPasswordOtpVerificationDto,
    );

    return res.status(response.code).send(response);
  }
}