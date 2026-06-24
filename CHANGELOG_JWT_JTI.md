# JWT JTI (JWT ID) Implementation

**Date:** 2026-06-24  
**Status:** ✅ Completed  
**Related:** Bug fix for JWT Token Logout Issue

---

## 📝 What Was Changed

### 1. Updated JWT Payload Interface
**File:** `src/types/global.d.ts`

Added `jti` (JWT ID) field to the JWT payload interface:

```typescript
interface jwtPayloadInterface extends JwtPayload {
  id: number
  name: string
  role?: string
  roleType: JwtRoleType
  purpose: 'ACCESS_TOKEN' | 'RESET_PASSWORD' | 'VERIFY_EMAIL'
  jti?: string // ✨ NEW: JWT ID - unique identifier for token revocation
}
```

### 2. Updated JWT Token Generation
**File:** `src/utilities/JwtHanldler.ts`

Modified `generateAccesToken()` to automatically generate and include a unique UUID as `jti`:

```typescript
import { v4 as uuidv4 } from 'uuid'

export const generateAccesToken = function (
  payload: jwtPayloadInterface,
  secretToken: string,
  expiresIn: number,
): string {
  // Generate unique JWT ID (jti) for token revocation tracking
  const tokenPayload = {
    ...payload,
    jti: uuidv4(), // Add unique identifier for this token
  }
  return jwt.sign(tokenPayload, secretToken, { expiresIn })
}
```

---

## ✨ Benefits

### 1. **Token Revocation Tracking**
- Each JWT now has a unique identifier (`jti`)
- Enables tracking which tokens have been revoked
- Prevents token reuse after logout

### 2. **Enhanced Security**
- Follows JWT best practices (RFC 7519)
- Reduces risk of token replay attacks
- Better audit trail for authentication events

### 3. **Future-Proof Architecture**
- Foundation for implementing token blacklist/whitelist
- Enables per-token revocation (not just per-user)
- Can be used for refresh token rotation

---

## 🔄 Automatic Propagation

**No code changes needed in controllers!** 

Since the `jti` generation is centralized in `generateAccesToken()`, all existing token generation automatically includes `jti`:

✅ **AuthController.ts** - Login tokens  
✅ **ProfileController.ts** - Password change tokens  
✅ **ResetPasswordController.ts** - Reset password tokens  
✅ **AuthRoute.ts** - Google OAuth tokens  

---

## 📊 Example JWT Payload

**Before:**
```json
{
  "id": 1,
  "name": "John Doe",
  "role": "Admin",
  "roleType": "SUPER_ADMIN",
  "purpose": "ACCESS_TOKEN",
  "iat": 1719192000,
  "exp": 1719278400
}
```

**After (with jti):**
```json
{
  "id": 1,
  "name": "John Doe",
  "role": "Admin",
  "roleType": "SUPER_ADMIN",
  "purpose": "ACCESS_TOKEN",
  "jti": "f47ac10b-58cc-4372-a567-0e02b2c3d479", // ✨ NEW
  "iat": 1719192000,
  "exp": 1719278400
}
```

---

## 🔐 Security Considerations

### Current Implementation
- `jti` is generated as UUIDv4 (cryptographically random)
- `jti` is embedded in JWT and signed with secret
- Session table still stores full token for validation

### Future Enhancements (Optional)

#### Option 1: Store JTI in Database
```typescript
// Update Session model to include jti
model Session {
  id        Int      @id @default(autoincrement())
  userId    Int
  token     String   @unique
  jti       String   @unique  // ✨ NEW: Store jti separately
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Benefits:**
- Faster token lookups (index on jti)
- Enable token revocation by jti alone
- Better query performance

#### Option 2: Implement Token Blacklist
```typescript
// Create new table for revoked tokens
model RevokedToken {
  id        Int      @id @default(autoincrement())
  jti       String   @unique
  revokedAt DateTime @default(now())
  expiresAt DateTime // Clean up after expiry
  reason    String?  // Why it was revoked
}
```

**Benefits:**
- Track revoked tokens explicitly
- Add revocation reasons for audit
- Scheduled cleanup of expired revoked tokens

---

## 🧪 Testing

### Verify JTI Generation
```bash
# Login and inspect the JWT token
POST /api/auth/login
# Decode the returned JWT at https://jwt.io
# Verify that 'jti' field exists with a valid UUID
```

### Verify Token Uniqueness
```typescript
// Each login generates a unique jti
const token1 = await login(credentials)
const token2 = await login(credentials)

const decoded1 = jwt.decode(token1)
const decoded2 = jwt.decode(token2)

console.log(decoded1.jti !== decoded2.jti) // Should be true
```

---

## 📚 References

- [RFC 7519 - JWT Standard](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.7)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [UUID v4 Specification](https://datatracker.ietf.org/doc/html/rfc4122#section-4.4)

---

## ✅ Checklist

- [x] Updated `jwtPayloadInterface` to include `jti`
- [x] Modified `generateAccesToken()` to generate UUID
- [x] Verified `uuid` package is in dependencies
- [x] All existing token generation now includes `jti`
- [x] No breaking changes to existing code
- [ ] Optional: Update Prisma schema to store `jti` separately
- [ ] Optional: Implement token blacklist for revocation

