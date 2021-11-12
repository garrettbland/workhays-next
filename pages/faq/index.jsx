import Layout from '@/components/Layout'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import Link from 'next/link'

const FAQ = ({ articles }) => {
    return (
        <Layout>
            <div>Work Hays</div>
            {articles.map((item, index) => (
                <Link href={`/faq/${item.slug}`} key={index}>
                    <a>{item.title}</a>
                </Link>
            ))}
        </Layout>
    )
}

/**
 * Grab articles from _faq
 * Fetches data at build time
 */
export const getStaticProps = async () => {
    console.log('Grabbing articles...')
    const ARTICLE_PATH = path.join(process.cwd(), '_faqs')
    const slugs = fs.readdirSync(ARTICLE_PATH)
    const articles = slugs.map((slug) => {
        const realSlug = slug.replace(/\.md$/, '')
        const fullPath = path.join(ARTICLE_PATH, `${realSlug}.md`)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data } = matter(fileContents)
        return {
            title: data.title,
            slug: realSlug,
        }
    })

    return {
        props: {
            articles: articles,
        },
    }
}

export default FAQ
