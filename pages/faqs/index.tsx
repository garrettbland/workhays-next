import Layout from '@/components/Layout'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import PageTitle from '@/components/PageTitle'
import { DateTime } from 'luxon'
import { GetStaticProps } from 'next'

interface FrequentlyAskedQuestionType {
    title: string
    pending: boolean
    slug: string
    excerpt: string
    last_modified: string
}

const FAQ = ({ faqs }: { faqs: FrequentlyAskedQuestionType[] }) => {
    return (
        <Layout>
            <PageTitle
                title="Frequently Asked Questions"
                description={`
                    Some of our most frequently asked questions and tutorials.
                `}
            />
            {/* <div className="mb-6">Future search bar</div> */}
            <article>
                {faqs.map((item, index) => (
                    <div className="mb-6" key={index}>
                        <Link href={`/faqs/${item.slug}`}>
                            <a className="block no-underline hover:underline">
                                <h2 className="text-xl font-medium text-gray-900">{item.title}</h2>
                            </a>
                        </Link>
                        <p className="text-gray-600 antialiased">{item.excerpt}</p>
                    </div>
                ))}
            </article>
        </Layout>
    )
}

/**
 * Statically get data at build time of this page
 * In this case we get all of the FAQ's & create the links
 * when this page builds
 */
export const getStaticProps: GetStaticProps = async () => {
    console.log('Grabbing faqs...')

    /**
     * Need to mega clean this up...
     */
    const fm = (markdown: string): Object => {
        const search_term = 'export const meta = {'
        const start = markdown.indexOf(search_term) + search_term.length
        const end = markdown.indexOf('}', start)
        const front_matter_raw = markdown.substring(start, end)
        const separated_commas = front_matter_raw.split(',').filter((item) => item !== '')
        let convert = {} as any
        separated_commas.forEach((item) => {
            console.log(item)
            const [key, value] = item.split(':')
            if (!key || !value) {
                return
            }
            convert[key.replace(/\n/g, '').trim()] = value
                .replace(/\n/g, '')
                .replace(/\'/g, '')
                .trim()
        })

        return convert
    }

    const FAQS_PATH = path.join(process.cwd(), 'pages/faqs')
    const slugs = fs.readdirSync(FAQS_PATH).filter((slug) => slug !== 'index.tsx')
    const faqs = slugs.map((filename) => {
        const realSlug = filename.replace(/\.mdx$/, '')
        const fullPath = path.join(FAQS_PATH, filename)

        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { title } = fm(fileContents) as any

        //console.log(frontMatter(matter(fileContents).content.toString()))

        //console.log(frontMatter(matter(fileContents).content))
        return {
            title: title,
            slug: realSlug,
            pending: false,
        }
    })

    /**
     * Return the faqs to the view after filtering out pending
     */
    return {
        props: {
            faqs: faqs.filter((faq) => !faq.pending),
        },
    }
}

export default FAQ
