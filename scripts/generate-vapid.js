#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const webpush = require("web-push")

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === "--file") out.file = args[++i]
    else if (a === "--client") out.client = args[++i]
    else if (a === "--subject") out.subject = args[++i]
  }
  return out
}

function ensureDirOf(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}
function readEnv(filePath) { try { return fs.readFileSync(filePath, "utf8") } catch { return "" } }
function backupEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const bak = filePath + ".bak"
    fs.copyFileSync(filePath, bak)
    console.log(`🗄️  Backup created: ${bak}`)
  }
}
function upsertEnv(envContent, kv) {
  const lines = envContent.split(/\r?\n/)
  const keys = Object.keys(kv)
  const set = new Set(keys)
  const updated = lines.map((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) return line
    const k = m[1]
    if (set.has(k)) {
      const v = kv[k]
      set.delete(k)
      return `${k}=${v}`
    }
    return line
  })
  for (const k of set) updated.push(`${k}=${kv[k]}`)
  return updated.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n") + "\n"
}
function writeEnv(filePath, kv) {
  ensureDirOf(filePath)
  const current = readEnv(filePath)
  backupEnv(filePath)
  const next = upsertEnv(current, kv)
  fs.writeFileSync(filePath, next, "utf8")
  console.log(`✅ Wrote keys to ${filePath}`)
}

(async function main() {
  const { file, client, subject } = parseArgs()
  if (!file && !client) {
    console.error("❌ Please specify at least --file or --client")
    process.exit(1)
  }
  const keys = webpush.generateVAPIDKeys()
  const VAPID_PUBLIC_KEY = keys.publicKey
  const VAPID_PRIVATE_KEY = keys.privateKey
  const SUBJ = subject || "mailto:admin@domainmu.com"

  if (file) writeEnv(path.resolve(file), {
    VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT: SUBJ
  })
  if (client) writeEnv(path.resolve(client), {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: VAPID_PUBLIC_KEY
  })

  console.log("🔑 VAPID_PUBLIC_KEY:", VAPID_PUBLIC_KEY)
  console.log("🔒 VAPID_PRIVATE_KEY: (hidden in .env)")
  console.log("📫 VAPID_SUBJECT:", SUBJ)
})().catch((e) => { console.error(e); process.exit(1) })
