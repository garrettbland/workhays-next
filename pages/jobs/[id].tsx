import { PageTitle } from '@/components/PageTitle'
import { Job } from '@/types'
import Head from 'next/head'
import { supabase } from '@/supabase'
import { GetServerSideProps } from 'next'

interface Props {
    job: Job
}

const Job = ({ job }: Props) => {
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

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const jobId = context.params?.id

        const { data, error } = await supabase
            .from('jobs')
            .select()
            .eq('id', jobId)
            .eq('status', 'active')
            .limit(1)

        if (error) throw Error('Error retrieving data')

        return {
            props: {
                job: data[0],
            },
        }
    } catch (err) {
        /**
         * Log this error somewhere and what is actually happening
         * incase it's like a 500 or something. In this case,
         * we always just return a 404
         */
        return {
            notFound: true,
        }
    }
}

export default Job
