import Layout from '@/components/Layout'

export default () => {
    return (
        <Layout>
            <div>FAQ Article</div>
        </Layout>
    )
}

// Pull markdown files from _faqs
export async getStaticProps({ params }) => {
    return {
        props: {
            title: 'how to reset your password'
        }
    }
}