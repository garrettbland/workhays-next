import { useState, FormEvent, useEffect } from 'react'
import { PageTitle } from '@/components/PageTitle'
import Callout from '@/components/Callout'
import Link from 'next/link'
import { QuestionMarkCircleIcon, ExclamationCircleIcon, MailIcon } from '@heroicons/react/outline'
import { Button } from '@/components/Button'
import { isEmailValid } from '@/utils/email'
import { supabase } from '@/supabase'
import { useRouter } from 'next/router'

type FormStatuses = 'idle' | 'loading' | 'complete' | 'error' | 'invalid_email' | 'invalid_login'

const SignIn = () => {
    const { push } = useRouter()
    const [status, setStatus] = useState<FormStatuses>('idle')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        if (status === 'complete') {
            setEmail('')
            setPassword('')
        }
    }, [status])

    const submitForm = async (event: FormEvent) => {
        event.preventDefault()
        try {
            setStatus('loading')

            if (!isEmailValid) throw Error('invalid_email')

            if (!isEmailValid(email)) {
                setStatus('invalid_email')
                return
            }

            const { error } = await supabase.auth.signIn({ email: email, password: password })

            if (error) throw Error('invalid_login')

            setStatus('complete')
            push('/admin/dashboard')
        } catch (error) {
            console.log(error)
            let message: FormStatuses = 'error'
            if (error instanceof Error) {
                message = error.message as FormStatuses
            }
            setStatus(message)
        }
    }

    return (
        <>
            <PageTitle
                title="Sign In"
                description="Sign in to Work Hays to manage your job openings and events."
            />
            <Callout type="info" icon={<QuestionMarkCircleIcon className="h-6 w-6" />}>
                Don't have an account yet?{' '}
                <Link href="/admin/register">
                    <a>Click here</a>
                </Link>{' '}
                to register as an employer for free.
            </Callout>
            {status === 'invalid_email' && (
                <Callout type="warning" icon={<MailIcon className="h-6 w-6" />}>
                    Email address invalid, please try again.
                </Callout>
            )}
            {status === 'invalid_login' && (
                <Callout type="warning" icon={<MailIcon className="h-6 w-6" />}>
                    Email or password is incorrect, please try again.
                </Callout>
            )}
            {status === 'error' && (
                <Callout type="warning" icon={<ExclamationCircleIcon className="h-6 w-6" />}>
                    There was an error signing in, please try again.
                </Callout>
            )}
            <section>
                <form name="sign-in" onSubmit={submitForm}>
                    <div className="space-y-5">
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            name="email"
                            placeholder="Email"
                            type="email"
                            className="block w-full md:w-1/2"
                            required
                        />
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            name="password"
                            placeholder="Password"
                            type="password"
                            className="block w-full md:w-1/2"
                            required
                        />
                        <div className="flex flex-col md:flex-row items-center space-x-5 space-y-5 md:space-y-0">
                            <Button
                                title={status === 'loading' ? 'Loading...' : 'Sign In'}
                                buttonType="submit"
                                type="primary"
                                loading={status === 'loading'}
                            />
                            <Link href={`/admin/reset-password`}>
                                <a className="text-sm hover:underline">Forgot your password?</a>
                            </Link>
                        </div>
                    </div>
                </form>
            </section>
        </>
    )
}

export default SignIn
