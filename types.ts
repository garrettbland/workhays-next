/**
 * Common types used throughout entire project
 */

export type Industries =
    | 'financial'
    | 'administrative'
    | 'agriculture'
    | 'construction'
    | 'delivery'
    | 'education'
    | 'food_service'
    | 'healthcare'
    | 'hospitality'
    | 'technology'
    | 'custodial'
    | 'manufacturing'
    | 'professional'
    | 'real_estate'
    | 'retail'
    | 'other'

export interface Job {
    id: string
    title: string
    status: 'active' | 'inactive' | 'archived' | 'deleted'
    type: 'full_time' | 'part_time' | 'seasonal'
    industry: Industries
    description: string
    application_link?: string
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
    phone: string
    logo_url: string
    website_url: string
    facebook_url: string
    twitter_url: string
    created_at: string
    updated_at: string
    // Need to add access and roles here?
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
