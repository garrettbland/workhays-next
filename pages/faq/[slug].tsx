import Layout from '@/components/Layout'
import matter from 'gray-matter'
import ReactMarkdown from 'react-markdown'
import PageTitle from '@/components/PageTitle'
import fs from 'fs'
import path from 'path'
import { GetStaticProps, GetStaticPaths } from 'next'
import { StaticPageProps } from '@/types'

const FrequentlyAskedQuestion = ({ title, body }: StaticPageProps) => {
    return (
        <Layout>
            <PageTitle title={title} />
            <article className="prose prose-indigo">
                <ReactMarkdown>{body}</ReactMarkdown>
            </article>
        </Layout>
    )
}

/**
 * Get static data at time of build. In this function,
 * we take in params and grab whatever file
 */
export const getStaticProps: GetStaticProps = async ({ params }) => {
    console.log('Getting info for article...')
    const FAQS_PATH = path.join(process.cwd(), '_faqs')
    const realSlug = params.slug.replace(/\.md$/, '')
    const fullPath = path.join(FAQS_PATH, `${realSlug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    return {
        props: {
            title: data.title,
            body: content,
        },
    }
}

/**
 * Render all of the faq pages, and define a list
 * of paths to render at build time
 */
export const getStaticPaths: GetStaticPaths = async () => {
    console.log('Creating article paths...')
    const FAQS_PATH = path.join(process.cwd(), '_faqs')
    const paths = fs
        .readdirSync(FAQS_PATH)
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
