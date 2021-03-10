import { DesktopLink } from '../components/navbarLink'
import Link from 'next/link'

const DESKTOP_LINKS = [
    {
        title: 'Jobs',
        link: '/',
    },
    {
        title: 'For Employers',
        link: '/employers',
    },
    {
        title: 'Sign In',
        link: '/signin',
    },
]

const Navbar = () => {
    return (
        <div className="border-b border-gray-200 overflow-hidden">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <Link href="/">
                            <a className="text-lg font-bold text-gray-700 hover:text-gray-900 hover:underline inline-block">
                                Work Hays
                            </a>
                        </Link>
                    </div>
                    <div className="grid grid-flow-col grid-col-4 gap-2">
                        {DESKTOP_LINKS.map(({ title, link }, index) => (
                            <DesktopLink key={index} title={title} link={link} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar
