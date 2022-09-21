/**
 * Individual job item that is primarily used within <JobList/>
 */
import { Job } from '@/types'
import Link from 'next/link'
import { ArrowSmRightIcon } from '@heroicons/react/outline'

export const JobItem = ({ employer, title, updatedAt, id }: Partial<Job>) => {
    const isLoading = employer?.title === '' || title === ''

    return (
        <Link href={isLoading ? '#' : `/jobs/${id}`}>
            <a
                className={`flex flex-row justify-between items-center p-3 border first:rounded-t last:rounded-b hover:bg-gray-100 hover:border-indigo-600 z-10 hover:z-20 h-16 ${
                    isLoading ? 'hover:border-gray-200 hover:bg-white cursor-default' : ''
                }`}
            >
                <div className="flex w-full md:w-4/5 flex-col">
                    <span className="text-sm text-gray-800 line-clamp-1">
                        {isLoading ? (
                            <div className="bg-gray-300 rounded-full h-2 w-48 mb-3"></div>
                        ) : (
                            employer?.title
                        )}
                    </span>
                    <span className="font-medium line-clamp-1">
                        {isLoading ? (
                            <div className="bg-gray-500 rounded-full h-3 w-56"></div>
                        ) : (
                            title
                        )}
                    </span>
                </div>
                <div className="flex w-8 md:w-auto flex-row items-center justify-end">
                    <div className="text-sm text-gray-800 hidden md:block">
                        {isLoading ? (
                            <div className="bg-gray-500 rounded-full h-2 w-24"></div>
                        ) : (
                            updatedAt
                        )}
                    </div>
                    <ArrowSmRightIcon
                        className={`block md:hidden h-6 w-6 text-indigo-600 ${
                            isLoading ? 'text-gray-300' : ''
                        }`}
                    />
                </div>
            </a>
        </Link>
    )
}
