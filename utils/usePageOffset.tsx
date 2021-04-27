import { useState, useEffect } from 'react'

/**
 * Custom hook to track windows Y offset
 *
 * const offset = usePageOffset()
 * @returns number
 */
const usePageOffset = (): number => {
    /**
     * Define local state
     */
    const [offset, setOffset] = useState<number>(0)

    /**
     * Sets pageYOffset in state
     * @param pageYOffset number
     */
    const handleScroll = (pageYOffset: number): void => {
        setOffset(pageYOffset)
    }

    /**
     * Adds event listener for scroll and removes on unmount
     */
    useEffect(() => {
        document.addEventListener('scroll', () => {
            handleScroll(window.pageYOffset)
        })
        return () => {
            document.removeEventListener('scroll', () => {
                handleScroll(window.pageYOffset)
            })
        }
    }, [])

    /**
     * Returns pageYoffset
     */
    return offset
}

export default usePageOffset
