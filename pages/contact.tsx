import Layout from '../components/layout'
import PageHeader from '../components/pageHeader'

const Contact = () => {
    return (
        <Layout>
            <PageHeader
                title="Contact Us"
                description="Please fill out the following form to contact us. We will try to respond as soon as we can."
            />
            <section>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1 md:col-span-2 prose prose-md">
                        <div className="col-span-2 md:col-span-1">
                            <input
                                className="border border-gray-200 rounded w-full p-2 hover:border-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder="First Name"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <input
                                className="border border-gray-200 rounded w-full p-2 hover:border-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder="Last Name"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <input
                                className="border border-gray-200 rounded w-full p-2 hover:border-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder="Email"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <input
                                className="border border-gray-200 rounded w-full p-2 hover:border-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder="Business Name"
                            />
                        </div>
                        <div className="col-span-2">
                            <textarea
                                className="border border-gray-200 rounded w-full p-2 hover:border-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder="Last Name"
                                rows={5}
                            />
                        </div>
                        <div>
                            <button className="rounded bg-blue-500 text-white py-2 px-8 hover:bg-blue-600">
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    )
}

export default Contact
