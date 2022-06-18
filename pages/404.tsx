import Link from 'next/link'
import PageTitle from '@/components/PageTitle'

const NotFound = () => (
    <>
        <PageTitle
            title="Page Not Found"
            description={
                <>
                    Uh Oh. Looks like this page cannot be found. If you are needing assistance,
                    please{' '}
                    <Link href="/contact">
                        <a>contact us</a>
                    </Link>{' '}
                    and let us know.
                </>
            }
        />
    </>
)

export default NotFound
