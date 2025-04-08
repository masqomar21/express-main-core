export default function parsingArgs(validArgs: string[]): { [key: string]: string } {
  const args = process.argv.slice(2)
  const argsObj: { [key: string]: string } = {}

  for (let i = 0; i < args.length; i++) {
    const key = args[i]

    if (!key.startsWith('--')) continue

    const value = args[i + 1]
    if (!value || value.startsWith('--')) {
      console.error(`Invalid value for argument: ${key}`)
      process.exit(1)
    }

    if (validArgs.includes(key)) {
      argsObj[key.slice(2)] = value
    }

    i++ // skip the value on next loop
  }

  return argsObj
}