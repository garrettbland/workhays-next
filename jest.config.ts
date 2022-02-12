import type { Config } from '@jest/types'
// Sync object
const config: Config.InitialOptions = {
    verbose: true,
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
}
export default config

// module.exports = {
//     transform: {
//         '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
//     },
//     collectCoverageFrom: [
//         'siteconfig.js',
//         'actions/**/*.{js,jsx,ts,tsx}',
//         'libs/**/*.{js,jsx,ts,tsx}',
//         '!src/**/*.d.ts',
//     ],
//     moduleNameMapper: {
//         '^@config': '<rootDir>/config.js',
//         '^@/actions/(.*)$': '<rootDir>/src/actions/$1',
//         '^@/components/(.*)$': '<rootDir>/components/$1',
//         '^@/reducers/(.*)$': '<rootDir>/src/reducers/$1',
//         '^@/utils/(.*)$': '<rootDir>/utils/$1',
//     },
// }
