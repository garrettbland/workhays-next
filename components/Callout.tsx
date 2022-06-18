import { ReactNode } from 'react'

interface CalloutProps {
    type?: 'success' | 'warning' | 'info'
    icon?: ReactNode
    children: string | ReactNode
}

/**
 * Generates the callout style depending on the type
 */
const generateClasses = (calloutType = ''): string => {
    switch (calloutType) {
        case 'success': {
            return 'bg-green-100 text-green-600 border-green-400'
        }
        case 'warning': {
            return 'bg-orange-100 text-orange-600 border-orange-400'
        }
        case 'info': {
            return 'bg-blue-100 text-blue-600 border-blue-400'
        }
        default: {
            return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }
}

const Callout = ({ type, icon, children }: CalloutProps) => {
    return (
        <p
            className={`px-3 py-1 flex flex-row items-center space-x-2 rounded border mb-6 ${generateClasses(
                type
            )}`}
        >
            {icon ? icon : null}
            <span className="prose">{children}</span>
        </p>
    )
}

export default Callout
