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
import {
  VerifyEmailSchema,
  LoginSchema,
  ResetPasswordSchema2,
  ForgotPasswordSchema,
  ForgotPassowrdVerifySchema,
} from 'src/global/global.schema';
import { CreateDoctorSchema, UpdateDoctorSchema } from './doctors.schema';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post('/register')
  async create(
    @Body() createPatientDto: CreateDoctorSchema,
    @Res() res: Response,
  ) {
    console.log(createPatientDto);
    const patient = await this.doctorsService.create(createPatientDto);
    console.log(patient);
    return res.status(patient.code).send(patient);
  }

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.doctorsService.findOne({ id: parseInt(id) });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdateDoctorSchema,
  ) {
    return this.doctorsService.update({ id: parseInt(id) }, updatePatientDto);
  }

  @Post('/verify')
  async verifyEmail(
    @Res() res: Response,
    @Body() verifyEmailDto: VerifyEmailSchema,
  ) {
    const response = await this.doctorsService.verifyEmail(verifyEmailDto);

    return res.status(response.code).send(response);
  }

  @Post('/login')
  async login(@Res() res: Response, @Body() loginDto: LoginSchema) {
    const response = await this.doctorsService.login(loginDto);
    return res.status(response.code).send(response);
  }

  @Post('/logout')
  async logout(@Res() res: Response) {
    const { id } = res.locals.doctor;
    const response = await this.doctorsService.logout(id);
    return res.status(response.code).send(response);
  }

  @Post('/resetPassword')
  async resetPassword(
    @Res() res: Response,
    @Body() resetPasswordDto: ResetPasswordSchema2,
  ) {
    if (!resetPasswordDto.newPassword)
      return res.status(400).send({ message: 'bad request', code: 400 });
    const payload = res.locals.doctor;
    const response = await this.doctorsService.resetPassword({
      newPassword: resetPasswordDto.newPassword,
      id: payload.doctor.id,
    });

    return res.status(response.code).send(response);
  }

  @Post('/forgotPassword')
  async forgotPassword(
    @Res() res: Response,
    @Body() forgotPasswordDto: ForgotPasswordSchema,
  ) {
    const response = await this.doctorsService.forgotPassword(
      forgotPasswordDto.email,
    );
    return res.status(response.code).send(response);
  }

  @Post('/forgotPassword/verify')
  async forgotPasswordOtpVerification(
    @Res() res: Response,
    @Body() forgotPasswordOtpVerificationDto: ForgotPassowrdVerifySchema,
  ) {
    const response = await this.doctorsService.forgotPasswordOtpVerification(
      forgotPasswordOtpVerificationDto,
    );

    return res.status(response.code).send(response);
  }
}