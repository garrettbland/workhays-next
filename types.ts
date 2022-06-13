/**
 * Common types used throughout entire project
 */

export enum Industries {
    financial = 'financial',
    administrative = 'administrative',
    agriculture = 'agriculture',
    construction = 'construction',
    delivery = 'delivery',
    education = 'education',
    food_servie = 'food_service',
    healthcare = 'healthcare',
    hospitality = 'hospitality',
    technology = 'technology',
    custodial = 'custodial',
    manufacturing = 'manufacturing',
    professional = 'professional',
    real_estate = 'real_estate',
    retail = 'retail',
    other = 'other',
}

export interface Job {
    id: string
    employer_id: string
    title: string
    status: 'active' | 'inactive' | 'archived' | 'deleted'
    type: 'full_time' | 'part_time' | 'seasonal'
    industry: Industries
    description?: string
    application_link?: string
    promoted: boolean
    created_at: string
    updated_at: string
    expires_at: string
}

export interface Employer {
    id: string
    title: string
    description: string
    status: 'active' | 'pending' | 'disabled' | 'deleted'
    contact: string
    email: string
    phone?: string
    users: {
        user_id: string
        role: 'admin' | 'member'
        owner: boolean
    }[]
    logo_url?: string
    website_url?: string
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    auth_id: string
    first_name: string
    last_name: string
    email: string
    status: 'active' | 'disabled' | 'deleted'
    role: 'user' | 'employer' | 'moderator' | 'admin' // role might be saved in Employer? is_admin?
    created_at: string
    updated_at: string
}

export interface Subscriber {
    id: string
    email: string
    status: 'active' | 'inactive'
    created_at: string
}

export interface ContactSubmission {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    message: string
    created_at: string
    updated_at: string
}

export interface JobMetric {
    id: string
    job_id: string
    device: 'mobile' | 'tablet' | 'desktop'
    promoted_click: boolean
    created_at: string
}
