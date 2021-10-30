import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const Layout = ({ children }) => {
    return (
        <>
            <Navbar />
            <main className="max-w-4xl mx-auto px-5 py-14 relative z-10">{children}</main>
            <Footer />
        </>
    )
}

export default Layout
