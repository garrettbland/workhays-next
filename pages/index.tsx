import Layout from '../components/layout'
import PageHeader from '../components/pageHeader'
// import Link from 'next/link'
// import { testJobs } from '../utils/test.data'
// import JobItem from '../components/JobItem'

const Home = () => {
    return (
        <Layout>
            <PageHeader
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
