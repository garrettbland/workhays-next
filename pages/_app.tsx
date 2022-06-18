import type { AppProps } from 'next/app'
import '../styles/tailwind.css'
import { Layout } from '@/components/Layout'

const WorkHaysApp = ({ Component, pageProps }: AppProps) => (
    <Layout>
        <Component {...pageProps} />
    </Layout>
)

export default WorkHaysApp
