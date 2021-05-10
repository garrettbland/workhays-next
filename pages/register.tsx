import Layout from '@/components/Layout'
import Header from '@/components/Header'
import Link from 'next/link'

const Register = () => {
    return (
        <Layout>
            <Header
                title="Register"
                description="Register today as an employer to post job openings and contact information to Work Hays."
            />
            <section>
                <div>
                    <article>
                        <h2>Register as a new employer</h2>
                        Please fill out the following form and submit to request account access.
                        Once submitted, we will review your information and get your new account
                        verified. If you have questions, please{' '}
                        <Link href={'/contact'}>
                            <a>contact us</a>
                        </Link>
                        .
                    </article>
                </div>
            </section>
        </Layout>
    )
}

export default Register
