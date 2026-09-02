export interface DateTimeFilter {
  gte?: Date
  lte?: Date
}

/**
 * Membuat filter tanggal dinamis.
 * @param startDate string | undefined - tanggal mulai (format ISO atau yyyy-mm-dd)
 * @param endDate string | undefined - tanggal akhir (format ISO atau yyyy-mm-dd)
 * @returns DateTimeFilter - berisi gte dan/atau lte sesuai input
 */
export function buildDateFilter(startDate?: string, endDate?: string): DateTimeFilter {
  const filterDate: DateTimeFilter = {}

  if (startDate && !isNaN(Date.parse(startDate))) {
    filterDate.gte = new Date(startDate)
  }

  if (endDate && !isNaN(Date.parse(endDate))) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // ke akhir hari
    filterDate.lte = end
  }

  return filterDate
}
