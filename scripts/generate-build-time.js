const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync

function runGitCommand(cmd) {
  try {
    return execSync(cmd).toString().trim()
  } catch {
    return ''
  }
}

const buildInfo = {
  buildTime: new Date().toISOString(),
  buildFromated : new Date().toLocaleString( 'id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }),
  gitCommit: runGitCommand('git rev-parse HEAD'),
  gitBranch: runGitCommand('git rev-parse --abbrev-ref HEAD'),
  gitTag: runGitCommand('git describe --tags --abbrev=0 || echo ""'),
}

const outPath = path.join(__dirname, '../build/buildInfo.json')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(buildInfo, null, 2))

console.log('✅ buildInfo.json generated')
