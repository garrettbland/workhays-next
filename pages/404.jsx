import Layout from '@/components/Layout'
import Link from 'next/link'

const NotFound = () => {
    return (
        <Layout>
            <section>
                <h1 className="text-3xl font-bold text-indigo-600 mb-3">Page Not Found</h1>
                <p className="prose prose-lg prose-blue">
                    Uh Oh. Looks like this page cannot be found. If you are needing assistance,
                    please{' '}
                    <Link href="/contact">
                        <a>contact us</a>
                    </Link>{' '}
                    and let us know.
                </p>
            </section>
        </Layout>
    )
}

export default NotFound
