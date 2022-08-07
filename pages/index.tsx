import { PageTitle } from '@/components/PageTitle'
import { JobList } from '@/components/JobList'
import Head from 'next/head'

const Home = () => {
    return (
        <>
            <Head>
                <title>Work Hays</title>
            </Head>
            <PageTitle
                title="Current Job Openings"
                description="Browse current job openings in Hays, KS and surrounding communities."
            />
            <JobList />
        </>
    )
}

export default Home
