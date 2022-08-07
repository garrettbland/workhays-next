import { useState, FormEvent } from 'react'
import { PageTitle } from '@/components/PageTitle'
import Callout from '@/components/Callout'
import Link from 'next/link'
import { QuestionMarkCircleIcon, ExclamationCircleIcon } from '@heroicons/react/outline'
import Button from '@/components/Button'

type Status = 'idle' | 'loading' | 'completed' | 'error'

const SignIn = () => {
    const [status, setStatus] = useState<Status>('idle')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const submitForm = (event: FormEvent): void => {
        event.preventDefault()
        setStatus('loading')
        setEmail('')
        setPassword('')
        alert('logged in...')
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
                        />
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            name="password"
                            placeholder="Password"
                            type="password"
                            className="block w-full md:w-1/2"
                        />
                        <Button
                            title={status === 'loading' ? 'Loading...' : 'Sign In'}
                            type="submit"
                        />
                    </div>
                </form>
            </section>
        </>
    )
}

export default SignIn
