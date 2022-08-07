/**
 * Component that is responsible for fetching jobs. Watches
 * URL and query params to fetch new jobs. Handles pagination
 */
import { JobItem } from '@/components/JobItem'
import { JobItem as JobItemType } from '@/types'
import { faker } from '@faker-js/faker'
import { useEffect, useState } from 'react'
import { Loader } from '@/components/Loader'
import { useRouter } from 'next/router'

const FAKE_JOBS: JobItemType[] = [
    {
        id: faker.datatype.string(7),
        title: faker.name.jobType(),
        employerTitle: faker.company.companyName(),
        updatedAt: faker.date.recent().toDateString(),
    },
    {
        id: faker.datatype.string(7),
        title: faker.name.jobType(),
        employerTitle: faker.company.companyName(),
        updatedAt: faker.date.recent().toDateString(),
    },
    {
        id: faker.datatype.string(7),
        title: faker.name.jobType(),
        employerTitle: faker.company.companyName(),
        updatedAt: faker.date.recent().toDateString(),
    },
    {
        id: faker.datatype.string(7),
        title: faker.name.jobType(),
        employerTitle: faker.company.companyName(),
        updatedAt: faker.date.recent().toDateString(),
    },
    {
        id: faker.datatype.string(7),
        title: faker.name.jobType(),
        employerTitle: faker.company.companyName(),
        updatedAt: faker.date.recent().toDateString(),
    },
]

const fakeFetch = () =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve('done')
        }, 2000)
    })

export const JobList = () => {
    const router = useRouter()
    const [isLoading, setLoading] = useState(false)
    const [jobs, setJobs] = useState<JobItemType[]>([])

    const fetchJobs = async () => {
        try {
            setLoading(true)
            await fakeFetch()
            setJobs(FAKE_JOBS)
        } catch (err) {
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // if router.isReady
        console.log('fetching jobs...')
        console.log(router.query.page ?? 0)
        fetchJobs()
    }, [router.query.page])

    return (
        <div className="relative">
            {isLoading && (
                <Loader>
                    <>
                        {[...Array(3)].map((_, index) => (
                            <JobItem
                                key={index}
                                id={''}
                                title={''}
                                employerTitle={''}
                                updatedAt={''}
                            />
                        ))}
                    </>
                </Loader>
            )}
            {!isLoading &&
                jobs.map(({ id, title, employerTitle, updatedAt }) => (
                    <JobItem
                        key={id}
                        id={id}
                        title={title}
                        employerTitle={employerTitle}
                        updatedAt={updatedAt}
                    />
                ))}
        </div>
    )
}
