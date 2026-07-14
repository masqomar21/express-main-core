# Response Sanitizer - Complete Integration Guide

## Overview

Response Sanitizer adalah utility yang secara otomatis menghapus data sensitif dari response sebelum dikirim ke client. Dirancang untuk melindungi dari kebocoran informasi sensitif seperti password, token, API keys, dan data confidential lainnya.

## Fitur Utama

- ✅ **Automatic Sanitization** - Hapus data sensitif secara otomatis
- ✅ **Deep Nested Objects** - Sanitasi objek dan array bersarang
- ✅ **Custom Sensitive Keys** - Tambah key sensitif custom
- ✅ **Flexible Options** - Pilih untuk menghapus atau replace dengan `[REDACTED]`
- ✅ **Multiple Methods** - Berbagai cara sesuai kebutuhan
- ✅ **Zero Performance Impact** - Hanya sanitasi saat diperlukan

## Default Sensitive Keys

Berikut key yang akan dihapus secara otomatis:

```
password, passwordHash, currentPassword, newPassword, oldPassword, confirmPassword
token, accessToken, refreshToken, authToken, sessionToken
apiKey, secret, secretKey, privateKey
otp, otpSecret, jti, salt, hash
verificationToken, resetToken
creditCard, cardNumber, cvv, pin, ssn
bankAccount, iban, swift
encryptionKey
```

## Installation & Setup

### 1. File yang Sudah Dibuat

```
src/utilities/
├── ResponseSanitizer.ts           (Core sanitizer logic)
├── ResponseWithSanitizer.ts       (Enhanced Response utilities)
└── ResponseSanitizer.example.ts   (Usage examples)

src/middleware/
└── AutoSanitizeMiddleware.ts      (Auto-sanitize middleware)
```

### 2. Setup di App.ts

```typescript
import { autoSanitizeMiddleware } from '@/middleware/AutoSanitizeMiddleware'

// Option A: Dengan auto-sanitize middleware (defensive layer)
app.use(autoSanitizeMiddleware({ enabled: true }))

// Option B: Tanpa middleware, sanitasi manual per endpoint (recommended)
// Lebih performant dan explicit
```

## Usage Patterns

### Pattern 1: Basic User Response

```typescript
import { ResponseDataWithSanitizer } from '@/utilities/ResponseWithSanitizer'

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    })

    // Automatically removes password, token, etc
    return ResponseDataWithSanitizer.okUser(res, user, 'User retrieved')
  } catch (error) {
    return ResponseDataWithSanitizer.serverError(res, error)
  }
}
```

### Pattern 2: Array of Users

```typescript
export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany()

    // Sanitizes all users in array
    return ResponseDataWithSanitizer.okUsers(res, users, 'Users list')
  } catch (error) {
    return ResponseDataWithSanitizer.serverError(res, error)
  }
}
```

### Pattern 3: Generic Data with Sanitization

```typescript
export const getProfile = async (req: Request, res: Response) => {
  try {
    const profile = await getProfileData()

    // Generic sanitization with deep nested support
    return ResponseDataWithSanitizer.ok(res, profile, 'Profile retrieved')
  } catch (error) {
    return ResponseDataWithSanitizer.serverError(res, error)
  }
}
```

### Pattern 4: Custom Sensitive Keys

```typescript
export const getCompanyData = async (req: Request, res: Response) => {
  try {
    const data = await getCompanyInfo()

    // Add custom sensitive keys to remove
    return ResponseDataWithSanitizer.ok(res, data, 'Company data', {
      customSensitiveKeys: ['internalNote', 'budgetAmount', 'companySecret'],
      deep: true,
    })
  } catch (error) {
    return ResponseDataWithSanitizer.serverError(res, error)
  }
}
```

### Pattern 5: Non-Sensitive Data (Raw Response)

```typescript
export const getPublicConfig = async (req: Request, res: Response) => {
  try {
    const config = await getPublicConfiguration()

    // Use Raw methods when you're sure there's no sensitive data
    return ResponseDataWithSanitizer.okRaw(res, config, 'Config retrieved')
  } catch (error) {
    return ResponseDataWithSanitizer.serverError(res, error)
  }
}
```

