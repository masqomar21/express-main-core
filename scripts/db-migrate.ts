import { execSync } from 'child_process'
import * as readline from 'readline'

function run(cmd: string) {
  console.log(`\x1b[36m> ${cmd}\x1b[0m`)
  execSync(cmd, { stdio: 'inherit' })
}

function promptName(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question('Enter migration name: ', (answer) => {
      rl.close()
      resolve(answer.trim() || 'migration')
    })
  })
}

async function main() {
  const args = process.argv.slice(2)
  let name = ''

  const nameIndex = args.findIndex((arg) => arg === '--name' || arg === '-n')
  if (nameIndex !== -1 && args[nameIndex + 1]) {
    name = args[nameIndex + 1]
  } else if (args[0] && !args[0].startsWith('-')) {
    name = args[0]
  }

  if (!name) {
    name = await promptName()
  }

  try {
    console.log(`\n🚀 [1/3] Emitting contract...`)
    run('npx prisma contract emit')

    console.log(`\n📋 [2/3] Planning migration: "${name}"...`)
    run(`npx prisma migration plan --name "${name}"`)

    console.log(`\n⚡ [3/3] Applying migration to database...`)
    run('npx prisma db migrate --advance-ref db')

    console.log(`\n✅ Migration "${name}" successfully created and applied!\n`)
  } catch (error) {
    console.error('\n❌ Migration failed.')
    process.exit(1)
  }
}

main()
