const PageTitle = ({ title, description }) => {
    return (
        <section className="mb-6">
            <h1 className="text-3xl font-bold text-indigo-600 mb-3">{title}</h1>
            <p className="prose prose-lg prose-blue">{description}</p>
        </section>
    )
}

export default PageTitle
