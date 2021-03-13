import Link from 'next/link'
import { useRouter } from 'next/router'

type LinkType = {
    title: string
    link: string
}

const DESKTOP_LINKS: LinkType[] = [
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
]

const DesktopNav = () => {
    const router = useRouter()

    const isActiveLink = (path: string): boolean => {
        if (router.pathname === path) {
            return true
        }
        return false
    }

    return (
        <div className="hidden md:grid grid-flow-col grid-col-4 gap-2">
            {DESKTOP_LINKS.map(({ title, link }, index) => (
                <Link href={link}>
                    <a className="relative group">
                        <div className="p-4">{title}</div>
                        <div
                            className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 transition duration-150 ease-in-out transform ${
                                isActiveLink(link) ? '' : 'translate-y-1 group-hover:-translate-y-0'
                            }`}
                        ></div>
                    </a>
                </Link>
            ))}
        </div>
    )
}

export default DesktopNav
