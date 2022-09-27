import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { AdminSidebar } from '@/components/AdminSidebar'

interface LayoutProps {
    children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
    const { pathname } = useRouter()
    const isAdminRoute = pathname.includes('/admin/')

    return (
        <>
            <Navbar />
            <main className="max-w-4xl mx-auto px-5 pt-24 pb-14 md:py-14 relative z-10">
                {isAdminRoute && (
                    <div className="grid grid-cols-8">
                        <AdminSidebar />
                        <div className="col-span-6 bg-blue-500">{children}</div>
                    </div>
                )}
                {!isAdminRoute && children}
            </main>
            <Footer />
        </>
    )
}
