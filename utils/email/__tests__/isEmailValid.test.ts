import { isEmailValid } from '../isEmailValid'

describe('Is Email Valid', () => {
    it('Should return true if email format valid', () => {
        const testEmail = 'gmorganbland@gmail.com'
        const isValid = isEmailValid(testEmail)
        expect(isValid).toBe(true)
    })
    it('Should return false for invalid email patterns', () => {
        const testEmails = [
            'incorrect@',
            'wrongemail@@',
            'test@wrong@email.com',
            '@example.com',
            'hotdog@burger',
        ]
        const areEmailsValid = testEmails.map((email) => isEmailValid(email))
        console.log(areEmailsValid)
        expect(areEmailsValid.every((email) => !email)).toBe(true)
    })
})
