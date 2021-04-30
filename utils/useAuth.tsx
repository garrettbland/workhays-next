import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'

interface ReturnType {
    isSignedIn: boolean | null
}

export const useAuth = (): ReturnType => {
    const [isSignedIn, setSignedIn] = useState<boolean | null>(null)

    useEffect(() => {
        console.log('checking on auth...')

        // Check auth
        const session = supabase.auth.session()
        if (session) {
            setSignedIn(true)
        } else {
            setSignedIn(false)
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setSignedIn(true)
            } else {
                setSignedIn(false)
            }
        })
    }, [])

    return {
        isSignedIn,
    }
}
