import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ReactNode } from 'react'

interface LayoutProps {
    children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <>
            <Navbar />
            <main className="max-w-4xl mx-auto px-5 py-14 relative z-10">{children}</main>
            <Footer />
        </>
    )
}

export default Layout
