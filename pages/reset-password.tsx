import { useState, FormEvent, useEffect } from 'react'
import { PageTitle } from '@/components/PageTitle'
import Callout from '@/components/Callout'
import { ExclamationCircleIcon, MailIcon } from '@heroicons/react/outline'
import { Button } from '@/components/Button'
import { isEmailValid } from '@/utils/email'

type FormStatuses = 'idle' | 'loading' | 'complete' | 'error' | 'invalid_email'

const ResetPassword = () => {
    const [status, setStatus] = useState<FormStatuses>('idle')
    const [email, setEmail] = useState('')

    const fakeFetch = (waitTime: number) =>
        new Promise((resolve) => {
            setTimeout(() => {
                resolve('done')
            }, waitTime)
        })

    useEffect(() => {
        if (status === 'complete') {
            setEmail('')
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
                title="Reset Password"
                description="Enter your email below and we will email you a special link to set a new password."
            />
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
                <form name="reset-password" onSubmit={submitForm}>
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
                        <Button
                            title={status === 'loading' ? 'Loading...' : 'Reset My Password'}
                            buttonType="submit"
                            type="primary"
                            loading={status === 'loading'}
                        />
                    </div>
                </form>
            </section>
        </>
    )
}

export default ResetPassword
