import fs from 'fs'
import path from 'path'

export function getBuildInfo() {
  const buildInfoPath = path.join(process.cwd(), 'build/buildInfo.json')
  try {
    const data = fs.readFileSync(buildInfoPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    // fallback for dev or first run
    return {
      buildTime: 'dev',
      buildDate: 'dev',
      gitCommit: 'dev',
      gitBranch: 'dev',
      gitTag: 'dev',
    }
  }
}
