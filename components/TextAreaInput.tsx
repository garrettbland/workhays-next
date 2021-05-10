interface Props {
    value: string
    onChange: (event: any) => any
    name?: string
    id?: string
    placeholder?: string
    rows?: number
}

const TextInput = ({ value, onChange, name, id, placeholder = '', rows = 5 }: Props) => {
    return (
        <textarea
            onChange={(event) => onChange(event)}
            name={name}
            id={id}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder={placeholder}
            rows={rows}
        />
    )
}

export default TextInput
