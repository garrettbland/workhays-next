import { DesktopLink } from '../components/navbarLink'

const DESKTOP_LINKS = [
    {
        title: 'Jobs',
        link: '/',
    },
    {
        title: 'For Employers',
        link: '/employers',
    },
    {
        title: 'Sign In',
        link: '/signin',
    },
]

const Navbar = () => {
    return (
        <div className="border-b border-blue-50 overflow-hidden">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex flex-row items-center justify-between">
                    <div>Work Hays</div>
                    <div className="grid grid-flow-col grid-col-4 gap-2">
                        {DESKTOP_LINKS.map(({ title, link }, index) => (
                            <DesktopLink key={index} title={title} link={link} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar
