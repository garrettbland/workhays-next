type ButtonTypes = 'primary' | 'secondary' | 'danger'
interface Props {
    title?: string
    icon?: JSX.Element
    onClick?: () => void
    type: ButtonTypes
    loading?: boolean
    buttonType?: 'button' | 'submit'
    disabled?: boolean
}

const BASE_STYLES = `
    inline-flex 
    items-center 
    rounded
    px-4 
    py-2 
    disabled:opacity-75 
    disabled:cursor-not-allowed
    w-full
    md:w-auto
    justify-center
`

const generateClassNames = (type: ButtonTypes) => {
    switch (type) {
        case 'primary': {
            return 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }
        case 'secondary': {
            return 'bg-gray-300 hover:bg-gray-400 text-gray-900'
        }
        case 'danger': {
            return 'bg-red-500 hover:bg-red-600 text-red-50'
        }
    }
}

export const Button = ({
    title,
    icon,
    onClick,
    type,
    loading,
    disabled,
    buttonType = 'button',
}: Props) => {
    return (
        <button
            onClick={onClick}
            className={`${BASE_STYLES} ${generateClassNames(type)}`}
            disabled={loading || disabled}
            type={buttonType}
        >
            {loading && (
                <span>
                    <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                </span>
            )}
            {icon && icon}
            <span className={`font-medium`}>{title}</span>
        </button>
    )
}
