interface FileType {
  mimetype: string
  buffer: Buffer
  originalname: string
}

type JwtRoleType = 'OTHER' | 'SUPER_ADMIN'

interface jwtPayloadInterface extends JwtPayload {
  id: number
  name: string
  role?: string
  roleType: JwtRoleType
  purpose: 'ACCESS_TOKEN' | 'RESET_PASSWORD' | 'VERIFY_EMAIL'
}

interface ResponseDataAttributes<T> {
  status: number
  message: string | null
  error?: string | null
  data?: T | null
}

// ===== Interface Definitions ====
interface PDFExportColumn {
  header: string
  key: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface PDFExportOptions {
  title?: string
  pageSize?: 'A4' | 'A3' | 'Letter'
  printBackground?: boolean
  orientation?: 'portrait' | 'landscape'
  preferCSSPageSize?: boolean
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

interface PDFStandardExportOptions extends PDFExportOptions {
  columns: PDFExportColumn[]
  data: Record<string, any>[]
}

interface PDFStandardFileExportOptions extends PDFStandardExportOptions {
  fileName: string
  outputDir?: string
}

interface PDFFileExportOptions extends PDFExportOptions {
  fileName: string
  outputDir?: string
}

interface ExcelExportColumn {
  header: string // Label kolom di Excel
  key: string // Key dari data object
  width?: number // Lebar kolom (optional)
}

interface ExcelExportOptions {
  columns: ExcelExportColumn[]
  data: Record<string, any>[]
  sheetName?: string
}

interface ExcelFileExportOptions extends ExcelExportOptions {
  fileName: string
  outputDir?: string
}

type AwsUploadJobData = {
  tempFilePath: string
  destinationKey: string
  modelName: string
  recordId: number | string
  updateData: Record<string, any>
  fieldNameToUpdate: string
}

type PermissionList = 'Dashboard' | 'User_Management' | 'Master_Data'
// Add more permissions as needed

interface GeneratedPermissionList {
  permission: PermissionList
  canRead: boolean
  canWrite: boolean
  canUpdate: boolean
  canDelete: boolean
  canRestore: boolean
}

type ErrorFileUpload =
  | 'LIMIT_FILE_COUNT'
  | 'LIMIT_UNEXPECTED_FILE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'FILE_NOT_FOUND'
  | 'UPLOAD_ERROR'
