export function mergeDateAndTime(dateStr: string, timeStr: string): Date {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number)
  const date = new Date(dateStr)
  date.setHours(hours || 0, minutes || 0, seconds || 0, 0)
  return date
}

export const formatRupiah = (value: number | string, options?: Intl.NumberFormatOptions) => {
  if (value === null || value === undefined || value === '') return ''

  const numeric = typeof value === 'number' ? value : Number(value.replace(/[^0-9]/g, ''))

  if (Number.isNaN(numeric)) return ''

  return new Intl.NumberFormat(
    'id-ID',
    options ?? {
      style: 'currency',
      currency: 'IDR',
    },
  ).format(numeric)
}

export const formatTimeForDB = (timeStr: string): Date => {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number)
  const date = new Date('1970-01-01T00:00:00.000Z')
  date.setHours(hours || 0, minutes || 0, seconds || 0, 0)
  return date
}
