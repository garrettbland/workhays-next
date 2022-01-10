import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    title: string
}

const Button = ({ title, type = 'button' }: ButtonProps) => {
    return (
        <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-5 py-2 transition-all"
            type={type}
        >
            {title}
        </button>
    )
}

export default Button
