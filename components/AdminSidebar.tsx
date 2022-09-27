import Link from 'next/link'
import { useRouter } from 'next/router'
import {
    HomeIcon,
    BriefcaseIcon,
    LocationMarkerIcon,
    UserCircleIcon,
    UserGroupIcon,
    OfficeBuildingIcon,
} from '@heroicons/react/outline'

import {
    HomeIcon as HomeIconSolid,
    BriefcaseIcon as BriefcaseIconSolid,
    LocationMarkerIcon as LocationMarkerIconSolid,
    UserCircleIcon as UserCircleIconSolid,
    UserGroupIcon as UserGroupIconSolid,
    OfficeBuildingIcon as OfficeBuildingIconSolid,
} from '@heroicons/react/solid'

export const AdminSidebar = () => {
    const { asPath } = useRouter()

    const isActive = (search: string): string => (asPath.includes(search) ? 'underline' : '')

    return (
        <div className="col-span-2">
            <ul className="flex flex-col">
                <Link href={'/admin/dashboard'}>
                    <a className={`${isActive('dashboard')} flex flex-row`}>
                        {isActive('dashboard') ? (
                            <HomeIconSolid className="w-6 h-6" />
                        ) : (
                            <HomeIcon className="w-6 h-6" />
                        )}
                        <span>Dashboard</span>
                    </a>
                </Link>
                <Link href={'/admin/jobs'}>
                    <a className={`${isActive('jobs/')} flex flex-row`}>
                        {isActive('jobs') ? (
                            <BriefcaseIconSolid className="w-6 h-6" />
                        ) : (
                            <BriefcaseIcon className="w-6 h-6" />
                        )}
                        <span>Jobs</span>
                    </a>
                </Link>
                <Link href={'/admin/business'}>
                    <a className={`${isActive('business')} flex flex-row`}>
                        {isActive('business') ? (
                            <LocationMarkerIconSolid className="w-6 h-6" />
                        ) : (
                            <LocationMarkerIcon className="w-6 h-6" />
                        )}
                        <span>Business</span>
                    </a>
                </Link>
                <Link href={'/admin/account'}>
                    <a className={`${isActive('account')} flex flex-row`}>
                        {isActive('account') ? (
                            <UserCircleIconSolid className="w-6 h-6" />
                        ) : (
                            <UserCircleIcon className="w-6 h-6" />
                        )}
                        <span>Account</span>
                    </a>
                </Link>
                <Link href={'/admin/users'}>
                    <a className={`${isActive('users')} flex flex-row`}>
                        {isActive('users') ? (
                            <UserGroupIconSolid className="w-6 h-6" />
                        ) : (
                            <UserGroupIcon className="w-6 h-6" />
                        )}
                        <span>Users</span>
                    </a>
                </Link>
                <Link href={'/admin/employers'}>
                    <a className={`${isActive('employers')} flex flex-row`}>
                        {isActive('employers') ? (
                            <OfficeBuildingIconSolid className="w-6 h-6" />
                        ) : (
                            <OfficeBuildingIcon className="w-6 h-6" />
                        )}
                        <span>Employers</span>
                    </a>
                </Link>
            </ul>
        </div>
    )
}
