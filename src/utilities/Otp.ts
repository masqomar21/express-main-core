import crypto from 'crypto'
import prisma from '@/config/database'

/**
 * Menghasilkan OTP numerik unik (tidak duplikat di tabel OTP)
 * @param length Panjang OTP (default: 6)
 * @returns string OTP unik
 */
export async function generateOtp(length: number = 6): Promise<string> {
  // Helper untuk buat angka acak aman
  const generateNumericOtp = (len: number): string => {
    const max = 10 ** len
    const num = crypto.randomInt(0, max)
    return String(num).padStart(len, '0')
  }

  // Helper untuk cek apakah OTP sudah ada di DB
  const isUnique = async (code: string): Promise<boolean> => {
    const existing = await prisma.otp.findUnique({ where: { code } })
    return !existing
  }

  let otp = generateNumericOtp(length)

  // Ulangi generate sampai dapat kode yang belum ada
  while (!(await isUnique(otp))) {
    otp = generateNumericOtp(length)
  }

  return otp
}
