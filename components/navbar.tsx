import DesktopNav from './desktopNav'
import MobileNav from './mobileNav'
import Link from 'next/link'

const Navbar = () => {
    return (
        <div className="border-b border-gray-200 overflow-hidden sticky top-0 bg-white z-40 shadow-sm">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex flex-row items-center justify-between">
                    <Link href="/">
                        <div className="flex flex-row items-center space-x-2">
                            <img
                                src="/work-hays-logo.svg"
                                alt="Work Hays Logo"
                                className="w-10 h-10"
                            />
                            <a className="text-lg font-bold text-gray-700 hover:text-gray-900 hover:underline inline-block">
                                Work Hays
                            </a>
                        </div>
                    </Link>
                    <DesktopNav />
                    <MobileNav />
                </div>
            </div>
        </div>
    )
}

export default Navbar
