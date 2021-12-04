import Layout from '@/components/Layout'
import matter from 'gray-matter'
import ReactMarkdown from 'react-markdown'
import fs from 'fs'
import path from 'path'

const FrequentlyAskedQuestion = ({ article }) => {
    return (
        <Layout>
            <div>Title: {article.frontmatter.title}</div>
            <ReactMarkdown>{article.markdownBody}</ReactMarkdown>
        </Layout>
    )
}

/**
 * Get static data at time of build. In this function,
 * we take in params and grab whatever file
 */
export const getStaticProps = async ({ params }) => {
    console.log('Getting info for article...')
    const ARTICLE_PATH = path.join(process.cwd(), '_faqs')
    const realSlug = params.slug.replace(/\.md$/, '')
    const fullPath = path.join(ARTICLE_PATH, `${realSlug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    return {
        props: {
            article: {
                frontmatter: data,
                markdownBody: content,
            },
        },
    }
}

/**
 * Render all of the faq pages, and define a list
 * of paths to render at build time
 */
export const getStaticPaths = async () => {
    console.log('Creating article paths...')
    const ARTICLE_PATH = path.join(process.cwd(), '_faqs')
    const paths = fs
        .readdirSync(ARTICLE_PATH)
        // remove file extensions
        .map((path) => path.replace(/\.mdx?$/, ''))
        // map the path into stastic paths required by next
        .map((slug) => ({
            params: {
                slug: slug,
            },
        }))
    return {
        paths,
        fallback: false,
    }
}

export default FrequentlyAskedQuestion
