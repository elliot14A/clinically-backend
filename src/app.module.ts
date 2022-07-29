import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import {
  DeserializeUser,
  RequireDoctor,
  RequirePatient,
  ValidateMiddleware,
} from './app.middleware';
import { AppService } from './app.service';
import { DoctorsModule } from './doctors/doctors.module';
import { createDoctorSchema } from './doctors/doctors.schema';
import { PatientsModule } from './patients/patients.module';
import { createPatientSchema } from './patients/patients.schema';
import {
  forgotPasswordSchema,
  forgotPasswordVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyLoginSchema,
} from './global/global.schema';
import { PatientsController } from './patients/patients.controller';
import { DoctorsController } from './doctors/doctors.controller';
import { PrismaService } from './prisma.service';

@Module({
  imports: [DoctorsModule, PatientsModule],
  controllers: [AppController],
  providers: [
    AppService,
    DeserializeUser,
    ValidateMiddleware,
    PrismaService,
    RequirePatient,
    RequireDoctor,
  ],
})
export class AppModule implements NestModule {
  constructor(
    private readonly deserializer: DeserializeUser,
    private readonly validate: ValidateMiddleware,
  ) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(this.deserializer.use('patient'))
      .forRoutes(PatientsController);
    consumer
      .apply(this.deserializer.use('doctor'))
      .forRoutes(DoctorsController);
    consumer
      .apply(this.validate.use(createDoctorSchema))
      .forRoutes({ method: RequestMethod.POST, path: 'doctors/register' });
    consumer
      .apply(this.validate.use(createPatientSchema))
      .forRoutes({ method: RequestMethod.POST, path: 'patients/register' });
    consumer
      .apply(this.validate.use(verifyEmailSchema))
      .forRoutes(
        { method: RequestMethod.POST, path: 'patients/verify' },
        { method: RequestMethod.POST, path: 'doctors/verify' },
      );
    consumer
      .apply(this.validate.use(forgotPasswordVerificationSchema))
      .forRoutes(
        { method: RequestMethod.POST, path: 'patients/forgotPassword/verify' },
        { method: RequestMethod.POST, path: 'doctors/forgotPassword/verify' },
      );
    consumer
      .apply(this.validate.use(verifyLoginSchema))
      .forRoutes(
        { method: RequestMethod.POST, path: 'patients/login' },
        { method: RequestMethod.POST, path: 'doctors/login' },
      );
    consumer.apply(this.validate.use(forgotPasswordSchema)).forRoutes(
      {
        method: RequestMethod.POST,
        path: 'patients/forgotPassword',
      },
      {
        method: RequestMethod.POST,
        path: 'doctors/forgotPassword',
      },
    );
    consumer
      .apply(this.validate.use(resetPasswordSchema), RequirePatient)
      .forRoutes({
        method: RequestMethod.POST,
        path: 'patients/resetPassword',
      });
    consumer
      .apply(this.validate.use(resetPasswordSchema), RequireDoctor)
      .forRoutes({ method: RequestMethod.POST, path: 'doctors/resetPassword' });
    consumer
      .apply(RequireDoctor)
      .forRoutes({
        method: RequestMethod.POST,
        path: 'doctors/qualifications',
      });
  }
}
