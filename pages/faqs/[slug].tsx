import matter from 'gray-matter'
import { PageTitle } from '@/components/PageTitle'
import { Button } from '@/components/Button'
import fs from 'fs'
import path from 'path'
import { GetStaticPaths } from 'next'
import PageContent from '@/components/PageContent'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'

interface FAQ {
    frontMatter: { title: string }
    mdxSource: Record<string, unknown>
}

/**
 * Components that will be used within MDX
 */
const components = { Button }

const FrequentlyAskedQuestion = ({ frontMatter: { title }, mdxSource }: FAQ) => {
    return (
        <>
            <PageTitle title={title} />
            <PageContent>
                <MDXRemote compiledSource="" {...mdxSource} components={components} />
            </PageContent>
        </>
    )
}

/**
 * Get static data at time of build. In this function,
 * we take in params and grab whatever file
 */

export const getStaticProps = async ({ params: { slug } }: { params: { slug: string } }) => {
    const FAQS_PATH = path.join(process.cwd(), '_faqs')
    const realSlug = slug.replace(/\.mdx$/, '')
    const fullPath = path.join(FAQS_PATH, `${realSlug}.mdx`)
    const markdownWithMeta = fs.readFileSync(fullPath, 'utf-8')

    const { data: frontMatter, content } = matter(markdownWithMeta)
    const mdxSource = await serialize(content)

    return {
        props: {
            frontMatter,
            slug,
            mdxSource,
        },
    }
}

/**
 * Render all of the faq pages, and define a list
 * of paths to render at build time
 */
export const getStaticPaths: GetStaticPaths = async () => {
    const FAQS_PATH = path.join(process.cwd(), '_faqs')
    const paths = fs
        .readdirSync(FAQS_PATH)
        .map((path) => path.replace(/\.mdx?$/, ''))
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
