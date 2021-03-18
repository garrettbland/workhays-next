import Link from 'next/link'
import { useRouter } from 'next/router'
import { DESKTOP_LINKS } from '../config'

const DesktopNav = () => {
    const { pathname } = useRouter()

    return (
        <div className="hidden md:grid grid-flow-col grid-col-4 gap-2">
            {DESKTOP_LINKS.map(({ title, href, target = '_self' }, index) => (
                <Link href={href} key={index}>
                    <a
                        className="relative group"
                        target={target}
                        rel={target !== '_self' ? 'noopener' : ''}
                    >
                        <div className="p-4">{title}</div>
                        <div
                            className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 transition duration-150 ease-in-out transform ${
                                pathname === href ? '' : 'translate-y-1 group-hover:-translate-y-0'
                            }`}
                        ></div>
                    </a>
                </Link>
            ))}
        </div>
    )
}

export default DesktopNav
