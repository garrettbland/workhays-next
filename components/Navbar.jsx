import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '../public/work-hays-logo.svg'

const Navbar = () => {
    const [isSignedIn, setSignedIn] = useState(false)
    return (
        <>
            <div className="bg-gray-100 border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-5 py-1 text-sm flex flex-row justify-end text-black divide-gray-200">
                    {isSignedIn && (
                        <Link href="/admin/#/dashboard">
                            <a className="antialiased hover:underline px-4">Dashboard</a>
                        </Link>
                    )}
                    {!isSignedIn && (
                        <>
                            <Link href="/admin/#/register">
                                <a className="antialiased hover:underline px-4">
                                    Employer Registration
                                </a>
                            </Link>
                            <Link href="/admin/#/sign-in">
                                <a className="antialiased hover:underline px-4">Sign In</a>
                            </Link>
                        </>
                    )}
                </div>
            </div>
            <nav className="sticky top-0 left-0 z-20 w-full">
                <div className="w-full border-b-2 border-gray-200 bg-white bg-opacity-60 backdrop-filter backdrop-blur-md">
                    <div className="max-w-4xl mx-auto flex flex-row items-center justify-between px-5">
                        <div className="flex flex-row space-x-12">
                            <Link href="/">
                                <a className="flex flex-row space-x-4 items-center hover:underline">
                                    <Image
                                        src={logo}
                                        alt="Work Hays Logo"
                                        height={32}
                                        width={32}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <p>Work Hays</p>
                                </a>
                            </Link>
                            <div className="hidden md:flex flex-row items-center space-x-4 text-sm">
                                <Link href="/">
                                    <a className="px-4 py-4 border-b-2 border-transparent hover:border-indigo-600">
                                        Jobs
                                    </a>
                                </Link>
                                <Link href="/events">
                                    <a className="px-4 py-4 border-b-2 border-transparent hover:border-indigo-600">
                                        Events
                                    </a>
                                </Link>
                                <Link href="/contact">
                                    <a className="px-4 py-4 border-b-2 border-transparent hover:border-indigo-600">
                                        Contact
                                    </a>
                                </Link>
                            </div>
                        </div>
                        <Link href="/admin/#/jobs/new">
                            <a className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-5 py-2 hidden md:block text-sm transition-all">
                                Post Your Job
                            </a>
                        </Link>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default Navbar
