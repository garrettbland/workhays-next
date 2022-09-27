import { ReactNode } from 'react'

interface Props {
    title: string
    description?: string | ReactNode
}

export const PageTitle = ({ title, description = '' }: Props) => {
    return (
        <section className="mb-6">
            <h1 className="text-3xl font-bold text-indigo-600 mb-3">{title}</h1>
            {description && <p className="prose prose-lg prose-blue">{description}</p>}
        </section>
    )
}
