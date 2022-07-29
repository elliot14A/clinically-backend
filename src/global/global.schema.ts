import { object, string } from 'zod';

export type VerifyEmailSchema = {
  email: string;
  otpV: string;
};

export type ResetPasswordSchema2 = {
  newPassword: string;
};

export type ForgotPasswordSchema = {
  email: string;
};

export type ForgotPassowrdVerifySchema = {
  email: string;
  otpV: string;
  newPassword: string;
}

export type LoginSchema = {
  email: string;
  password: string;
};

export type ServerResponse = {
  message: string | Object;
  code: number;
};

export const verifyLoginSchema = object({
  body: object({
    email: string({ required_error: 'email is required' }).email(),
    password: string({ required_error: 'password is required' }),
  }),
});

export const verifyEmailSchema = object({
  body: object({
    email: string({ required_error: 'email is required' }).email(),
    otpV: string({ required_error: 'otpV is required' }).length(6),
  }),
});

export const resetPasswordSchema = object({
  body: object({
    newPassword: string({ required_error: 'newPassword is required' }).min(6),
  }),
});

export const forgotPasswordVerificationSchema = object({
  body: object({
    otpV: string({ required_error: 'otpV is required' }),
    newPassword: string({ required_error: 'newPassword is required' }),
  }),
});

export const forgotPasswordSchema = object({
  body: object({
    email: string({ required_error: 'email is required' }).email(),
  }),
});

export const forgotPasswordVerifySchema = object({
  body: object({
    otpV:string({required_error:"otpV is required"}),
    newPassword: string({required_error:"newPassword is required"}),
    email: string({required_error:"email is required"})
  })
})