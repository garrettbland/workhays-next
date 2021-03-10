import Link from 'next/link'

type FooterLinkType = {
    title: string
    link: string
}

const EMPLOYER_LINKS: FooterLinkType[] = [
    {
        title: 'Post a job',
        link: '/signup',
    },
    {
        title: 'Sign Up',
        link: '/sign-up',
    },
    {
        title: 'Sign In',
        link: '/sign-in',
    },
    {
        title: 'Help',
        link: '/help',
    },
]

const LINKS: FooterLinkType[] = [
    {
        title: 'Contact',
        link: '/signup',
    },
    {
        title: 'About',
        link: '/sign-up',
    },
    {
        title: 'Privacy',
        link: '/sign-in',
    },
    {
        title: 'Terms',
        link: '/help',
    },
]

const Footer = () => {
    return (
        <div className="border-t border-gray-200 overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-4">
                    <div className="text-lg font-bold">Work Hays</div>
                    <div>
                        <div className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                            For Employers
                        </div>
                        <ul className="mt-4 space-y-2">
                            {EMPLOYER_LINKS.map(({ title, link }, index) => (
                                <li key={index}>
                                    <a
                                        href={link}
                                        className="text-base text-gray-600 hover:text-gray-900 hover:underline"
                                    >
                                        {title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                            Links
                        </div>
                        <ul className="mt-4 space-y-2">
                            {LINKS.map(({ title, link }, index) => (
                                <li key={index}>
                                    <a
                                        href={link}
                                        className="text-base text-gray-600 hover:text-gray-900 hover:underline"
                                    >
                                        {title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="py-5 mt-10 border-t border-gray-200 flex flex-row justify-between items-center">
                    <div className="text-base text-gray-400">
                        © {new Date().getFullYear()} Work Hays. All rights reserved.
                    </div>
                    <Link href="#">
                        <a className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">Facebook</span>
                            <svg
                                className="h-6 w-6"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </a>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Footer
