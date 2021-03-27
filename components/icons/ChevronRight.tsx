type PropTypes = {
    className?: string
}

const ChevronRight = ({ className = 'text-black' }: PropTypes) => (
    <>
        <svg
            className={className}
            viewBox="0 0 24 24"
            width="24"
            height="24"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    </>
)

export default ChevronRight
