import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { DESKTOP_LINKS } from '../config'

const Navbar = () => {
    const [isMenuOpen, setMenuOpen] = useState<boolean>(false)
    const { pathname } = useRouter()
    return (
        <div className="relative z-40">
            {isMenuOpen && (
                <div className="fixed md:hidden top-0 left-0 z-20 w-screen min-h-screen bg-black bg-opacity-50 flex justify-start">
                    <div className="flex w-2/3 max-w-xs bg-white min-h-screen">
                        <div className="w-full">
                            <div className="flex p-4 border-b border-gray-100">
                                <Link href="/">
                                    <div className="flex flex-row items-center space-x-2 cursor-pointer group">
                                        <img
                                            src="/work-hays-logo.svg"
                                            alt="Work Hays Logo"
                                            className="w-10 h-10 border-2 border-white rounded-full transform group-hover:scale-110 transition-all ease-in-out"
                                        />
                                        <a className="font-bold text-black inline-block">
                                            Work Hays
                                        </a>
                                    </div>
                                </Link>
                            </div>
                            <div className="flex flex-col border-b border-gray-100">
                                {DESKTOP_LINKS.map(({ title, href, target = '_self' }, index) => (
                                    <Link href={href} key={index}>
                                        <a
                                            target={target}
                                            rel={target !== '_self' ? 'noopener' : ''}
                                            className={`flex flex-row justify-between items-center p-4 ${
                                                pathname === href ? 'font-bold' : 'text-gray-900'
                                            }`}
                                        >
                                            {title}
                                            <svg
                                                viewBox="0 0 24 24"
                                                width="24"
                                                height="24"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-gray-700"
                                            >
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </a>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-1 justify-end" onClick={() => setMenuOpen(false)}>
                        <div className="mr-4 mt-4">
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center focus:outline-none focus:ring-4 focus:ring-blue-500 text-gray-800 p-2 rounded-lg bg-white"
                            >
                                <span className="mr-4">Close</span>
                                <svg
                                    viewBox="0 0 24 24"
                                    width="24"
                                    height="24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="max-w-4xl mx-auto p-4 flex flex-row justify-between items-center">
                <Link href="/">
                    <div className="flex flex-row items-center space-x-2 cursor-pointer group">
                        <img
                            src="/work-hays-logo.svg"
                            alt="Work Hays Logo"
                            className="w-10 h-10 border-2 border-white rounded-full transform group-hover:scale-110 transition-all ease-in-out"
                        />
                        <a className="font-bold text-white inline-block">Work Hays</a>
                    </div>
                </Link>
                <div className="hidden md:flex flex-row space-x-4">
                    {DESKTOP_LINKS.map(({ title, href, target = '_self' }, index) => (
                        <Link href={href} key={index}>
                            <a
                                target={target}
                                rel={target !== '_self' ? 'noopener' : ''}
                                className={`py-2 px-3 text-sm font-medium hover:bg-white hover:shadow hover:text-blue-500 transition-all ease-in-out rounded shadow ${
                                    pathname === href
                                        ? 'bg-white shadow text-blue-500'
                                        : 'bg-transparent text-white shadow-none'
                                }`}
                            >
                                {title}
                            </a>
                        </Link>
                    ))}
                </div>
                <div className="flex md:hidden">
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex items-center focus:outline-none text-white p-2 rounded-lg bg-white bg-opacity-20"
                    >
                        <span className="mr-4">Menu</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Navbar
