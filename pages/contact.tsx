import { useState } from 'react'
import Layout from '@/components/Layout'
import Header from '@/components/Header'
import TextInput from '@/components/TextInput'

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="block">
                        <label className="text-gray-700 block">First name</label>
                        <TextInput placeholder="John" value={contactForm.first_name} />
                    </div>
                    <div className="block">
                        <label className="text-gray-700 block">Last name</label>
                        <TextInput placeholder="Doe" value={contactForm.last_name} />
                    </div>
                    <div className="block">
                        <label className="text-gray-700 block">Email Address</label>
                        <TextInput placeholder="Doe" value={contactForm.email_address} />
                    </div>
                    <div className="block">
                        <label className="text-gray-700 block">Phone Number</label>
                        <TextInput placeholder="Doe" value={contactForm.phone_number} />
                    </div>
                </div>
            </section>
        </Layout>
    )
}

export default Contact
