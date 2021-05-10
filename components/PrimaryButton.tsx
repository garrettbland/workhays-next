interface Props {
    title: string
    type?: 'submit' | 'button'
}

const PrimaryButton = ({ title, type = 'button' }: Props) => (
    <button
        type={type}
        className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
        {title}
    </button>
)

export default PrimaryButton
