import Layout from '@/components/Layout'
import matter from 'gray-matter'
import ReactMarkdown from 'react-markdown'
import PageTitle from '@/components/PageTitle'
import Button from '@/components/Button'
import fs from 'fs'
import path from 'path'
import { GetStaticProps, GetStaticPaths } from 'next'
import { StaticPageProps } from '@/types'
import PageContent from '@/components/PageContent'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'

const components = { Button }

const FrequentlyAskedQuestion = ({
    frontMatter: { title },
    mdxSource,
}: {
    frontMatter: { title: string }
    mdxSource: any
}) => {
    return (
        <Layout>
            <PageTitle title={title} />
            <PageContent>
                <MDXRemote {...mdxSource} components={components} />
            </PageContent>
        </Layout>
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

    console.log(frontMatter)

    return {
        props: {
            frontMatter,
            slug,
            mdxSource,
        },
    }
}

// export const getStaticProps: GetStaticProps = async ({ params }) => {
//     console.log('Getting info for article...')
//     const FAQS_PATH = path.join(process.cwd(), '_faqs')
//     const original_file_name = (params?.slug as string) ?? ''
//     const realSlug = original_file_name.replace(/\.mdx$/, '')
//     const fullPath = path.join(FAQS_PATH, `${realSlug}.md`)
//     const fileContents = fs.readFileSync(fullPath, 'utf8')
//     const { data, content } = matter(fileContents)
//     return {
//         props: {
//             title: data.title,
//             body: content,
//         },
//     }
// }

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