## Direct Usage (Without Response Utilities)

```typescript
import { sanitizeResponse, sanitizeUser } from '@/utilities/ResponseSanitizer'

// Sanitize any object
const sanitized = sanitizeResponse(userData)

// Sanitize user specifically
const sanitizedUser = sanitizeUser(userData)

// With custom keys
const custom = sanitizeResponse(data, {
  customSensitiveKeys: ['field1', 'field2'],
  deep: true,
})

// Replace with [REDACTED] instead of removing
const redacted = sanitizeResponse(data, {
  replaceWithRedacted: true,
  deep: true,
})
```

## Migration Checklist

### Step 1: Replace Imports in Controllers

```diff
- import { ResponseData } from '@/utilities/Response'
+ import { ResponseDataWithSanitizer } from '@/utilities/ResponseWithSanitizer'
```

### Step 2: Update Method Calls

```diff
- return ResponseData.ok(res, user)
+ return ResponseDataWithSanitizer.okUser(res, user)

- return ResponseData.ok(res, users)
+ return ResponseDataWithSanitizer.okUsers(res, users)

- return ResponseData.ok(res, data)
+ return ResponseDataWithSanitizer.ok(res, data)
```

### Step 3: Test Responses

Verify sensitive data is removed from responses

## Performance Considerations

| Approach | Performance | Security | Recommendation |
|----------|-------------|----------|-----------------|
| **Auto-Sanitize Middleware** | Medium (all responses) | High (defensive) | Dev/Staging |
| **Manual per-endpoint** | High (selective) | High (explicit) | Production (Recommended) |
| **No sanitization** | Highest | Low (risky) | ❌ Not recommended |

## Best Practices

1. **Use Specific Methods** - Gunakan `okUser()` untuk user, `okUsers()` untuk array
2. **Be Explicit** - Lebih baik sanitasi manual daripada rely on middleware
3. **Test Output** - Verify sensitive data tidak ada di response
4. **Document Custom Keys** - Jelaskan custom sensitive keys yang ditambah
5. **Don't Mix Approaches** - Pilih satu pattern dan consistent
6. **Check Nested Data** - Pastikan `deep: true` untuk nested objects

## Common Pitfalls

### ❌ Wrong: Mixing sensitized dan non-sensitized

```typescript
// Ini akan inconsistent
return ResponseData.ok(res, user) // tidak sanitasi
return ResponseDataWithSanitizer.ok(res, user) // sanitasi
```

### ❌ Wrong: Sanitasi data yang sudah di-sanitasi

```typescript
const sanitized = sanitizeUser(user)
return ResponseDataWithSanitizer.ok(res, sanitized) // double sanitize
```

### ✅ Correct: Consistent approach

```typescript
// Pilih satu dan gunakan consistent
return ResponseDataWithSanitizer.okUser(res, user)
return ResponseDataWithSanitizer.okUsers(res, users)
```

## Testing

### Test Sanitization

```typescript
import { sanitizeUser } from '@/utilities/ResponseSanitizer'

describe('ResponseSanitizer', () => {
  it('should remove password from user', () => {
    const user = {
      id: 1,
      email: 'user@example.com',
      password: 'secret123',
    }

    const sanitized = sanitizeUser(user)

    expect(sanitized).not.toHaveProperty('password')
    expect(sanitized.email).toBe('user@example.com')
  })
})
```

## Troubleshooting

### Issue: Sensitive data still in response

**Solution:**
1. Check method digunakan (user vs generic)
2. Verify `deep: true` untuk nested objects
3. Add ke custom keys jika needed

### Issue: Data hilang yang seharusnya ada

**Solution:**
1. Verify bukan sensitive key
2. Check custom keys config
3. Test dengan `replaceWithRedacted: true` untuk debug

## Next Steps

1. ✅ Copy files ke project
2. ⬜ Update imports di controllers
3. ⬜ Ganti ResponseData calls
4. ⬜ Test responses
5. ⬜ Deploy ke staging
6. ⬜ Monitor production logs
