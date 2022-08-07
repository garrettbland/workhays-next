/**
 * Loader component that will 'pulse' children in it to give
 * loading feel. If no child is passed, a default spinner and text
 * will be shown.
 */

export const Loader = ({ children }: { children?: JSX.Element }) => {
    /**
     * Return child component that will 'pulse'
     */
    if (children) return <div className="animate-pulse">{children}</div>

    /**
     * Default Loading
     */
    return <div>Loading...</div>
}
