import { Job } from './types'

export const testJobs: Job[] = [
    {
        id: '1',
        employer_id: '11',
        employer_title: 'Fake Company',
        title: 'Retail Sales Associate',
        type: 'full_time',
        description: '',
        industry: '',
        status: 'active',
        promoted: true,
    },
    {
        id: '2',
        employer_id: '22',
        employer_title: 'Gas Station',
        title: 'Individual Care',
        type: 'part_time',
        description: '',
        industry: '',
        status: 'active',
        promoted: false,
    },
    {
        id: '3',
        employer_id: '33',
        employer_title: 'Environment Healthy',
        title: 'Admissions Advisor',
        type: 'full_time',
        description: '',
        industry: '',
        status: 'active',
        promoted: false,
    },
    {
        id: '4',
        employer_id: '44',
        employer_title: 'Some absurdly long title of an employer that shouldnt be this way',
        title:
            'Some absurdly long title of an job title that shouldnt be this way but it totally is',
        type: 'full_time',
        description: '',
        industry: '',
        status: 'active',
        promoted: false,
    },
]
