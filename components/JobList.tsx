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
        employer_title: faker.company.companyName(),
        updated_at: faker.date.recent().toDateString(),
    },
]

const fakeFetch = () =>
    new Promise((resolve, reject) => {
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
            const data = await fakeFetch()
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
                                employer_title={''}
                                updated_at={''}
                            />
                        ))}
                    </>
                </Loader>
            )}
            {jobs.map(({ id, title, employer_title, updated_at }) => (
                <JobItem
                    key={id}
                    id={id}
                    title={title}
                    employer_title={employer_title}
                    updated_at={updated_at}
                />
            ))}
        </div>
    )
}
