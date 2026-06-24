# 🐛 Bug Report - Maincore BE Code Starter

**Generated:** June 24, 2026  
**Severity Levels:** 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🔵 LOW

---

## 🔴 CRITICAL ISSUES

### 1. **CORS Security Vulnerability - Allows All Origins**
**File:** `app.ts:40-47`  
**Severity:** CRITICAL  
**Issue:** CORS is configured to accept requests from ANY origin, then headers are also set with wildcard
```typescript
app.use(cors({ origin: true, credentials: true })) // ❌ Accept ALL origins
// ... then again:
res.setHeader('Access-Control-Allow-Origin', '*') // ❌ Wildcard header
```
**Impact:** Exposes API to cross-site attacks, data theft, unauthorized requests from any domain  
**Fix:** Whitelist specific origins from config:
```typescript
const allowedOrigins = CONFIG.client.callBackallowOrigin
app.use(cors({ origin: allowedOrigins, credentials: true }))
```

### 2. **S3 Credentials Hardcoded with Insecure Defaults**
**File:** `src/config/index.ts:39-45`  
**Severity:** CRITICAL  
**Issue:** S3 credentials have default fallback values instead of requiring env vars
```typescript
accessKeyId: process.env.S3_ACCESS_KEY_ID || 'default_access_key_id', // ❌ Default
secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'default_secret_access_key', // ❌ Default
```
**Impact:** If env vars missing, fake credentials are used. Code may fail silently or expose default values in logs  
**Fix:** Require environment variables, fail loudly:
```typescript
if (!process.env.S3_ACCESS_KEY_ID) throw new Error('S3_ACCESS_KEY_ID is required')
accessKeyId: process.env.S3_ACCESS_KEY_ID,
secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
```

### 3. **JWT Token Not Properly Invalidated on Logout**
**File:** `src/controllers/auth/AuthController.ts:191-204`  
**Severity:** CRITICAL  
**Issue:** Logout deletes session with both `userId` AND `token`, but if query fails, token remains valid
```typescript
await prisma.session.delete({
  where: {
    userId: userLogin.id,
    token: token, // ❌ Both conditions - if neither unique, partial deletion
  },
})
```
**Impact:** Token could remain valid if deletion fails, allowing reuse after logout  
**Fix:** Ensure token is unique in schema, delete by token only:
```typescript
await prisma.session.deleteMany({ where: { token } })
```

---

## 🟠 HIGH PRIORITY ISSUES

### 4. **Fire-and-Forget Async Operation Without Error Propagation**
**File:** `src/services/NotificationService.ts:153-190`  
**Severity:** HIGH  
**Issue:** `sendNotification()` uses IIFE that never awaits, errors silently fail
```typescript
;(async () => {
  try {
    // ... async operations
  } catch (error) {
    logger.error('Failed to send notification asynchronously:', error) // ❌ Only logs
  }
})() // ❌ Not awaited, fire-and-forget
```
**Impact:** Notification failures go undetected, user receives 200 OK but notifications may not send  
**Fix:** Return promise or use proper queue/background job system

### 5. **Missing Response in TestController**
**File:** `src/controllers/master/TestController.ts:140-160`  
**Severity:** HIGH  
**Issue:** `testMultyArrarFileUplad()` doesn't return response on success
```typescript
async testMultyArrarFileUplad(req: Request, res: Response) {
  // ... processing loop
  } catch (error) {
    return ResponseData.serverError(res, error)
  }
  // ❌ No return statement on success!
}
```
**Impact:** Request hangs, client never receives response  
**Fix:** Add `return ResponseData.ok(res, data, 'Files uploaded')`

### 6. **Type Safety: Unsafe `as any` Casts**
**File:** Multiple locations  
**Severity:** HIGH  
**Issue:** Multiple untyped casts bypass TypeScript safety
- `src/config/index.ts:55` - `seederModule as any`
- `src/workers/AwsUploadWorker.ts:57` - `prisma as any`
- `src/controllers/notification/NotificationController.ts:37-38` - `search as any`

**Impact:** Potential runtime errors, lost type checking benefits  
**Fix:** Use proper types or create type guards

### 7. **Redis Error Handling - Swallows Errors**
**File:** `src/config/redis.ts:32-38, 50-57, 63-70`  
**Severity:** HIGH  
**Issue:** Redis operations catch errors but only log, return silently
```typescript
async set<T>(key: string, value: T, expInSecond: number = 3600): Promise<void> {
  try {
    // ...
  } catch (error) {
    logger.error('❌ Redis set error:', error) // ❌ Only logs, doesn't throw
  }
}
```
**Impact:** Cache failures go undetected; callers think data was cached when it wasn't  
**Fix:** Return success boolean or throw error

### 8. **Inefficient Permission Filtering - Client-Side**
**File:** `src/middleware/PermissionMidlleware.ts:92-100`  
**Severity:** HIGH  
**Issue:** Fetches all permissions then filters in JavaScript
```typescript
const permissionList: GeneratedPermissionList[] = userPermissions.role.rolePermissions
  .map(perm => ({ /* ... */ }))
// ❌ If user has 1000 permissions, all loaded into memory
```
**Impact:** N+1 queries, memory waste, slow performance  
**Fix:** Filter in database query with `.where()` clause

