import path from 'path'
import fs from 'fs'

export function TemplateHtml(data: any): string {
  const pagePath = path.resolve(process.cwd(), './src/Template/HTML/index.html')
  const template = fs.readFileSync(pagePath, 'utf8')

  console.log('TemplateHtml', data)
  
  return template
}
  