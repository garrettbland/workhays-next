import { useState } from 'react'
import Link from 'next/link'

type LinkType = {
    title: string
    link: string
}

const MOBILE_LINKS: LinkType[] = [
    {
        title: 'Jobs',
        link: '/',
    },
    {
        title: 'For Employers',
        link: '/employers',
    },
    {
        title: 'Login',
        link: '/login',
    },
    {
        title: 'Register',
        link: '/register',
    },
    {
        title: 'Contact Us',
        link: '/contact',
    },
]

const MobileNav = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false)

    return (
        <>
            {isOpen && (
                <div className="fixed top-0 left-0 w-screen h-screen bg-white border-t border-gray-200 mt-14">
                    <div className="p-4">
                        <ol className="text-center space-y-4 text-xl font-semibold">
                            {MOBILE_LINKS.map(({ title, link }, index) => (
                                <Link href={link} key={index}>
                                    <a className="block">{title}</a>
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
