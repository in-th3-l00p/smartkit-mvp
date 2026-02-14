import { z } from 'zod'

const ethereumAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')

const hexData = z
  .string()
  .regex(/^0x([a-fA-F0-9]*)?$/, 'Invalid hex data')
  .default('0x')

export const createWalletSchema = z.object({
  userId: z.string().min(1, 'userId is required').max(255),
  email: z.string().email('Invalid email format').max(255),
})

export const sendTransactionSchema = z.object({
  walletAddress: ethereumAddress,
  to: ethereumAddress,
  value: z.string().default('0'),
  data: hexData,
  sponsored: z.boolean().default(true),
})

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'name is required').max(255),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  projectName: z.string().min(1, 'Project name is required').max(255),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})
