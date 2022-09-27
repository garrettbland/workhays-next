import { useState, FormEvent, ChangeEvent } from 'react'
import { PageTitle } from '@/components/PageTitle'
import Callout from '@/components/Callout'
import Link from 'next/link'
import { BookOpenIcon, CheckIcon, ExclamationCircleIcon, MailIcon } from '@heroicons/react/outline'
import { Button } from '@/components/Button'
import { isEmailValid } from '@/utils/email'
import { supabase } from '@/supabase'
import { ContactSubmissionForm } from '@/types'

type FormStatuses = 'idle' | 'loading' | 'complete' | 'error' | 'invalid_email'

const DEFAULT_FORM_FIELDS = {
    firstName: '',
    lastName: '',
    email: '',
    business: '',
    message: '',
}

const fakeFetch = (waitTime: number) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve('done')
        }, waitTime)
    })

/**
 * This is a function that does something
 */
const Contact = () => {
    const [status, setStatus] = useState<FormStatuses>('idle')
    const [contactForm, setContactForm] = useState<ContactSubmissionForm>(DEFAULT_FORM_FIELDS)

    const submitForm = async (event: FormEvent) => {
        event.preventDefault()
        try {
            setStatus('loading')

            if (!isEmailValid(contactForm.email)) {
                setStatus('invalid_email')
                return
            }

            const { data, error } = await supabase
                .from('submissions')
                .insert([contactForm as ContactSubmissionForm])

            if (error) {
                setStatus('error')
                return
            }

            console.log(data)

            setStatus('complete')
            setContactForm(DEFAULT_FORM_FIELDS)
        } catch (err) {
            setStatus('error')
        }
    }

    const updateForm = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        key: string
    ): void => {
        const value = event.target.value
        setContactForm({
            ...contactForm,
            [key]: value,
        })
    }

    return (
        <>
            <PageTitle
                title="Contact Us"
                description="Have questions or comments? Please fill out the form below and we will be in touch as soon as we can."
            />
            <Callout icon={<BookOpenIcon className="h-6 w-6" />}>
                <Link href="/faqs">
                    <a>Click here</a>
                </Link>{' '}
                to view our frequently asked questions
            </Callout>
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
            <section>
                <form name="contact" onSubmit={submitForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                        <input
                            onChange={(e) => updateForm(e, 'firstName')}
                            value={contactForm.firstName}
                            name="first"
                            placeholder="First Name"
                            type="text"
                            required
                        />
                        <input
                            onChange={(e) => updateForm(e, 'lastName')}
                            value={contactForm.lastName}
                            name="last"
                            placeholder="Last Name"
                            type="text"
                            required
                        />
                        <input
                            onChange={(e) => updateForm(e, 'email')}
                            value={contactForm.email}
                            name="email"
                            placeholder="Email"
                            type="email"
                            required
                        />
                        <input
                            onChange={(e) => updateForm(e, 'business')}
                            value={contactForm.business}
                            name="business"
                            placeholder="Business (optional)"
                            type="text"
                        />
                        <textarea
                            onChange={(e) => updateForm(e, 'message')}
                            value={contactForm.message}
                            className="col-span-1 md:col-span-2"
                            placeholder="Your Message"
                            rows={5}
                            required
                        ></textarea>
                    </div>
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

export default Contact
