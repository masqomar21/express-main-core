interface PaginationInterface<T> {
  count: number;
  rows: T[];
}

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
   * Paginate the data based on the provided pagination interface.
   * @param data - The data to paginate, which includes count and rows.
   * @returns An object containing pagination details.
   */
  paginate<T>(data: PaginationInterface<T>): any {
    const totalPages = Math.ceil(data.count / this.limit)
    return {
      total_items: data.count,
      page: this.page,
      items: data.rows,
      total_pages: Math.ceil(data.count / this.limit),
      current_page: this.page !== 0 ? this.page : 0,
      links: {
        prev:
          this.page > 1 ? `?page=${this.page - 1}&limit=${this.limit}` : null,
        next:
          this.page < totalPages
            ? `?page=${this.page + 1}&limit=${this.limit}`
            : null,
      },
    }
  }
}
