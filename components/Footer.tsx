import Link from 'next/link'
import Image from 'next/image'
import logo from '../public/work-hays-logo.svg'
import { version, footerLinks } from '../siteconfig.js'

const Footer = () => {
    return (
        <footer className="bg-gray-100 border-t border-gray-200">
            <div className="max-w-4xl mx-auto px-5 py-12 flex flex-wrap flex-row justify-between items-start space-y-12 md:space-y-0">
                <div className="w-full md:w-1/3">
                    <Link href="/">
                        <a className="flex flex-row space-x-4 items-center">
                            <Image
                                src={logo}
                                alt="Work Hays Logo"
                                height={32}
                                width={32}
                                className="w-8 h-8 rounded-full"
                            />
                            <div className="flex flex-col">
                                <p>Work Hays</p>
                                <p className="text-gray-600 text-sm">v{version}</p>
                            </div>
                        </a>
                    </Link>
                </div>
                <div className="w-full md:w-2/3 text-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 grid-flow-row gap-4">
                        {footerLinks.map(({ title, href }, index) => (
                            <div key={index}>
                                <Link href={href}>
                                    <a className="inline-block hover:underline">{title}</a>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
