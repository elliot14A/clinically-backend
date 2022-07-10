import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { ValidateMiddleware } from './app.middleware';
import { AppService } from './app.service';
import { DoctorsModule } from './doctors/doctors.module';
import { createDoctorSchema } from './doctors/doctors.schema';
import { PatientsModule } from './patients/patients.module';
import * as dotenv from "dotenv";

@Module({
  imports: [DoctorsModule, PatientsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  validate = new ValidateMiddleware();
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(this.validate.use(createDoctorSchema))
      .forRoutes(
        { method: RequestMethod.POST, path: 'doctors/register' },
        { method: RequestMethod.POST, path: 'patients/register' },
      );
  }
}
