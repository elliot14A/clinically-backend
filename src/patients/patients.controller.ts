import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CreatePatientSchema, UpdatePatientSchema } from './patients.schema';
import { PatientsService } from './patients.service';

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
    if ('message' in patient) {
      return res.status(patient.code).send(patient);
    }
    return res.status(HttpStatus.CREATED).send({
      message: 'patient registered successfully',
      data: patient,
    });
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne({ id: parseInt(id) });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientSchema,
  ) {
    return this.patientsService.update({ id: parseInt(id) }, updatePatientDto);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.patientsService.remove(+id);
  // }
}
