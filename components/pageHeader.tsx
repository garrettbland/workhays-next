type PropTypes = {
    title: string
    description?: string
}

const PageHeader = ({ title, description }: PropTypes) => (
    <>
        <h1 className="text-2xl md:text-3xl font-bold text-blueGray-800">{title}</h1>
        {description && (
            <p className="text-base md:text-lg text-blueGray-700">
                Browse current job openings in Hays, KS and surrounding communities.
            </p>
        )}
    </>
)

export default PageHeader