---

## 🟡 MEDIUM PRIORITY ISSUES

### 9. **SQL Injection Risk - File URL Parsing**
**File:** `src/utilities/S3Handler.ts:110-115`  
**Severity:** MEDIUM  
**Issue:** URL parsing uses simple string split without validation
```typescript
const filePath = fileUrl.split('/').slice(indexSLice).join('/') // ❌ Naive parsing
```
**Impact:** Malformed URLs could lead to path traversal or deletion of wrong files  
**Fix:** Use URL parser and validate key format

### 10. **Missing Transaction in Related Operations**
**File:** `src/controllers/auth/AuthController.ts:79-96`  
**Severity:** MEDIUM  
**Issue:** User creation and session creation should be atomic
```typescript
const userData = await prisma.user.create({ /* ... */ }) // ❌ First
// If next operation fails, orphaned user
await prisma.session.create({ data: { userId, token } }) // ❌ Second
```
**Impact:** Data inconsistency if second operation fails  
**Fix:** Wrap in `prisma.$transaction()`

### 11. **Buffer Stored Entirely in Memory**
**File:** `src/utilities/UploadHandler.ts:234`  
**Severity:** MEDIUM  
**Issue:** File buffers kept in memory during upload
```typescript
const buffer: Buffer = file.buffer ?? fs.readFileSync(file.path) // ❌ Large file in RAM
```
**Impact:** Large file uploads consume significant memory, OOM risk  
**Fix:** Use streams for large files

### 12. **Cursor Loop Without Error Handling**
**File:** `src/config/redis.ts:99-107`  
**Severity:** MEDIUM  
**Issue:** Pattern deletion cursor loop doesn't handle `scan` errors
```typescript
async deleteKeysByPattern(pattern: string) {
  let cursor = '0'
  do {
    const [nextCursor, foundKeys] = await this.client.scan(...) // ❌ If error, loop breaks
    // ...
  } while (cursor !== '0')
}
```
**Impact:** Partial deletion, infinite loop risk if error occurs  
**Fix:** Add try-catch inside loop

---

## 🔵 LOW PRIORITY ISSUES

### 13. **Weak Password Validation**
**File:** `src/schema/UserSchema.ts:9, 26`  
**Severity:** LOW  
**Issue:** Password only requires 6 characters minimum
```typescript
password: z.string().min(6, 'Password minimal harus 6 karakter'), // Only 6 chars!
```
**Impact:** Weak passwords allowed  
**Fix:** Enforce complexity rules, increase minimum to 10+

### 14. **OTP Code Stored as Plain String**
**File:** `src/controllers/auth/ResetPasswordController.ts:41`  
**Severity:** LOW  
**Issue:** OTP stored unencrypted in database
**Impact:** Database breach exposes active OTP codes  
**Fix:** Hash OTP codes like passwords

### 15. **Typo in Filename**
**File:** `src/middleware/PermissionMidlleware.ts`  
**Severity:** LOW  
**Issue:** Filename typo: "Midlleware" should be "Middleware"  
**Fix:** Rename file to `PermissionMiddleware.ts`

### 16. **Inconsistent Error Response Formats**
**File:** Multiple controllers  
**Severity:** LOW  
**Issue:** Some endpoints return `{ message }`, others `{ data }`, inconsistent structure  
**Fix:** Standardize response format across all endpoints

### 17. **Missing Input Validation on Query Parameters**
**File:** `src/controllers/auth/ResetPasswordController.ts:138`  
**Severity:** LOW  
**Issue:** Token query param checked for existence but not validated format
```typescript
const { token } = req.query // ❌ No format validation
```
**Fix:** Validate token format before JWT verification

### 18. **Verbose Query Logging in Production**
**File:** `src/config/database.ts:28-36`  
**Severity:** LOW  
**Issue:** All queries logged to stdout including in production
```typescript
log: [
  { emit: 'stdout', level: 'info' }, // ❌ Logs to console always
],
```
**Impact:** Performance hit, noisy logs in production  
**Fix:** Only enable for development mode

---

## 📊 Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 3 |
| 🟠 HIGH | 5 |
| 🟡 MEDIUM | 6 |
| 🔵 LOW | 6 |
| **TOTAL** | **20** |

---

## ✅ Recommended Action Plan

### Phase 1 (Immediate - Critical):
1. Fix CORS configuration (Issue #1)
2. Require S3 credentials (Issue #2)  
3. Validate JWT token invalidation (Issue #3)

### Phase 2 (Urgent - High):
4. Add proper error handling to notification service (Issue #4)
5. Fix missing response in TestController (Issue #5)
6. Remove `as any` casts (Issue #6)
7. Make Redis errors throw or return status (Issue #7)

### Phase 3 (Soon - Medium):
8. Move permission filtering to database (Issue #8)
9. Validate S3 file URLs properly (Issue #9)
10. Add transactions to related operations (Issue #10)

### Phase 4 (Nice to have - Low):
11. Improve password policy (Issue #13)
12. Hash OTP codes (Issue #14)
13. Rename file and fix inconsistencies (Issues #15-18)

