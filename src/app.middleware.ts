import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

@Injectable()
export class ValidateMiddleware implements NestMiddleware {
  use = (schema: AnyZodObject) => (
    req: Request, res: Response, next: NextFunction
  ) => {
    try {
        schema.parse({
            body: req.body,
            params: req.params,
            query: req.query
        })
        return next();
    } catch(err: any) {
        return res.status(400).send(err.errors);
    }
  }
}
