import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { MOBILE_LINKS } from '../config'

const MobileNav = () => {
    const { pathname } = useRouter()
    const [isOpen, setIsOpen] = useState<boolean>(false)

    return (
        <>
            {isOpen && (
                <div className="fixed top-0 left-0 md:hidden w-screen h-screen bg-white border-t border-gray-200 mt-14">
                    <div className="p-4">
                        <ol className="text-center space-y-4 text-xl font-semibold">
                            {MOBILE_LINKS.map(({ title, href, target = '_self' }, index) => (
                                <Link href={href} key={index}>
                                    <a
                                        className={`block ${
                                            pathname === href ? 'text-blue-500' : 'text-gray-800'
                                        }`}
                                        target={target}
                                        rel={target !== '_self' ? 'noopener' : ''}
                                    >
                                        {title}
                                    </a>
                                </Link>
                            ))}
                        </ol>
                    </div>
                </div>
            )}
            <div className="block md:hidden border-l border-gray-200 relative z-10">
                <button
                    className="flex flex-row items-center focus:outline-none"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="p-4">{isOpen ? 'Close' : 'Menu'}</div>
                    <div>
                        <svg
                            className="h-6 w-6"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d={isOpen ? `M6 18L18 6M6 6l12 12` : `M4 6h16M4 12h16M4 18h16`}
                            />
                        </svg>
                    </div>
                </button>
            </div>
        </>
    )
}

export default MobileNav
