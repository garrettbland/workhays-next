import ChevronRight from './icons/ChevronRight'
import { Job } from '../utils/types'

type Props = {
    job: Job
}

const JobItem = ({ job }: Props) => (
    <div className="p-2 flex justiy-between items-center group hover:cursor-pointer bg-white">
        <div className="flex flex-1 flex-col relative whitespace-nowrap overflow-x-hidden">
            <div className="text-lg font-semibold group-hover:text-blue-600 z-10">{job.title}</div>
            <div className="flex items-center divide-x divide-gray-300">
                <div className="text-sm leading-tight z-10 pr-2">{job.employer_title}</div>
                <div className="text-sm leading-tight z-10 pl-2">{job.industry}</div>
            </div>
            <div className="absolute z-20 top-0 right-0 bg-gradient-to-l from-white w-24 h-full"></div>
        </div>
        <div className="w-12 flex justify-end">
            <ChevronRight className="text-gray-700 group-hover:text-blue-500" />
        </div>
    </div>
)

export default JobItem
