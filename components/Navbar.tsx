import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '../public/work-hays-logo.svg'
import { Button } from '@/components/Button'
import { MenuIcon, XIcon } from '@heroicons/react/outline'
import { MobileMenu } from '@/components/MobileMenu'
import { useRouter } from 'next/router'

const Navbar = () => {
    const router = useRouter()
    const [isSignedIn] = useState(false)
    const [isMobileMenuVisible, setMobileMenu] = useState(false)

    useEffect(() => {
        setMobileMenu(false)
    }, [router.pathname])

    return (
        <>
            <div className="bg-gray-100 border-b border-gray-200 hidden md:block">
                <div className="max-w-4xl mx-auto px-5 py-1 text-sm flex flex-row justify-end text-black divide-gray-200">
                    {isSignedIn && (
                        <Link href="/admin/dashboard">
                            <a className="antialiased hover:underline px-4">Dashboard</a>
                        </Link>
                    )}
                    {!isSignedIn && (
                        <>
                            <Link href="/register">
                                <a className="antialiased hover:underline px-4">
                                    Employer Registration
                                </a>
                            </Link>
                            <Link href="/sign-in">
                                <a className="antialiased hover:underline px-4">Sign In</a>
                            </Link>
                        </>
                    )}
                </div>
            </div>
            <nav className="fixed md:sticky top-0 left-0 z-20 w-full">
                <div className="w-full border-b-2 border-gray-200 bg-white bg-opacity-60 backdrop-filter backdrop-blur-md py-2 md:py-0">
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
                        <div className="block md:hidden">
                            <Button
                                onClick={() => setMobileMenu((current) => !current)}
                                type="primary"
                                icon={
                                    isMobileMenuVisible ? (
                                        <XIcon className="w-5 h-5 text-white" />
                                    ) : (
                                        <MenuIcon className="w-5 h-5 text-white transform rotate-180" />
                                    )
                                }
                            />
                        </div>
                        <div className="hidden md:block">
                            <Link href="/admin/#/jobs/new">
                                <a>
                                    <Button title="Post Your Job" type="primary" />
                                </a>
                            </Link>
                        </div>
                    </div>
                    <MobileMenu visible={isMobileMenuVisible} isSignedIn={isSignedIn} />
                </div>
            </nav>
        </>
    )
}

export default Navbar
