import Link from 'next/link'
import {
    HomeIcon,
    BriefcaseIcon,
    CalendarIcon,
    ChatIcon,
    ClipboardCheckIcon,
    LockOpenIcon,
    IdentificationIcon,
} from '@heroicons/react/solid'

interface MobileMenuItem {
    link: string
    icon: JSX.Element
    title: string
}

const MENU_ITEMS: MobileMenuItem[] = [
    {
        link: '/',
        icon: <HomeIcon className="w-5 h-5 text-indigo-600" />,
        title: 'Home',
    },
    {
        link: '/',
        icon: <BriefcaseIcon className="w-5 h-5 text-indigo-600" />,
        title: 'Jobs',
    },
    {
        link: '/events',
        icon: <CalendarIcon className="w-5 h-5 text-indigo-600" />,
        title: 'Events',
    },
    {
        link: '/contact',
        icon: <ChatIcon className="w-5 h-5 text-indigo-600" />,
        title: 'Contact Us',
    },
]

const NON_LOGGED_IN_MENU_ITEMS: MobileMenuItem[] = [
    {
        link: '/admin/register',
        icon: <ClipboardCheckIcon className="w-5 h-5 text-indigo-600" />,
        title: 'Registration',
    },
    {
        link: '/admin/sign-in',
        icon: <LockOpenIcon className="w-5 h-5 text-indigo-600" />,
        title: 'Sign In',
    },
]

const LOGGED_IN_MENU_ITEMS: MobileMenuItem[] = [
    {
        link: '/admin/dashboard',
        icon: <IdentificationIcon className="w-5 h-5 text-indigo-600" />,
        title: 'Dashboard',
    },
]

export const MobileMenu = ({ visible, isSignedIn }: { visible: boolean; isSignedIn: boolean }) => {
    if (!visible) return null

    const MOBILE_MENU_ITEMS = [
        ...MENU_ITEMS,
        ...(isSignedIn ? LOGGED_IN_MENU_ITEMS : NON_LOGGED_IN_MENU_ITEMS),
    ]

    return (
        <div className="grid grid-cols-2 gap-5 px-5 pt-5 pb-3">
            {MOBILE_MENU_ITEMS.map((item) => (
                <Link href={item.link} key={item.title}>
                    <a className="flex flex-col items-center justify-center border bg-gray-100 rounded p-2 text-center">
                        {item.icon}
                        <span>{item.title}</span>
                    </a>
                </Link>
            ))}
        </div>
    )
}
