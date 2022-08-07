/**
 * Component that is responsible for fetching jobs. Watches
 * URL and query params to fetch new jobs. Handles pagination
 */
import { JobItem } from '@/components/JobItem'
import { JobItem as JobItemType } from '@/types'
import { faker } from '@faker-js/faker'
import { useEffect, useState } from 'react'
import { Loader } from '@/components/Loader'

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
        fetchJobs()
    }, [])

    return (
        <div className="relative">
            {isLoading && (
                <Loader>
                    <>
                        {[...Array(3)].map(() => (
                            <JobItem
                                key={''}
                                id={''}
                                title={''}
                                employerTitle={''}
                                updatedAt={''}
                            />
                        ))}
                    </>
                </Loader>
            )}
            {jobs.map(({ id, title, employerTitle, updatedAt }) => (
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
