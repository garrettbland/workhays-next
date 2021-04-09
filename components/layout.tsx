import { ReactNode } from 'react'
import Navbar from './navbar'
import Footer from './footer'

interface LayoutProps {
    children?: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="relative">
            <Navbar />
            <div className="relative py-24">{children}</div>
            <Footer />
        </div>
    )
}

export default Layout
