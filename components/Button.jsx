const Button = ({ title, ...rest }) => {
    return (
        <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-5 py-2 transition-all"
            {...rest}
        >
            {title}
        </button>
    )
}

export default Button
