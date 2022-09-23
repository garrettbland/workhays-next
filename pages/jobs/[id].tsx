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
            <div>Job Title: {job.title}</div>
            <div>Employer Title: {job.employer?.title}</div>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const jobId = context.params?.id

        /**
         * Fetch job from database by id in request URL.
         * `.single` modifier is used to return only single record
         * object, else error is thrown. Makes sure that the job is
         * active as well as the employer
         */
        const { data, error } = await supabase
            .from('jobs')
            .select(
                '*, employer:employers!inner ( id, title, status, contact, email, phone, logoUrl, websiteUrl )'
            )
            .eq('id', jobId)
            .eq('status', 'active')
            .eq('employer.status', 'active')
            .limit(1)
            .single()

        console.log(data)

        if (error) throw Error('Error retrieving data')

        return {
            props: {
                job: data,
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
