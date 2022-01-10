import Layout from '@/components/Layout'
import PageTitle from '@/components/PageTitle'
import ReactMarkdown from 'react-markdown'
import { get_markdown_content } from '@/lib/article'
import { GetStaticProps } from 'next'
import { StaticPageProps } from '@/types'

const Privacy = ({ title, body }: StaticPageProps) => (
    <Layout>
        <PageTitle title={title} />
        <article className="prose prose-indigo">
            <ReactMarkdown>{body}</ReactMarkdown>
        </article>
    </Layout>
)

export const getStaticProps: GetStaticProps = async () => {
    const { data, content } = get_markdown_content('_articles', 'privacy.md')
    return {
        props: {
            title: data.title,
            body: content,
        },
    }
}

export default Privacy
