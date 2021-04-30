import { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/utils/useAuth'

interface Props {
    children: ReactNode
}

const PrivateRoute = ({ children }: Props) => {
    const router = useRouter()
    const { isSignedIn } = useAuth()

    // Show something while loading auth
    if (isSignedIn === null) {
        return <div>Loading...</div>
    }

    // User is not signed in
    if (!isSignedIn) {
        router.push('/login')
        return <div>Redirecting...</div>
    }

    return <>{children}</>
}

export default PrivateRoute
