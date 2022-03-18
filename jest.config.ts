import type { Config } from '@jest/types'
// Sync object
const config: Config.InitialOptions = {
    verbose: true,
    setupFilesAfterEnv: ['./jest.setup.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
}

export default config
