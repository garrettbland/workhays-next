import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import { StaticPageProps } from '@/types'

export const get_markdown_content = (directory: string, fileName: string): StaticPageProps => {
    console.log(`Getting markdown content for ${fileName}...`)
    const FULL_PATH = path.join(process.cwd(), directory)
    const fullPath = path.join(FULL_PATH, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    return {
        title: data.title,
        body: content,
    }
}
