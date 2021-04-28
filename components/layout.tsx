import { ReactNode } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface LayoutProps {
    children?: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="relative">
            <Navbar />
            {children}
            <Footer />
        </div>
    )
}

export default Layout
