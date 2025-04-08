export default function parsingArgs(validArgs: string[]): { [key: string]: string | boolean } {
  const args = process.argv.slice(2)
  const argsObj: { [key: string]: string | boolean } = {}

  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    if (!key.startsWith('--')) continue

    const cleanKey = key.slice(2)
    const value = args[i + 1]

    if (!value || value.startsWith('--')) {
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
