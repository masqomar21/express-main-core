/**
 * Examples of using ResponseSanitizer
 */

import {
  sanitizeResponse,
  sanitizeUser,
  sanitizeUsers,
  sanitizeWithCustomKeys,
} from './ResponseSanitizer'

// ============================================
// Example 1: Basic user sanitization
// ============================================
const userFromDB = {
  id: 1,
  email: 'user@example.com',
  name: 'John Doe',
  password: 'hashed_password_here',
  passwordHash: 'bcrypt_hash',
  token: 'jwt_token_here',
  refreshToken: 'refresh_token_here',
  role: 'admin',
  createdAt: '2024-01-01',
}

const sanitizedUser = sanitizeUser(userFromDB)
console.log(sanitizedUser)
// Result: { id: 1, email: 'user@example.com', name: 'John Doe', role: 'admin', createdAt: '2024-01-01' }

// ============================================
// Example 2: Array of users
// ============================================
const usersFromDB = [
  {
    id: 1,
    email: 'user1@example.com',
    password: 'secret1',
    name: 'User One',
  },
  {
    id: 2,
    email: 'user2@example.com',
    password: 'secret2',
    name: 'User Two',
  },
]

const sanitizedUsers = sanitizeUsers(usersFromDB)
console.log(sanitizedUsers)
// Result: [{ id: 1, email: 'user1@example.com', name: 'User One' }, { id: 2, email: 'user2@example.com', name: 'User Two' }]

// ============================================
// Example 3: Nested objects with deep sanitization
// ============================================
const userWithProfile = {
  id: 1,
  email: 'user@example.com',
  password: 'secret123',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    privateKey: 'private_key_data',
    settings: {
      theme: 'dark',
      apiKey: 'api_key_secret',
    },
  },
}

const sanitizedProfile = sanitizeResponse(userWithProfile, { deep: true })
console.log(sanitizedProfile)
// Result: { id: 1, email: 'user@example.com', profile: { firstName: 'John', lastName: 'Doe', settings: { theme: 'dark' } } }

// ============================================
// Example 4: Replace with [REDACTED] instead of removing
// ============================================
const userWithRedacted = sanitizeResponse(userFromDB, {
  replaceWithRedacted: true,
})
console.log(userWithRedacted)
// Result: { id: 1, email: 'user@example.com', name: 'John Doe', password: '[REDACTED]', passwordHash: '[REDACTED]', token: '[REDACTED]', ... }

// ============================================
// Example 5: Custom sensitive keys
// ============================================
const dataWithCustomSensitive = {
  id: 1,
  publicInfo: 'visible',
  internalNote: 'should be hidden',
  companySecret: 'confidential',
  userData: 'public',
}

const sanitizedCustom = sanitizeWithCustomKeys(dataWithCustomSensitive, [
  'internalNote',
  'companySecret',
])
console.log(sanitizedCustom)
// Result: { id: 1, publicInfo: 'visible', userData: 'public' }

// ============================================
// Example 6: In Express controller
// ============================================
import { Request, Response } from 'express'
import { ResponseData } from './Response'
import prisma from '@/config/database'

export const getUserController = async (req: Request, res: Response) => {
  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
    })

    if (!user) {
      return ResponseData.notFound(res, 'User not found')
    }

    // Sanitize before sending response
    const sanitizedUser = sanitizeUser(user)

    return ResponseData.ok(res, sanitizedUser, 'User retrieved successfully')
  } catch (error) {
    return ResponseData.serverError(res, error)
  }
}

// ============================================
// Example 7: Array of objects with nested sensitive data
// ============================================
const complexData = {
  users: [
    {
      id: 1,
      email: 'user1@example.com',
      password: 'secret1',
      sessions: [
        { id: 'session1', token: 'token1', device: 'mobile' },
        { id: 'session2', token: 'token2', device: 'desktop' },
      ],
    },
    {
      id: 2,
      email: 'user2@example.com',
      password: 'secret2',
      sessions: [{ id: 'session3', token: 'token3', device: 'tablet' }],
    },
  ],
  metadata: {
    total: 2,
    apiKey: 'should_be_removed',
  },
}

const sanitizedComplex = sanitizeResponse(complexData, { deep: true })
console.log(sanitizedComplex)
// Result: { users: [{ id: 1, email: 'user1@example.com', sessions: [{ id: 'session1', device: 'mobile' }, ...] }], metadata: { total: 2 } }

// ============================================
// Example 8: Without deep sanitization
// ============================================
const shallowSanitize = sanitizeResponse(userWithProfile, { deep: false })
console.log(shallowSanitize)
// Result: { id: 1, email: 'user@example.com', profile: { firstName: 'John', lastName: 'Doe', privateKey: 'private_key_data', settings: { ... } } }
// Note: nested objects are NOT sanitized when deep: false
