import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { PageTitle } from '@/components/PageTitle'
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
        <>
            <PageTitle
                title="Frequently Asked Questions"
                description={`
                    Some of our most frequently asked questions and tutorials.
                `}
            />
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
        </>
    )
}

/**
 * Statically get data at build time of this page
 * In this case we get all of the FAQ's & create the links
 * when this page builds
 */
export const getStaticProps: GetStaticProps = async () => {
    const FAQS_PATH = path.join(process.cwd(), '_faqs')
    const slugs = fs.readdirSync(FAQS_PATH)
    const faqs = slugs.map((filename) => {
        const realSlug = filename.replace(/\.mdx$/, '')
        const fullPath = path.join(FAQS_PATH, filename)

        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { title, excerpt = '', pending = false } = matter(fileContents).data

        return {
            title: title,
            slug: realSlug,
            excerpt: excerpt,
            pending: pending,
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
