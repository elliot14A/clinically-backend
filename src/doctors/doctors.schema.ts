import { object, string, TypeOf } from 'zod';

export const createDoctorSchema = object({
  body: object({
    firstName: string({ required_error: 'firstName is required' }).min(
      4,
      'firstName should be atleast 4 chars long',
    ),
    lastName: string({ required_error: 'lastName is required' }).min(
      4,
      'lastName should be atleast 4 chars long',
    ),
    email: string({ required_error: 'email is required' }).email(
      'not a valid email',
    ),
    phoneNumber: string({ required_error: 'phonenumber is required' }).min(
      10,
      'not a valid phonenumber',
    ),
    password: string({ required_error: 'password is required' }).min(
      6,
      'password should be atleast 6 chars long',
    ),
  }),
});

export type CreateDoctorSchema = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export type UpdateDoctorSchema = {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
  phoneNumber?: string | undefined;
};

export type ResetPasswordSchema = {
  newPassword: string;
  id: number;
};
