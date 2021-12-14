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
 * Statically get data at build time of this page
 * In this case we get all of the FAQ's & create the links
 * when this page builds
 */
export const getStaticProps = async () => {
    console.log('Grabbing articles...')
    const FAQS_PATH = path.join(process.cwd(), '_faqs')
    const slugs = fs.readdirSync(FAQS_PATH)
    const articles = slugs.map((slug) => {
        const realSlug = slug.replace(/\.md$/, '')
        const fullPath = path.join(FAQS_PATH, `${realSlug}.md`)
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
