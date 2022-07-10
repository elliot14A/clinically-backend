import { HttpStatus, Injectable } from '@nestjs/common';
import { Doctor, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import {genSalt, hash} from 'bcrypt';
import {omit} from 'lodash';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}
  async create(createDoctorDto: Prisma.DoctorCreateInput) {
    const saltRounds = parseInt(process.env.saltRounds);
    const salt = await genSalt(saltRounds) || 10;
    createDoctorDto.password = await hash(
      createDoctorDto.password,
      salt,
    );
    try {
      const doctor = await this.prisma.doctor.create({ data: createDoctorDto });
      return omit(doctor, 'password');
    
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code == 'P2002') {
          let message: string;
          if (err.message.includes('email')) {
            message = 'email already used by another account';
          } else {
            message = 'phonenumber is already used by another account';
          }
          return {
            code: HttpStatus.BAD_REQUEST,
            message: message,
          };
        }
        return {
          message: err.message,
          code: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }
      return {
        message: err,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async findAll(): Promise<Doctor[]> {
    const doctors: Doctor[] = await this.prisma.doctor.findMany(); //TODO: fix password visibility
    return doctors;
  }

  async findOne(where: Prisma.DoctorWhereUniqueInput): Promise<Doctor> {
    const doctor = await this.prisma.doctor.findFirst({ where });
    return doctor;
  }

  async update(
    where: Prisma.DoctorWhereUniqueInput,
    updateDoctorDto: Prisma.DoctorUpdateInput,
  ): Promise<Doctor> {
    const doctor = await this.prisma.doctor.update({
      where,
      data: updateDoctorDto,
    });
    return doctor;
  }

  // remove(id: number) {
  //   return `This action removes a #${id} doctor`;
  // }
}
