import Layout from '../components/layout'
import Section from '../components/section'
import PageHeader from '../components/pageHeader'
import Link from 'next/link'

const Home = () => {
    return (
        <Layout>
            <Section>
                <PageHeader
                    title="Current Job Openings"
                    description="Browse current job openings in Hays, KS and surrounding communities."
                />
            </Section>
            <Section>
                <div className="flex flex-col-reverse md:grid md:grid-cols-8 gap-4">
                    <div className="col-span-5 pt-4 md:pt-0">
                        <h2 className="text-xl font-semibold mb-4 text-blueGray-800">
                            Latest Job Openings
                        </h2>
                        <div className="border border-gray-200 rounded divide-y divide-gray-200">
                            <div className="px-4 py-3">
                                <div className="text-sm leading-tight">
                                    Heartland Building Center
                                </div>
                                <div className="text-lg font-semibold">Retail Sales Associate</div>
                            </div>
                            <div className="px-4 py-3">
                                <div className="text-sm leading-tight">
                                    Heartland Building Center
                                </div>
                                <div className="text-lg font-semibold">Retail Sales Associate</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-3">
                        <div className="bg-gray-200 rounded px-2 py-1 md:p-4">
                            <h3 className="text-base font-semibold">Are you an employer?</h3>
                            <p className="text-base antialiased">
                                <Link href="/register">
                                    <a className="text-gray-600 hover:text-gray-900 hover:underline">
                                        Click here
                                    </a>
                                </Link>{' '}
                                to register today & post your openings for free.
                            </p>
                        </div>
                    </div>
                </div>
            </Section>
        </Layout>
    )
}

export default Home
