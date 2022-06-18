import { useState, FormEvent, ChangeEvent } from 'react'
import PageTitle from '@/components/PageTitle'
import Callout from '@/components/Callout'
import Link from 'next/link'
import { BookOpenIcon, CheckIcon, ExclamationCircleIcon, MailIcon } from '@heroicons/react/outline'
import Button from '@/components/Button'
import { isEmailValid } from '@/utils/email'

type FormStatuses = 'idle' | 'loading' | 'complete' | 'error' | 'invalid_email'

const DEFAULT_FORM_FIELDS = {
    firstName: '',
    lastName: '',
    email: '',
    business: '',
    message: '',
}

/**
 * This is a function that does something
 */
const Contact = () => {
    const [status, setStatus] = useState<FormStatuses>('idle')
    const [contactForm, setContactForm] = useState(DEFAULT_FORM_FIELDS)

    const submitForm = (event: FormEvent): void => {
        event.preventDefault()
        setStatus('loading')
        if (isEmailValid(contactForm.email)) {
            setContactForm(DEFAULT_FORM_FIELDS)
            setStatus('complete')
            alert(JSON.stringify(contactForm))
        } else {
            setStatus('invalid_email')
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
                    Error. Please provide a valid email address.
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
                        />
                        <input
                            onChange={(e) => updateForm(e, 'lastName')}
                            value={contactForm.lastName}
                            name="last"
                            placeholder="Last Name"
                            type="text"
                        />
                        <input
                            onChange={(e) => updateForm(e, 'email')}
                            value={contactForm.email}
                            name="email"
                            placeholder="Email"
                            type="email"
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
                        ></textarea>
                    </div>
                    <Button title={status === 'loading' ? 'Loading...' : 'Submit'} type="submit" />
                </form>
            </section>
        </>
    )
}

export default Contact
