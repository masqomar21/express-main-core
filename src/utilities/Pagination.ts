// interface PaginationInterface<T> {
//   count: number;
//   rows: T[];
// }

import { Response, Request} from 'express'
import { ResponseData } from './Response'

export class Pagination {
  page: number
  limit: number
  offset: number
  orderBy: Record<string, 'asc' | 'desc'> = {}
  isOrderBySet: boolean = false

  setOrderBy(orderBy: Record<string, 'asc' | 'desc'>) {
    this.orderBy = orderBy
    this.isOrderBySet = true
  }

  buildOrderBy(res: Response, reqQuery : Request['query'], validFields: string[]) {
    const orderByParams = reqQuery.orderBy
    if (!orderByParams || typeof orderByParams !== 'string') {
      return
    }
    const [field, direction] = orderByParams.split('_')

    if (!validFields.includes(field)) {
      return ResponseData.validateError(res, {
        orderBy: `Invalid orderBy field. Valid fields are: ${validFields.join(', ')}`,
      })
    }

    const validDirections = ['asc', 'desc']
    if (!validDirections.includes(direction)) {
      return ResponseData.validateError(res, {
        orderBy: `Invalid orderBy direction. Valid directions are: ${validDirections.join(', ')}`,
      })
    }

    this.setOrderBy({ [field]: direction as 'asc' | 'desc' })
  }

  constructor(page: any, size: any) {
    this.page = isNaN(Number(page)) ? 1 : Number(page)
    this.limit = isNaN(Number(size)) ? 10 : Number(size)
    this.offset = (this.page - 1) * this.limit
  }

  /**
   * Generates a pagination object.
   * @param count - Total number of items.
   * @param data - Array of items for the current page.
   * @returns An object containing pagination details.
   */
  paginate<T>(count: number, data: T[], other?: any): any {
    const totalPages = Math.ceil(count / this.limit)
    return {
      total_items: count,
      page: this.page,
      items: data,
      total_pages: Math.ceil(count / this.limit),
      current_page: this.page !== 0 ? this.page : 0,
      links: {
        prev: this.page > 1 ? `?page=${this.page - 1}&limit=${this.limit}` : null,
        next: this.page < totalPages ? `?page=${this.page + 1}&limit=${this.limit}` : null,
      },
      other: other || undefined,
    }
  }
}
