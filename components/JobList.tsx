/**
 * Component that is responsible for fetching jobs. Watches
 * URL and query params to fetch new jobs. Handles pagination
 */
import { JobItem } from '@/components/JobItem'
import { JobItem as JobItemType } from '@/types'
// import { faker } from '@faker-js/faker'
import { useEffect, useState } from 'react'
import { Loader } from '@/components/Loader'
import { useRouter } from 'next/router'
import { Button } from '@/components/Button'
import { database } from '@/firebase'
import { query, collection, getDocs, startAfter, limit, DocumentData } from 'firebase/firestore'

// const FAKE_JOBS: JobItemType[] = [
//     {
//         id: faker.datatype.uuid(),
//         title: faker.name.jobType(),
//         employerTitle: faker.company.companyName(),
//         updatedAt: faker.date.recent().toDateString(),
//     },
//     {
//         id: faker.datatype.uuid(),
//         title: faker.name.jobType(),
//         employerTitle: faker.company.companyName(),
//         updatedAt: faker.date.recent().toDateString(),
//     },
//     {
//         id: faker.datatype.uuid(),
//         title: faker.name.jobType(),
//         employerTitle: faker.company.companyName(),
//         updatedAt: faker.date.recent().toDateString(),
//     },
//     {
//         id: faker.datatype.uuid(),
//         title: faker.name.jobType(),
//         employerTitle: faker.company.companyName(),
//         updatedAt: faker.date.recent().toDateString(),
//     },
//     {
//         id: faker.datatype.uuid(),
//         title: faker.name.jobType(),
//         employerTitle: faker.company.companyName(),
//         updatedAt: faker.date.recent().toDateString(),
//     },
// ]

// const fakeFetch = (waitTime: number) =>
//     new Promise((resolve) => {
//         setTimeout(() => {
//             resolve('done')
//         }, waitTime)
//     })

export const JobList = () => {
    const router = useRouter()
    const [isLoading, setLoading] = useState(false)
    const [jobs, setJobs] = useState<JobItemType[]>([])
    const [currentPage, setPage] = useState('1')
    const [lastVisible, setLastVisible] = useState<DocumentData | null>(null)

    const fetchJobs = async (lastVisibleRecord?: DocumentData) => {
        try {
            setLoading(true)

            let jobsCollectionQuery

            /**
             * NOT WORKING CORRECTLY...
             */
            if (lastVisibleRecord) {
                console.log(lastVisibleRecord)
                jobsCollectionQuery = query(
                    collection(database, 'jobs'),
                    startAfter(lastVisibleRecord),
                    limit(1)
                )
            } else {
                jobsCollectionQuery = query(collection(database, 'jobs'), limit(1))
            }

            const jobsSnapshot = await getDocs(jobsCollectionQuery)
            const jobs = jobsSnapshot.docs.map((doc) => {
                const job = doc.data() as JobItemType
                return {
                    id: job.id,
                    title: job.title,
                    employerTitle: job.employerTitle,
                    updatedAt: job.updatedAt,
                }
            })
            setLastVisible(jobs[jobs.length - 1])
            setJobs(jobs)
        } catch (err) {
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (router.query.page) {
            setPage(router.query.page as string)
        }

        if (lastVisible) {
            fetchJobs(lastVisible)
        }
        fetchJobs()
    }, [router.query.page])

    const handlePaginate = (direction: 'previous' | 'next', currentPage: string): void => {
        const numericCurrentPage = Number(currentPage)
        const NEW_PAGE = direction === 'previous' ? numericCurrentPage - 1 : Number(currentPage) + 1
        router.push(`/?page=${NEW_PAGE}`, undefined, { shallow: true })
    }

    return (
        <div>
            {isLoading && (
                <Loader>
                    <>
                        {[...Array(12)].map((_, index) => (
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
            <div>
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
            <div className="flex flex-row justify-between mt-5">
                <div>
                    Page {currentPage} of 15 {JSON.stringify(lastVisible)}
                </div>
                <div className="grid grid-flow-col gap-5">
                    <Button
                        type="secondary"
                        title="Previous"
                        onClick={() => handlePaginate('previous', currentPage)}
                        disabled={currentPage < '2'}
                    />
                    <Button
                        type="secondary"
                        title="Next"
                        onClick={() => handlePaginate('next', currentPage)}
                    />
                </div>
            </div>
        </div>
    )
}
