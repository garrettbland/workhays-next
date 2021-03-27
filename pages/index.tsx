import Layout from '../components/layout'
import Section from '../components/section'
import PageHeader from '../components/pageHeader'
import Link from 'next/link'
import { testJobs } from '../utils/test.data'

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
                <div className="flex flex-col-reverse md:grid md:grid-cols-3 gap-4">
                    <div className="col-span-2 pt-4 md:pt-0">
                        <h2 className="text-xl font-semibold my-4 md:mb-4 md:my-0 text-blueGray-800">
                            Latest Job Openings
                        </h2>
                        <div className="border border-gray-200 rounded divide-y divide-gray-200">
                            {testJobs.map((job, index) => (
                                <div className="p-2 flex justiy-between items-center">
                                    <div className="w-2/3">
                                        <div className="text-lg font-semibold">{job.title}</div>
                                        <div className="text-sm leading-tight">
                                            {job.employer_title}
                                        </div>
                                    </div>
                                    <div className="flex flex-1 justify-end">View Job</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-1 grid grid-flow-row gap-4">
                        <div className="border border-gray-200 rounded">
                            <h3 className="text-base font-semibold border-b p-2">
                                Are you an employer?
                            </h3>
                            <p className="text-base antialiased p-2">
                                <Link href="/register">Click here</Link> to register today & post
                                your openings for free.
                            </p>
                        </div>
                        <div className="border border-gray-200 rounded">
                            <h3 className="text-base font-semibold border-b p-2">Get Notified</h3>
                            <p className="text-base antialiased p-2">
                                Sign up below for weekly email notifications of new job postings.
                            </p>
                            <div className="p-2 space-y-2">
                                <input
                                    className="border border-gray-200 rounded w-full p-2 hover:border-gray-400 focus:outline-none focus:border-blue-500"
                                    placeholder="Email Address"
                                />
                                <button className="rounded bg-blue-500 text-blue-50 p-2 w-full hover:bg-blue-600">
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>
        </Layout>
    )
}

export default Home
