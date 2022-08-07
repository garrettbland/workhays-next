import { PageTitle } from '@/components/PageTitle'
import { JobList } from '@/components/JobList'
// import { Job, Industries } from '@/types'

/**
 * Demo - mocking out fake data
 */
// const jobs: Job[] = [
//     {
//         id: '123',
//         title: 'Retail Sales Associate',
//         employer_id: '123',
//         employer_title: 'Horizon Appliance',
//         industry: Industries.agriculture,
//         type: 'full_time',
//         promoted: false,
//         description: 'This is a demo description',
//         status: 'active',
//         expires_at: 'July 4, 2022',
//         created_at: 'June 10',
//         updated_at: 'June 10',
//     },
// ]

const Home = () => {
    return (
        <>
            <PageTitle
                title="Current Job Openings"
                description="Browse current job openings in Hays, KS and surrounding communities."
            />
            <JobList />
        </>
    )
}

export default Home
