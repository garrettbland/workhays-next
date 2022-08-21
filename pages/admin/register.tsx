import { useState, FormEvent, ChangeEvent } from 'react'
import { PageTitle } from '@/components/PageTitle'
import Callout from '@/components/Callout'
import { Button } from '@/components/Button'
import Link from 'next/link'
import { BookOpenIcon, CheckIcon, ExclamationCircleIcon, MailIcon } from '@heroicons/react/outline'
import { isEmailValid } from '@/utils/email'

const DEFAULT_FORM_FIELDS = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    businessTitle: '',
    businessContact: '',
    businessEmail: '',
    businessPhone: '',
    businessDescription: '',
}

type FormStatuses = 'idle' | 'loading' | 'complete' | 'error' | 'invalid_email'

const fakeFetch = (waitTime: number) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve('done')
        }, waitTime)
    })

export const Register = () => {
    const [status, setStatus] = useState<FormStatuses>('idle')
    const [form, setForm] = useState(DEFAULT_FORM_FIELDS)

    const submitForm = async (event: FormEvent) => {
        event.preventDefault()
        try {
            setStatus('loading')

            if (!isEmailValid(form.email)) {
                setStatus('invalid_email')
                return
            }

            await fakeFetch(2000)
            setStatus('complete')
            setForm(DEFAULT_FORM_FIELDS)
            alert(JSON.stringify(form))
        } catch (err) {
            setStatus('error')
        }
    }

    const updateForm = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        key: string
    ): void => {
        const value = event.target.value
        setForm({
            ...form,
            [key]: value,
        })
    }
    return (
        <>
            <PageTitle
                title="Register"
                description={`
                    Register today as an employer to post job openings and more to Work Hays. Once created,
                    you will be able to create job openings, add more users, promote your listings, and more.
                `}
            />
            {status === 'error' && (
                <Callout type="warning" icon={<ExclamationCircleIcon className="h-6 w-6" />}>
                    Error. Something went wrong submitting your form, please try again.
                </Callout>
            )}
            {status === 'invalid_email' && (
                <Callout type="warning" icon={<MailIcon className="h-6 w-6" />}>
                    Form not submitted, please provide a valid email address.
                </Callout>
            )}
            {status === 'complete' && (
                <Callout type="success" icon={<CheckIcon className="h-6 w-6" />}>
                    Success! Your submission was submitted successfully.
                </Callout>
            )}
            <section className="mt-12">
                <form name="register" onSubmit={submitForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12 border border-gray-200 p-3 rounded-md">
                        <div className="col-span-1 md:col-span-2 -mt-6">
                            <span className="text-sm uppercase text-gray-700 bg-white px-2">
                                Personal Account Info
                            </span>
                            <span className="bg-gradient-to-r from-white to-transparent w-48 h-3 inline-block"></span>
                            <span className="pl-2 text-sm block antialiased text-gray-700">
                                This information is private and wont be shown publically. This is
                                what you will use to login.
                            </span>
                        </div>
                        <input
                            onChange={(e) => updateForm(e, 'firstName')}
                            value={form.firstName}
                            name="first"
                            placeholder="First Name"
                            type="text"
                            required
                            className="col-span-1"
                        />
                        <input
                            onChange={(e) => updateForm(e, 'lastName')}
                            value={form.lastName}
                            name="last"
                            placeholder="Last Name"
                            type="text"
                            required
                            className="col-span-1"
                        />
                        <input
                            onChange={(e) => updateForm(e, 'email')}
                            value={form.email}
                            name="email"
                            placeholder="Email"
                            type="email"
                            required
                        />
                        <input
                            onChange={(e) => updateForm(e, 'password')}
                            value={form.password}
                            name="password"
                            placeholder="Password"
                            type="password"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 border border-gray-200 p-3 rounded-md">
                        <div className="col-span-1 md:col-span-2 -mt-6">
                            <span className="text-sm uppercase text-gray-700 bg-white px-2">
                                Employer Information
                            </span>
                            <span className="bg-gradient-to-r from-white to-transparent w-48 h-3 inline-block"></span>
                            <span className="pl-2 text-sm block antialiased text-gray-700">
                                This information <span className="font-bold">is public</span> and
                                will be shown publically.
                            </span>
                        </div>
                        <input
                            onChange={(e) => updateForm(e, 'businessTitle')}
                            value={form.businessTitle}
                            name="businessTitle"
                            placeholder="Business Name"
                            type="text"
                            required
                        />
                        <input
                            onChange={(e) => updateForm(e, 'businessContact')}
                            value={form.businessContact}
                            name="businessContact"
                            placeholder="Business Contact"
                            type="text"
                            required
                        />
                        <input
                            onChange={(e) => updateForm(e, 'businessEmail')}
                            value={form.businessEmail}
                            name="businessEmail"
                            placeholder="Business Email"
                            type="email"
                            required
                        />
                        <input
                            onChange={(e) => updateForm(e, 'businessPhone')}
                            value={form.businessPhone}
                            name="businessPhone"
                            placeholder="Business Phone (Optional)"
                            type="text"
                        />
                        <textarea
                            onChange={(e) => updateForm(e, 'businessDescription')}
                            value={form.businessDescription}
                            className="col-span-1 md:col-span-2"
                            placeholder="Business Description (Optional)"
                            rows={5}
                        ></textarea>
                    </div>
                    <p className="text-sm block antialiased text-gray-700 mb-6">
                        By submitting this form, you are automatically agreeing to our{' '}
                        <Link href={`/terms`}>
                            <a className="underline">terms and conditions</a>
                        </Link>
                        . Once your form is submitted, please allow 1-2 business days before your
                        business is verified.
                    </p>
                    <Button
                        type="primary"
                        title={status === 'loading' ? 'Submitting...' : 'Submit'}
                        buttonType="submit"
                        loading={status === 'loading' ? true : false}
                    />
                </form>
            </section>
        </>
    )
}

export default Register
