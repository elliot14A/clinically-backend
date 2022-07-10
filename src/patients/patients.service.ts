import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import {omit} from 'lodash';
import { genSalt, hash } from 'bcrypt';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}
  async create(createPatientDto: Prisma.PatientCreateInput) {
    const saltRounds = parseInt(process.env.saltRounds);
    const salt = (await genSalt(saltRounds)) || 10;
    createPatientDto.password = await hash(createPatientDto.password, salt);
    try {
      const patient = await this.prisma.patient.create({
        data: createPatientDto,
      });
      return omit(patient, 'password');
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

  findAll() {
    return this.prisma.patient.findMany(); //TODO: fix password visibility
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

  // remove(id: number) {
  //   return `This action removes a #${id} patient`;
  // }
}
