/**
 * Parses command line arguments starting with `::` and returns an object.
 * Valid arguments must be specified in the `validArgs` array.
 * If an argument is boolean (no value provided), it will be set to true.
 * If a required value is missing, the process will exit with an error message.
 *
 * @param {string[]} validArgs - Array of valid argument names (without `::` prefix).
 * @returns {Object} Parsed arguments as key-value pairs.
 */
export default function parsingArgs(validArgs: string[]): { [key: string]: string | boolean } {
  const args = process.argv.slice(2)
  const argsObj: { [key: string]: string | boolean } = {}

  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    if (!key.startsWith('::')) continue

    const cleanKey = key.slice(2)
    const value = args[i + 1]

    if (!value || value.startsWith('::')) {
      // Boolean flag
      if (validArgs.includes(key)) {
        argsObj[cleanKey] = true
        continue
      }
      console.error(`❌ Missing value for: ${key}`)
      process.exit(1)
    }

    if (validArgs.includes(key)) {
      argsObj[cleanKey] = value
      i++
    }
  }

  return argsObj
}
