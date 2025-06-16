export class DatabaseError extends Error {
  constructor (message, options = {}) {
    super(message, options)

    this.name = options.name || 'DatabaseError'
    this.code = options.code
  }
}
