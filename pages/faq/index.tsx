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
                        <Link href={`/faq/${item.slug}`}>
                            <a className="block no-underline hover:underline">
                                <h2 className="text-xl font-medium text-gray-900">{item.title}</h2>
                            </a>
                        </Link>
                        <p className="text-gray-600 antialiased">
                            <span>
                                {DateTime.fromISO(JSON.parse(item.last_modified))
                                    .setZone('America/Chicago')
                                    .toFormat('LLLL dd yyyy')}{' '}
                            </span>
                            {'· '}
                            {item.excerpt}
                        </p>
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
    const FAQS_PATH = path.join(process.cwd(), '_faqs')
    const slugs = fs.readdirSync(FAQS_PATH)
    const faqs = slugs.map((slug) => {
        const realSlug = slug.replace(/\.md$/, '')
        const fullPath = path.join(FAQS_PATH, `${realSlug}.md`)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const last_modified = JSON.stringify(fs.statSync(fullPath).mtime)
        const { data } = matter(fileContents)
        return {
            title: data.title,
            pending: data.pending || false,
            slug: realSlug,
            last_modified,
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
