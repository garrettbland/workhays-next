/**
 * Validates email structure _@_@._
 */
export const is_email_valid = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
