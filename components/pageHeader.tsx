interface PropTypes {
    title: string
    description?: string
}

const PageHeader = ({ title, description }: PropTypes) => (
    <>
        <h1 className="text-2xl md:text-3xl font-bold text-blueGray-800">{title}</h1>
        <p className="text-base md:text-lg text-blueGray-700">{description}</p>
    </>
)

export default PageHeader
