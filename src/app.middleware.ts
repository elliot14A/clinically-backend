import { Injectable, NestMiddleware } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaClientOptions } from '@prisma/client/runtime';
import { Request, Response, NextFunction } from 'express';
import { get, omit } from 'lodash';
import { AnyZodObject } from 'zod';
import { signJwt, verifyJwt } from './global/jwt.utils';
import { PrismaService } from './prisma.service';

@Injectable()
export class ValidateMiddleware implements NestMiddleware {
  use =
    (schema: AnyZodObject) =>
    (req: Request, res: Response, next: NextFunction) => {
      console.log('hello');
      try {
        schema.parse({
          body: req.body,
          params: req.params,
          query: req.query,
        });
        return next();
      } catch (err: any) {
        return res.status(400).send(err.errors);
      }
    };
}

@Injectable()
export class DeserializeUser implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}
  some: PrismaClient<
    PrismaClientOptions,
    never,
    Prisma.RejectOnNotFound | Prisma.RejectPerOperation
  >;
  use =
    (options: 'doctor' | 'patient') =>
    async (req: Request, res: Response, next: NextFunction) => {
      // const accessToken: string = get(req, 'headers.authorization', '').replace(
      //   /^Bearer\s/,
      //   '',
      // );
      // const refreshToken: string = get(req, 'headers.x-refresh', '').replace(
      //   /^Bearer\s/,
      //   '',
      // );
      // console.log(options)
      // const {
      //   decoded,
      //   expired,
      // }: { decoded: { id: number; sessionId: number }; expired: boolean } =
      //   verifyJwt(accessToken);
      // if (decoded) {
      //   res.locals.patient = decoded;
      //   const session = await this.prisma.patientSession.findFirst({
      //     where: { id: decoded.sessionId, patientId: decoded.id },
      //   });
      //   if (!session)
      //     return res.status(403).send({ message: 'invalid session' });
      //   return next();
      // }
      // let newAccessToken: string | false = false;
      // if (expired && refreshToken) {
      //   if (options == "patient") {
      //     newAccessToken = await this.generatePatientNewAccessToken({
      //       refreshToken,
      //     });
      //   } else {
      //     newAccessToken = await this.generateDoctorNewAccessToken({
      //       refreshToken,
      //     });
      //   }
      //   if (newAccessToken) {
      //     res.setHeader('x-access-token', newAccessToken);
      //   }

      //   const result = verifyJwt(newAccessToken.toString());
      //   res.locals.patient = result.decoded;
      //   return next();
      // }
      const accessToken: string = get(req, 'headers.authorization', '').replace(
        /^Bearer\s/,
        '',
      );
      const refreshToken: string = get(req, 'headers.x-refresh', '').replace(
        /^Bearer\s/,
        '',
      );

      const {
        decoded,
        expired,
      }: { decoded: { id: number; sessionId: number }; expired: boolean } =
        verifyJwt(accessToken);

      if (decoded) {
        if (options == 'doctor') {
          console.log(decoded)
          res.locals.doctor = decoded;
          const session = await this.prisma.doctorSession.findFirst({
            where: { id: decoded.sessionId },
          });
          if (!session)
            return res
              .status(403)
              .send({ message: 'invalid session', code: 403 });
          return next();
        } else {
          res.locals.patient = decoded;
          const session = await this.prisma.patientSession.findFirst({
            where: { id: decoded.sessionId },
          });
          if (!session)
            return res
              .status(403)
              .send({ message: 'invalids session', code: 403 });
          return next();
        }
      }

      if (expired && refreshToken) {
        if (options == 'doctor') {
          const newAccessToken = await this.generateDoctorNewAccessToken({
            refreshToken,
          });
          if (newAccessToken) {
            res.setHeader('x-access-token', newAccessToken);
          }
          const result = verifyJwt(newAccessToken.toString());
          res.locals.doctor = result.decoded;
          return next();
        } else {
          const newAccessToken = await this.generatePatientNewAccessToken({
            refreshToken,
          });
          if (newAccessToken) {
            res.setHeader('x-access-token', newAccessToken);
          }
          const result = verifyJwt(newAccessToken.toString());
          res.locals.patient = result.decoded;
          return next();
        }
      }
      return next();
    };

  private generatePatientNewAccessToken = async ({
    refreshToken,
  }: {
    refreshToken: string;
  }) => {
    const { decoded } = verifyJwt(refreshToken);

    if (!decoded) return false;

    const session = await this.prisma.patientSession.findFirst({
      where: {
        id: decoded.sessionId,
      },
    });

    if (!session) return false;

    const user = omit(
      await this.prisma.patient.findFirst({ where: { id: session.patientId } }),
      'password',
    );

    if (!user) return false;

    const accessTokenTtl = process.env.accessTokenTtl;

    const newAccessToken = signJwt(
      { ...user, sessionId: session.id },
      { expiresIn: accessTokenTtl },
    );

    return newAccessToken;
  };

  private generateDoctorNewAccessToken = async ({
    refreshToken,
  }: {
    refreshToken: string;
  }) => {
    const { decoded } = verifyJwt(refreshToken);

    if (!decoded) return false;

    const session = await this.prisma.doctorSession.findFirst({
      where: {
        id: decoded.sessionId,
      },
    });

    if (!session) return false;

    const user = omit(
      await this.prisma.doctor.findFirst({ where: { id: session.doctorId } }),
      'password',
    );

    if (!user) return false;

    const accessTokenTtl = process.env.accessTokenTtl;

    const newAccessToken = signJwt(
      { ...user, sessionId: session.id },
      { expiresIn: accessTokenTtl },
    );

    return newAccessToken;
  };
}

@Injectable()
export class RequirePatient implements NestMiddleware {
  use = (_: Request, res: Response, next: NextFunction) => {
    const user = res.locals.patient;
    if (!user) return res.status(403).send({ message: 'forbidden' });
    return next();
  };
}

export class RequireDoctor implements NestMiddleware {
  use = (_: Request, res: Response, next: NextFunction) => {
    const user = res.locals.doctor;
    console.log(user);
    if (!user) return res.status(403).send({ message: 'forbidden' });
    return next();
  };
}
