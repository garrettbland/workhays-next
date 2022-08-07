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
    foodServie = 'foodService',
    healthcare = 'healthcare',
    hospitality = 'hospitality',
    technology = 'technology',
    custodial = 'custodial',
    manufacturing = 'manufacturing',
    professional = 'professional',
    realEstate = 'realEstate',
    retail = 'retail',
    other = 'other',
}

export interface Job {
    id: string
    employerId: string
    employerTitle: string
    title: string
    status: 'active' | 'inactive' | 'archived' | 'deleted'
    type: 'fullTime' | 'partTime' | 'seasonal'
    industry: Industries
    description?: string
    applicationLink?: string
    promoted: boolean
    expiresAt: string
    createdAt: string
    updatedAt: string
}

/**
 * Helper used for job items and job list components
 */
export type JobItem = Pick<Job, 'id' | 'title' | 'employerTitle' | 'updatedAt'>

export interface Employer {
    id: string
    title: string
    description: string
    status: 'active' | 'pending' | 'disabled' | 'deleted'
    contact: string
    email: string
    phone?: string
    users: {
        userId: string
        role: 'admin' | 'member'
        owner: boolean
    }[]
    logoUrl?: string
    websiteUrl?: string
    createdAt: string
    updatedAt: string
}

export interface User {
    id: string
    authUID: string
    firstName: string
    lastName: string
    email: string
    status: 'active' | 'disabled' | 'deleted'
    role: 'user' | 'employer' | 'moderator' | 'admin' // role might be saved in Employer? isAdmin?
    createdAt: string
    updatedAt: string
}

export interface Subscriber {
    id: string
    email: string
    status: 'active' | 'inactive'
    createdAt: string
}

export interface ContactSubmission {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    message: string
    createdAt: string
    updatedAt: string
}

export interface JobMetric {
    id: string
    jobId: string
    device: 'mobile' | 'tablet' | 'desktop'
    promotedClick: boolean
    createdAt: string
}

export interface BannerAd {
    id: string
    title: string
    description: string
    backgroundImage: string
    button: {
        title: string
        destinationUrl: string
        backgroundColor: string
        textColor: string
    }
    expiresAt: string
    createdAt: string
    updatedAt: string
}
