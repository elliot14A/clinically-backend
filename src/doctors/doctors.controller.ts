import { Controller, Get, Post, Body, Patch, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { CreateDoctorSchema, UpdateDoctorSchema } from './doctors.schema';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post("/register")
  async create(
    @Body() createUserDto: CreateDoctorSchema,
    @Res() res: Response,
  ) {
    const doctor = await this.doctorsService.create(createUserDto);
    if ('message' in doctor) {
      return res.status(doctor.code).send(doctor);
    }
    return res.status(201).send({
      message:"doctor registered successfully",
      data: doctor
    });
  }

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne({ id: parseInt(id) });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorSchema) {
    return this.doctorsService.update({ id: parseInt(id) }, updateDoctorDto);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.doctorsService.remove(+id);
  // }
}
