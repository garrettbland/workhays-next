/**
 * Individual job item that is primarily used within <JobList/>
 */
import { JobItem as JobItemType } from '@/types'
import Link from 'next/link'

export const JobItem = ({ employer_title, title, updated_at, id }: JobItemType) => {
    const isLoading = employer_title === '' || title === ''

    return (
        <Link href={isLoading ? '#' : `/jobs/${id}`}>
            <a
                className={`flex flex-row justify-between items-center p-3 border first:rounded-t last:rounded-b transition hover:bg-gray-100 hover:border-indigo-600 z-10 hover:z-20 h-16 ${
                    isLoading ? 'hover:border-gray-200 hover:bg-white cursor-default' : ''
                }`}
            >
                <div className="flex flex-col w-1/2">
                    <span className="text-sm text-gray-800">
                        {isLoading ? (
                            <div className="bg-gray-300 rounded-full h-2 w-48 mb-3"></div>
                        ) : (
                            employer_title
                        )}
                    </span>
                    <span className="font-medium">
                        {isLoading ? (
                            <div className="bg-gray-500 rounded-full h-3 w-56"></div>
                        ) : (
                            title
                        )}
                    </span>
                </div>
                <div className="flex flex-row items-center justify-end w-1/2">
                    <div>
                        <span className="text-sm text-gray-800">
                            {isLoading ? (
                                <div className="bg-gray-500 rounded-full h-2 w-24"></div>
                            ) : (
                                updated_at
                            )}
                        </span>
                    </div>
                </div>
            </a>
        </Link>
    )
}
