import DesktopNav from './desktopNav'
import MobileNav from './mobileNav'
import Link from 'next/link'

const Navbar = () => {
    return (
        <div className="border-b border-gray-200 overflow-hidden sticky top-0 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <Link href="/">
                            <a className="text-lg font-bold text-gray-700 hover:text-gray-900 hover:underline inline-block">
                                Work Hays
                            </a>
                        </Link>
                    </div>
                    <DesktopNav />
                    <MobileNav />
                </div>
            </div>
        </div>
    )
}

export default Navbar
