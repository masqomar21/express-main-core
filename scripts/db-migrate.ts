import { execSync } from 'child_process'
import * as readline from 'readline'

function run(cmd: string) {
  console.log(`\x1b[36m> ${cmd}\x1b[0m`)
  execSync(cmd, { stdio: 'inherit' })
}

function runCapture(cmd: string): string {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' })
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

  try {
    console.log(`\n🚀 [1/3] Emitting contract...`)
    run('npx prisma contract emit')

    // Cek status migrasi via JSON output
    let needsPlanning = false
    try {
      const statusOutput = runCapture('npx prisma migration status')
      const parsed = JSON.parse(statusOutput)
      const appSpace = parsed.envelope?.result?.spaces?.find((s: any) => s.space === 'app')

      if (appSpace) {
        const { currentContract, targetContract } = appSpace
        // Jika hash contract saat ini berbeda dengan hash target (ada perubahan schema)
        if (currentContract !== targetContract) {
          needsPlanning = true
        }
      }
    } catch {
      needsPlanning = true
    }

    if (needsPlanning) {
      if (!name) {
        name = await promptName()
      }
      console.log(`\n📋 [2/3] New schema changes detected. Planning migration: "${name}"...`)
      run(`npx prisma migration plan --name "${name}"`)
    } else {
      console.log(`\n⏭️  [2/3] No schema changes to plan. Skipping plan step.`)
    }

    console.log(`\n⚡ [3/3] Applying migration to database...`)
    run('npx prisma db migrate --advance-ref db')

    console.log(`\n✅ Database is up to date!\n`)
  } catch (error) {
    console.error('\n❌ Migration failed.')
    process.exit(1)
  }
}

main()
