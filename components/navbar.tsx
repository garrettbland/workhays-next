import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { DESKTOP_LINKS } from '../config'

const Navbar = () => {
    const [isMenuOpen, setMenuOpen] = useState<boolean>(false)
    const { pathname } = useRouter()
    return (
        <div className="relative z-40">
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
                    <button className="flex items-center focus:outline-none text-white p-2 rounded-lg bg-white bg-opacity-20">
                        <span className="mr-2">Menu</span>
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

// const Navbar = () => {
//     return (
//         <div className="border-b border-gray-200 overflow-hidden fixed top-0 left-0 w-full bg-white z-40 shadow-sm">
//             <div className="max-w-5xl mx-auto px-4">
//                 <div className="flex flex-row items-center justify-between">
//                     <Link href="/">
//                         <div className="flex flex-row items-center space-x-2 cursor-pointer group">
//                             <img
//                                 src="/work-hays-logo.svg"
//                                 alt="Work Hays Logo"
//                                 className="w-10 h-10"
//                             />
//                             <a className="text-lg font-bold text-gray-700 hover:text-gray-900 group-hover:underline inline-block">
//                                 Work Hays
//                             </a>
//                         </div>
//                     </Link>
//                     <DesktopNav />
//                     <MobileNav />
//                 </div>
//             </div>
//         </div>
//     )
// }

export default Navbar
