import bcrypt from 'bcrypt'

/**
 * PasswordHandler.ts
 * This module provides functions to hash and compare passwords using bcrypt.
 * @param password - The plain text password to be hashed.
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10
  const salt = await bcrypt.genSalt(saltRounds)
  return await bcrypt.hash(password, salt)
}

/**
 * Compare a plain text password with a hashed password.
 * @param password - The plain text password to compare.
 * @param hashPassword - The hashed password to compare against.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */
export const comparePassword = async (
  password: string,
  hashPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword)
}
