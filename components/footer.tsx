import Link from 'next/link'

type FooterLinkType = {
    title: string
    link: string
}

const FOOTER_LINKS: FooterLinkType[] = [
    {
        title: 'About',
        link: '/about',
    },
    {
        title: 'Contact',
        link: '/contact',
    },
    {
        title: 'Privacy',
        link: '/privacy',
    },
]

const Footer = () => {
    return (
        <div className="border-t border-blue-50 overflow-hidden">
            <div className="max-w-4xl mx-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <div>Work Hays</div>
                    <div>
                        <div className="uppercase">For Employers</div>
                        <div>Post a job</div>
                        <div>Sign Up</div>
                        <div>Sign In</div>
                        <div>Help</div>
                    </div>
                    <div>
                        <div className="uppercase">Links</div>
                        <div>Contact</div>
                        <div>About</div>
                        <div>Privacy</div>
                        <div>Terms</div>
                    </div>
                </div>
                <div className="text-center py-5">
                    Copyright {new Date().getFullYear()} Work Hays
                </div>
            </div>
        </div>
    )
}

export default Footer
