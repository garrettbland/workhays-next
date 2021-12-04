import { useState } from 'react'
import Layout from '@/components/Layout'
import PageTitle from '@/components/PageTitle'
import Callout from '@/components/Callout'
import Link from 'next/link'
import { BookOpenIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/outline'
import Button from '@/components/Button'
import { is_email_valid } from '@/lib/email'

const DEFAULT_FORM_FIELDS = {
    first_name: '',
    last_name: '',
    email: '',
    business: '',
    message: '',
}

/**
 * This is a function that does something
 */
const Contact = () => {
    const [contactForm, setContactForm] = useState(DEFAULT_FORM_FIELDS)
    const [successfulSubmit, setSuccessfulSubmit] = useState(false)
    const [formError, setFormError] = useState('')
    const [isLoading, setLoading] = useState(false)

    const submit_form = (event) => {
        event.preventDefault()
        setFormError('')
        if (is_email_valid(contactForm.email)) {
            setContactForm(DEFAULT_FORM_FIELDS)
            setSuccessfulSubmit(true)
            alert(JSON.stringify(contactForm))
        } else {
            setFormError('Error. Please provide a valid email address.')
        }
    }

    const update_form = (event, key) => {
        const value = event.target.value
        setContactForm({
            ...contactForm,
            [key]: value,
        })
    }

    return (
        <Layout>
            <PageTitle
                title="Contact Us"
                description="Have questions or comments? Please fill out the form below and we will be in touch as soon as we can."
            />
            <Callout icon={<BookOpenIcon className="h-6 w-6" />}>
                <Link href="/faq">
                    <a>Click here</a>
                </Link>{' '}
                to view our frequently asked questions
            </Callout>
            {formError !== '' && (
                <Callout type="warning" icon={<ExclamationCircleIcon className="h-6 w-6" />}>
                    {formError}
                </Callout>
            )}
            {successfulSubmit && (
                <Callout type="success" icon={<CheckIcon className="h-6 w-6" />}>
                    Success! Your submission was submitted successfully.
                </Callout>
            )}
            <section>
                <form name="contact" onSubmit={submit_form}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                        <input
                            onChange={(e) => update_form(e, 'first_name')}
                            value={contactForm.first_name}
                            name="first"
                            placeholder="First Name"
                            type="text"
                        />
                        <input
                            onChange={(e) => update_form(e, 'last_name')}
                            value={contactForm.last_name}
                            name="last"
                            placeholder="Last Name"
                            type="text"
                        />
                        <input
                            onChange={(e) => update_form(e, 'email')}
                            value={contactForm.email}
                            name="email"
                            placeholder="Email"
                            type="email"
                        />
                        <input
                            onChange={(e) => update_form(e, 'business')}
                            value={contactForm.business}
                            name="business"
                            placeholder="Business (optional)"
                            type="text"
                        />
                        <textarea
                            onChange={(e) => update_form(e, 'message')}
                            value={contactForm.message}
                            className="col-span-1 md:col-span-2"
                            placeholder="Your Message"
                            rows="5"
                        ></textarea>
                    </div>
                    <Button title={isLoading ? 'Loading...' : 'Submit'} type="submit" />
                </form>
            </section>
        </Layout>
    )
}

export default Contact
