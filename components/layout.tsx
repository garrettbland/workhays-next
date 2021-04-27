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
            {children}
            <Footer />
        </div>
    )
}

export default Layout
