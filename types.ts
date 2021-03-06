export interface LinkType {
    title: string
    href: string
    target?: string
}

/**
 * Setting industry key if users wanted to sign up for
 * alerts for when specific industries added new job
 * listings.
 */
export interface Subscriber {
    id: string
    email: string
    industry: string | null
}

export interface User {
    id: string
    first_name: string
    last_name: string
    email: string
    disabled: boolean
    role: 'user' | 'administrator'
}

export interface Job {
    id: string
    employer_id: string
    employer_title: string
    title: string
    type: 'full_time' | 'part_time'
    description: string
    industry: string
    application_link?: string
    status: 'active' | 'inactive' | 'archived'
    promoted: boolean
}

export interface Employer {
    id: string
    owner_user_id: string
    users: {
        user_id: string
    }[]
    title: string
    description: string
    contact: string
    email?: string
    phone?: string
    logo_url?: string
    website_url?: string
    facebook_url?: string
    twitter_url?: string
}
