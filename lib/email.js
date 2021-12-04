/**
 * Validates email structure _@_@._
 * @param {string} email
 * @returns boolean
 */
export const is_email_valid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
