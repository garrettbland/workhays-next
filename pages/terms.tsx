import Layout from '@/components/Layout'
import PageTitle from '@/components/PageTitle'
import ReactMarkdown from 'react-markdown'
import { get_markdown_content } from '@/libs/article'
import { GetStaticProps } from 'next'
import { StaticPageProps } from '@/types'

const Terms = ({ title, body }: StaticPageProps) => (
    <Layout>
        <PageTitle title={title} />
        <article className="prose prose-indigo">
            <ReactMarkdown>{body}</ReactMarkdown>
        </article>
    </Layout>
)

export const getStaticProps: GetStaticProps = async () => {
    const { title, body } = get_markdown_content('_articles', 'terms-of-service.md')
    return {
        props: {
            title,
            body,
        },
    }
}

export default Terms
