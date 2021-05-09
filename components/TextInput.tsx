interface Props {
    value: string
    onChange: (event: any) => string
    name?: string
    id?: string
    placeholder?: string
}

const TextInput = ({ value, name, id, placeholder = '' }: Props) => {
    return (
        <input
            name={name}
            id={id}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder={placeholder}
        />
    )
}

export default TextInput
