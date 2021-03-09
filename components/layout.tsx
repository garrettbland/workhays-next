import { ReactNode } from 'react'
import Navbar from './navbar'
import Footer from './footer'

type LayoutProps = {
    children?: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div>
            <Navbar />
            <div>{children}</div>
            <Footer />
        </div>
    )
}

export default Layout
