import { ReactNode } from 'react'

const DEFAULT_SECTION_STYLE = 'max-w-4xl mx-auto p-4'

type SectionProps = {
    children?: ReactNode
    className?: string
}

const Section = ({ children, className = DEFAULT_SECTION_STYLE }: SectionProps) => {
    return <div className={className}>{children}</div>
}

export default Section
