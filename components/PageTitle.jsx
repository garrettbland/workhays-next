const PageTitle = ({ title, description }) => {
	return (
		<section>
			<h1 className="text-3xl font-bold text-indigo-600 mb-3">{title}</h1>
			<p className="prose prose-lg">{description}</p>
		</section>
	)
}

export default PageTitle
