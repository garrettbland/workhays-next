import Layout from '../components/layout'
import Section from '../components/section'
import Link from 'next/link'

const Home = () => {
    return (
        <Layout>
            <Section>
                <h1 className="text-2xl md:text-3xl font-bold text-blueGray-800">
                    Current Job Openings
                </h1>
                <p className="text-base md:text-lg text-blueGray-700">
                    Browse current job openings in Hays, KS and surrounding communities.
                </p>
            </Section>
            <Section>
                <div>Latest jobs</div>
            </Section>
        </Layout>
    )
}

export default Home
