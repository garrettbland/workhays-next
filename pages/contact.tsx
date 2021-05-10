import { useState } from 'react'
import Layout from '@/components/Layout'
import Header from '@/components/Header'
import TextInput from '@/components/TextInput'
import TextAreaInput from '@/components/TextAreaInput'
import PrimaryButton from '@/components/PrimaryButton'

interface ContactFields {
    first_name: string
    last_name: string
    phone_number: string
    email_address: string
}

const Contact = () => {
    const [contactForm, updateForm] = useState<ContactFields>({
        first_name: '',
        last_name: '',
        phone_number: '',
        email_address: '',
    })

    const handleInputChange = (key: string, value: string) => {
        updateForm({
            ...contactForm,
            [key]: value,
        })
    }

    return (
        <Layout>
            <Header
                title="Contact Us"
                description="Please fill out the following form to contact us. We will try to respond as soon as we can."
            />
            <section>
                <div>
                    <form
                        name="contact"
                        method="POST"
                        data-netlify="true"
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <input type="hidden" name="form-name" value="contact" />

                        <div className="block">
                            <label className="text-gray-700 block">First name</label>
                            <TextInput
                                placeholder="John"
                                value={contactForm.first_name}
                                onChange={(event) =>
                                    handleInputChange('first_name', event.target.value)
                                }
                            />
                        </div>
                        <div className="block">
                            <label className="text-gray-700 block">Last name</label>
                            <TextInput
                                placeholder="Doe"
                                value={contactForm.last_name}
                                onChange={(event) =>
                                    handleInputChange('last_name', event.target.value)
                                }
                            />
                        </div>
                        <div className="block">
                            <label className="text-gray-700 block">Email Address</label>
                            <TextInput
                                placeholder="example@workhays.com"
                                value={contactForm.email_address}
                                onChange={(event) =>
                                    handleInputChange('email_address', event.target.value)
                                }
                            />
                        </div>
                        <div className="block">
                            <label className="text-gray-700 block">Phone Number</label>
                            <TextInput
                                placeholder="123-456-7890"
                                value={contactForm.phone_number}
                                onChange={(event) =>
                                    handleInputChange('phone_number', event.target.value)
                                }
                            />
                        </div>
                        <div className="block col-span-2">
                            <label className="text-gray-700 block">Message</label>
                            <TextAreaInput
                                rows={5}
                                placeholder={`Your message or question`}
                                value={contactForm.phone_number}
                                onChange={(event) =>
                                    handleInputChange('phone_number', event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <PrimaryButton title="Submit" type="submit" />
                        </div>
                    </form>
                </div>
            </section>
        </Layout>
    )
}

export default Contact
