// interface PaginationInterface<T> {
//   count: number;
//   rows: T[];
// }

export class Pagination {
  page: number
  limit: number
  offset: number

  constructor(page: number | string, size: number | string) {
    this.page = parseInt(page as string) || 1
    this.limit = parseInt(size as string) || 10
    this.offset = (this.page - 1) * this.limit
  }

  /**
   * Generates a pagination object.
   * @param count - Total number of items.
   * @param data - Array of items for the current page.
   * @returns An object containing pagination details.
   */
  paginate<T>(count: number, data: T[]): any {
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
    }
  }
}
