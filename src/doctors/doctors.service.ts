import { HttpStatus, Injectable } from '@nestjs/common';
import { Doctor, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { compare, genSalt, hash } from 'bcrypt';
import { omit } from 'lodash';
import { createTransport } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import {
  ForgotPassowrdVerifySchema,
  LoginSchema,
  ServerResponse,
  VerifyEmailSchema,
} from 'src/global/global.schema';
import { signJwt } from 'src/global/jwt.utils';
import { ResetPasswordSchema } from 'src/doctors/doctors.schema';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}
  async create(
    createDoctorDto: Prisma.DoctorCreateInput,
  ): Promise<ServerResponse> {
    createDoctorDto.password = await this.hashedPassword(
      createDoctorDto.password,
    );
    try {
      const { id } = await this.prisma.doctor.create({
        data: createDoctorDto,
      });
      await this.sendOtpService(createDoctorDto.email, id);
      return { message: 'otp is sent to the email', code: HttpStatus.CREATED };
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code == 'P2002') {
          if (err.message.includes('email')) {
            const user = await this.prisma.doctor.findFirst({
              where: { email: createDoctorDto.email },
            });
            if (user.verified) {
              return {
                message: 'email already in use',
                code: HttpStatus.CONFLICT,
              };
            }
            const { id } = await this.prisma.doctor.update({
              where: { email: createDoctorDto.email },
              data: { password: createDoctorDto.password },
            });
            try {
              await this.prisma.oTPDoctor.delete({ where: { doctorId: id } });
            } catch (err) {
              console.log(err);
            }
            await this.sendOtpService(createDoctorDto.email, id);
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
    return this.prisma.doctor.findMany(); //TODO: fix password visibility in json
  }

  findOne(where: Prisma.DoctorWhereUniqueInput) {
    return this.prisma.doctor.findFirst({ where });
  }

  update(
    where: Prisma.DoctorWhereUniqueInput,
    updateDoctorDto: Prisma.DoctorUpdateInput,
  ) {
    return this.prisma.doctor.update({ where, data: updateDoctorDto });
  }

  verifyPhoneNumber({ phoneNumber: string }) {} //TODO: create phonenumber verification service

  async login({ email, password }: LoginSchema): Promise<ServerResponse> {
    const Doctor = await this.prisma.doctor.findFirst({ where: { email } });
    if (Doctor) {
      if ((await compare(password, Doctor.password)) === true) {
        const accessTokenTtl = process.env.accessTokenTtl;
        const refreshTokenTtl = process.env.refreshTokenTtl;
        try {
          await this.prisma.doctorSession.delete({
            where: { doctorId: Doctor.id },
          });
        } catch (err) {
          console.log(err);
        }
        const session = await this.prisma.doctorSession.create({
          data: { doctorId: Doctor.id },
        });
        const accessToken = signJwt(
          { doctor:Doctor, sessionId: session.id },
          { expiresIn: accessTokenTtl },
        );
        const refreshToken = signJwt(
          { Doctor, sessionId: session.id },
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
      await this.prisma.doctorSession.delete({ where: { id } });
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
      await this.prisma.doctor.update({
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
    const Doctor = await this.prisma.doctor.findFirst({ where: { email } });
    if (Doctor) {
      this.sendOtpService(email, Doctor.id);
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
    newPassword,
  }: ForgotPassowrdVerifySchema): Promise<ServerResponse> {
    const doctor = await this.prisma.doctor.findFirst({ where: { email } });
    if (doctor) {
      try {
        const { otp } = await this.prisma.oTPDoctor.findFirst({
          where: { doctorId: doctor.id },
        });
        if (otp === otpV) {
          await this.prisma.oTPDoctor.delete({
            where: { doctorId: doctor.id },
          });
          const password = await this.hashedPassword(newPassword);
          await this.prisma.doctor.update({
            where: { id: doctor.id },
            data: { password },
          });
          return {
            message: 'password changed successfully',
            code: HttpStatus.OK,
          };
        }
        return {
          message: 'invalid otp',
          code: HttpStatus.BAD_REQUEST,
        };
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
    const user = await this.prisma.doctor.findFirst({ where: { email } });
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
    const otp = await this.prisma.oTPDoctor.findFirst({
      where: { doctorId: user.id },
    });
    if (otpV === otp.otp) {
      await this.prisma.doctor.update({
        where: { id: user.id },
        data: { verified: true },
      });
      await this.prisma.oTPDoctor.delete({ where: { doctorId: user.id } });
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
    await this.prisma.oTPDoctor.create({ data: { doctorId: id, otp } });
    return otp;
  }
}
