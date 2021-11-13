import Layout from '@/components/Layout'
import PageTitle from '@/components/PageTitle'

const Home = () => {
    return (
        <Layout>
            <PageTitle
                title="Current Job Openings"
                description="Browse current job openings in Hays, KS and surrounding communities."
            />
            <div className="h-[2000px]"></div>
        </Layout>
    )
}

export default Home
