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
            <div className="relative pb-24 bg-blueGray-50">{children}</div>
            <Footer />
        </div>
    )
}

export default Layout
