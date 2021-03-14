import Link from 'next/link'

type LinkType = {
    title: string
    link: string
}

const EMPLOYER_LINKS: LinkType[] = [
    {
        title: 'Post a job',
        link: '/register',
    },
    {
        title: 'Register',
        link: '/register',
    },
    {
        title: 'Login',
        link: '/login',
    },
    {
        title: 'Help',
        link: '/help',
    },
]

const LINKS: LinkType[] = [
    {
        title: 'Contact',
        link: '/contact',
    },
    {
        title: 'About',
        link: '/about',
    },
    {
        title: 'Privacy',
        link: '/privacy',
    },
    {
        title: 'Terms',
        link: '/terms',
    },
]

const Footer = () => {
    return (
        <div className="border-t border-gray-200 overflow-hidden">
            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-4">
                    <div>
                        <Link href="/">
                            <a className="text-lg font-bold text-gray-700 hover:text-gray-900 hover:underline inline-block">
                                Work Hays
                            </a>
                        </Link>
                    </div>
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
                    <div className="flex flex-row items-center space-x-2">
                        <Link href="https://github.com/garrettbland/workhays-next">
                            <a
                                className="text-gray-400 hover:text-gray-500"
                                target="_blank"
                                rel="noopener"
                            >
                                <span className="sr-only">GitHub</span>
                                <svg
                                    className="h-6 w-6"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </a>
                        </Link>
                        <Link href="https://www.facebook.com/workhays">
                            <a
                                target="_blank"
                                rel="noopener"
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Facebook</span>
                                <svg
                                    className="h-6 w-6"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </a>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Footer
