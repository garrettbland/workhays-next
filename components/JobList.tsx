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
import { supabase } from '@/supabase'

export const JobList = () => {
    const router = useRouter()
    const [isLoading, setLoading] = useState(false)
    const [jobs, setJobs] = useState<JobItemType[]>([])
    const currentPage = router.query.page ?? 1

    const fetchJobs = async (page: string) => {
        setLoading(true)

        const RESULTS_TO_SHOW = 2

        const rangeStart = Number(page) * RESULTS_TO_SHOW - RESULTS_TO_SHOW
        const rangeEnd = rangeStart + RESULTS_TO_SHOW - 1

        const { data, error } = await supabase
            .from('jobs')
            .select()
            .order('updatedAt')
            .range(rangeStart, rangeEnd)
        if (error) {
            console.log(error)
            alert('error getting jobs')
            return
        }
        console.log(data)
        setJobs(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchJobs((router.query.page as string) ?? '1')
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
                {jobs.map(({ id, title, employerTitle = 'n/a', updatedAt }) => (
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
                <div>Page //</div>
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
