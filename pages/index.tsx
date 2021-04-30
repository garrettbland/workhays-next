import Layout from '@/components/Layout'
import Header from '@/components/Header'

const Home = () => {
    return (
        <Layout>
            <Header
                title="Current Job Openings"
                description="Browse current job openings in Hays, KS and surrounding communities."
            />
            <section>
                <div className="max-w-4xl mx-auto">
                    <div className="h-[900px]">test</div>
                </div>
            </section>
        </Layout>
    )
}

export default Home
