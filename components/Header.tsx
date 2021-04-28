import usePageOffset from '../utils/usePageOffset'

interface PropTypes {
    title: string
    background_image?: string
    description?: string
}

const Header = ({ title, description }: PropTypes) => {
    const offset = usePageOffset()
    const speed = 3

    return (
        <div className="relative -mt-20 overflow-hidden">
            <div
                className="absolute top-0 left-0 bg-cover bg-center w-full h-full z-10"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1619441174172-26e021833857?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=668&q=80')`,
                    transform: `translate(0px, ${offset / speed}px)`,
                }}
            />
            <div className="absolute top-0 left-0 z-20 w-full h-full bg-gradient-to-r from-purple-900" />
            <div className="relative z-30 max-w-4xl mx-auto px-4 pt-32 pb-36 text-white">
                <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
                <p className="text-base md:text-lg">{description}</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full z-40">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className="transform rotate-180 h-16 w-full"
                >
                    <path
                        d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                        opacity=".25"
                        fill="#ffffff"
                    ></path>
                    <path
                        d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
                        opacity=".5"
                        fill="#ffffff"
                    ></path>
                    <path
                        d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
                        fill="#ffffff"
                    ></path>
                </svg>
            </div>
        </div>
    )
}

export default Header
