import { useState, FormEvent, useEffect } from 'react'
import { PageTitle } from '@/components/PageTitle'
import Callout from '@/components/Callout'
import Link from 'next/link'
import { QuestionMarkCircleIcon, ExclamationCircleIcon, MailIcon } from '@heroicons/react/outline'
import { Button } from '@/components/Button'
import { isEmailValid } from '@/utils/email'

type FormStatuses = 'idle' | 'loading' | 'complete' | 'error' | 'invalid_email'

const SignIn = () => {
    const [status, setStatus] = useState<FormStatuses>('idle')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const fakeFetch = (waitTime: number) =>
        new Promise((resolve) => {
            setTimeout(() => {
                resolve('done')
            }, waitTime)
        })

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

            if (!isEmailValid(email)) {
                setStatus('invalid_email')
                return
            }

            await fakeFetch(2000)
            setStatus('complete')
        } catch (err) {
            setStatus('error')
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
