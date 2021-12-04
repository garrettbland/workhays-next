const Callout = ({ type, icon, children }) => {
    const generate_classes = () => {
        switch (type) {
            case 'success': {
                return 'bg-green-100 text-green-600 border-green-400'
            }
            case 'warning': {
                return 'bg-orange-100 text-orange-600 border-orange-400'
            }
            default: {
                return 'bg-gray-100 text-gray-600 border-gray-200'
            }
        }
    }

    return (
        <p
            class={`px-3 py-1 flex flex-row items-center space-x-2 rounded border mb-6 ${generate_classes()}`}
        >
            {icon ? icon : null}
            <span class="prose">{children}</span>
        </p>
    )
}

export default Callout
