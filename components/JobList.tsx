/**
 * Component that is responsible for fetching jobs. Watches
 * URL and query params to fetch new jobs. Handles pagination
 */
import { JobItem } from '@/components/JobItem'
import { JobItem as JobItemType } from '@/types'
import { useEffect, useState, useRef } from 'react'
import { Loader } from '@/components/Loader'
import { useRouter } from 'next/router'
import { Button } from '@/components/Button'
import { supabase } from '@/supabase'
import { RESULTS_PER_PAGE } from '../config'

export const JobList = () => {
    const router = useRouter()
    const [isLoading, setLoading] = useState(false)
    const [totalPages, setTotalPages] = useState<number | null>(null)
    const [jobs, setJobs] = useState<JobItemType[]>([])
    const currentPage = router.query.page ?? '1'
    const hasFetchedInitialJobCount = useRef(false)

    const fetchJobs = async ({
        page,
        fetchTotalJobs,
    }: {
        page: string
        fetchTotalJobs?: boolean
    }) => {
        setLoading(true)

        const rangeStart = Number(page) * RESULTS_PER_PAGE - RESULTS_PER_PAGE
        const rangeEnd = rangeStart + RESULTS_PER_PAGE - 1

        if (fetchTotalJobs) {
            console.log('get initial jobs...')

            const { error, count } = await supabase.from('jobs').select('*', { count: 'exact' })

            if (error || !count) {
                throw Error('Error counting jobs...')
            }

            hasFetchedInitialJobCount.current = true
            setTotalPages(Math.ceil(count / RESULTS_PER_PAGE))
        }

        const { data, error } = await supabase
            .from('jobs')
            .select('*', { count: 'exact' })
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
        const shouldFetchTotalJobs = hasFetchedInitialJobCount.current === false

        fetchJobs({
            page: (router.query.page as string) ?? '1',
            fetchTotalJobs: shouldFetchTotalJobs,
        })
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
                        {[...Array(RESULTS_PER_PAGE)].map((_, index) => (
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
                <div>
                    Page {currentPage} of {totalPages ?? '...'}
                </div>
                <div className="grid grid-flow-col gap-5">
                    <Button
                        type="secondary"
                        title="Previous"
                        onClick={() => handlePaginate('previous', currentPage as string)}
                        disabled={!totalPages || Number(currentPage) < 2}
                    />
                    <Button
                        type="secondary"
                        title="Next"
                        onClick={() => handlePaginate('next', currentPage as string)}
                        disabled={!totalPages || Number(currentPage) === totalPages}
                    />
                </div>
            </div>
        </div>
    )
}
