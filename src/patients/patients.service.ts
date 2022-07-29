import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { genSalt, hash, compare } from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { createTransport } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import {
  ForgotPassowrdVerifySchema,
  LoginSchema,
  ServerResponse,
  VerifyEmailSchema,
} from 'src/global/global.schema';
import { signJwt } from 'src/global/jwt.utils';
import { ResetPasswordSchema } from './patients.schema';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}
  async create(
    createPatientDto: Prisma.PatientCreateInput,
  ): Promise<ServerResponse> {
    createPatientDto.password = await this.hashedPassword(
      createPatientDto.password,
    );
    try {
      const { id } = await this.prisma.patient.create({
        data: createPatientDto,
      });
      await this.sendOtpService(createPatientDto.email, id);
      return { message: 'otp is sent to the email', code: HttpStatus.CREATED };
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code == 'P2002') {
          if (err.message.includes('email')) {
            const user = await this.prisma.patient.findFirst({
              where: { email: createPatientDto.email },
            });
            if (user.verified) {
              return {
                message: 'email already in use',
                code: HttpStatus.CONFLICT,
              };
            }
            const { id } = await this.prisma.patient.update({
              where: { email: createPatientDto.email },
              data: { password: createPatientDto.password },
            });
            try {
              await this.prisma.oTPPatient.delete({ where: { patientId: id } });
            } catch (err) {
              console.log(err);
            }
            await this.sendOtpService(createPatientDto.email, id);
            return {
              message: 'resent the otp to the email',
              code: HttpStatus.OK,
            };
          } else {
            return {
              message: 'phonenumber is already in use',
              code: HttpStatus.CONFLICT,
            };
          }
        }
      }
      console.log(err);
      return {
        message: 'unknow error occured',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  findAll() {
    return this.prisma.patient.findMany(); //TODO: fix password visibility in json
  }

  findOne(where: Prisma.PatientWhereUniqueInput) {
    return this.prisma.patient.findFirst({ where });
  }

  update(
    where: Prisma.PatientWhereUniqueInput,
    updatePatientDto: Prisma.PatientUpdateInput,
  ) {
    return this.prisma.patient.update({ where, data: updatePatientDto });
  }

  verifyPhoneNumber({ phoneNumber: string }) {} //TODO: create phonenumber verification service

  async login({ email, password }: LoginSchema): Promise<ServerResponse> {
    const patient = await this.prisma.patient.findFirst({ where: { email } });
    if (patient) {
      if ((await compare(password, patient.password)) === true) {
        const accessTokenTtl = process.env.accessTokenTtl;
        const refreshTokenTtl = process.env.refreshTokenTtl;
        try {

          await this.prisma.patientSession.delete({
            where: { patientId: patient.id },
          });
        } catch(err) {
          console.log(err);
        }
        const session = await this.prisma.patientSession.create({
          data: { patientId: patient.id },
        });
        const accessToken = signJwt(
          { patient, sessionId: session.id },
          { expiresIn: accessTokenTtl },
        );
        const refreshToken = signJwt(
          { patient, sessionId: session.id },
          { expiresIn: refreshTokenTtl },
        );

        return {
          message: {
            accessToken,
            refreshToken,
          },
          code: HttpStatus.OK,
        };
      }
    }
    return {
      message: 'invalid email or password',
      code: HttpStatus.BAD_REQUEST,
    };
  }

  async logout(id: number): Promise<ServerResponse> {
    try {
      await this.prisma.patientSession.delete({ where: { id } });
      return {
        message: 'Logged Out',
        code: HttpStatus.OK,
      };
    } catch (err) {
      return {
        message: err,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async resetPassword({
    newPassword,
    id,
  }: ResetPasswordSchema): Promise<ServerResponse> {
    try {
      const password = await this.hashedPassword(newPassword);
      await this.prisma.patient.update({
        where: { id },
        data: { password },
      });
      return {
        message: 'password reset successful',
        code: HttpStatus.OK,
      };
    } catch (err) {
      console.log(err);
      return {
        message: err,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async forgotPassword(email: string): Promise<ServerResponse> {
    const patient = await this.prisma.patient.findFirst({ where: { email } });
    if (patient) {
      this.sendOtpService(email, patient.id);
      return {
        message: 'Otp is sent',
        code: HttpStatus.OK,
      };
    }
    return {
      message: `no user with email: ${email} found`,
      code: HttpStatus.NOT_FOUND,
    };
  }

  async forgotPasswordOtpVerification({
    email,
    otpV,
    newPassword
  }: ForgotPassowrdVerifySchema): Promise<ServerResponse> {
    const patient = await this.prisma.patient.findFirst({ where: { email } });
    if (patient) {
      try {
        const { otp } = await this.prisma.oTPPatient.findFirst({
          where: { patientId: patient.id },
        });
        if (otp === otpV) {
          await this.prisma.oTPPatient.delete({
            where: { patientId: patient.id },
          });
          const password = await this.hashedPassword(newPassword);
          await this.prisma.patient.update({
            where: { id: patient.id },
            data: { password },
          });
          return {
            message: 'password changed successfully',
            code: HttpStatus.OK,
          };
        }
        return {
          message: "invalid otp",
          code: HttpStatus.BAD_REQUEST
        }
      } catch (err) {
        console.log(err);
        return {
          message: err,
          code: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }
    }
    return {
      message: 'Bad Request',
      code: HttpStatus.BAD_REQUEST,
    };
  }

  async verifyEmail({
    email,
    otpV,
  }: VerifyEmailSchema): Promise<ServerResponse> {
    const user = await this.prisma.patient.findFirst({ where: { email } });
    if (!user)
      return {
        message: 'Bad Request',
        code: HttpStatus.BAD_REQUEST,
      };
    if (user.verified) {
      return {
        message: 'user is already verified',
        code: HttpStatus.OK,
      };
    }
    const otp = await this.prisma.oTPPatient.findFirst({
      where: { patientId: user.id },
    });
    if (otpV === otp.otp) {
      await this.prisma.patient.update({
        where: { id: user.id },
        data: { verified: true },
      });
      await this.prisma.oTPPatient.delete({ where: { patientId: user.id } });
      return {
        message: 'email is successfully verified',
        code: HttpStatus.OK,
      };
    }
    return {
      message: 'Invalid OTP',
      code: HttpStatus.BAD_REQUEST,
    };
  }

  private async hashedPassword(password: string): Promise<string> {
    const saltRounds = process.env.saltRounds;
    const salt = await genSalt(parseInt(saltRounds));
    const hashedPassword = await hash(password, salt);
    return hashedPassword;
  }

  private async sendOtpService(email: string, id: number): Promise<string> {
    const transport = createTransport({
      service: 'gmail',
      auth: {
        user: 'akshithmadhur0072@gmail.com',
        pass: process.env.password,
      },
    });
    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const mailOptions: Mail.Options = {
      from: 'akshithmadhur0072@gmail.com',
      to: email,
      subject: 'Your otp to sign up for Clinically',
      text: `Your OTP is ${otp}`,
    };
    transport.sendMail(mailOptions);
    await this.prisma.oTPPatient.create({ data: { patientId: id, otp } });
    return otp;
  }
}