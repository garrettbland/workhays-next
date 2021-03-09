import Link from 'next/link'
import { useRouter } from 'next/router'

type LinkProps = {
    title: string
    link: string
}

export const DesktopLink = ({ title, link }: LinkProps) => {
    const router = useRouter()

    const isActiveLink = (path: string): boolean => {
        if (router.pathname === path) {
            return true
        }
        return false
    }

    return (
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
    )
}

export const MobileLink = () => {
    return <></>
}
