import { PageTitle } from '@/components/PageTitle'
import { Job } from '@/types'
import Head from 'next/head'

const Job = ({ job }: { job: Partial<Job> }) => {
    return (
        <>
            <Head>
                <title>{job.title}</title>
            </Head>
            <PageTitle
                title={job.title as string}
                description="Browse current job openings in Hays, KS and surrounding communities."
            />
            <div>{job.title}</div>
        </>
    )
}

export const getServerSideProps = async (context: any) => {
    const jobId = context.params.id
    return {
        props: {
            job: {
                title: 'Example Job Title',
                id: jobId,
            },
        },
    }
}

export default Job
