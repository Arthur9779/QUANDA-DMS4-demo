const { z } = require("zod");

const EmailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const PasswordSchema = z.string().min(10).max(128)
  .refine((value) => /[a-z]/u.test(value), "Password must include a lowercase letter")
  .refine((value) => /[A-Z]/u.test(value), "Password must include an uppercase letter")
  .refine((value) => /[0-9]/u.test(value), "Password must include a number");
const DisplayNameSchema = z.string().trim().min(2).max(80);

const RegisterSchema = z.object({
  displayName: DisplayNameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  anonymousSessionToken: z.string().startsWith("qus_").max(100).optional(),
}).strict();

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(128),
}).strict();

const UpdateProfileSchema = z.object({
  displayName: DisplayNameSchema.optional(),
  avatar: z.string().trim().max(32).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one profile field is required",
});

const ClaimAnonymousSchema = z.object({
  anonymousSessionToken: z.string().startsWith("qus_").max(100),
}).strict();

module.exports = {
  ClaimAnonymousSchema,
  LoginSchema,
  RegisterSchema,
  UpdateProfileSchema,
};
