import fs from 'fs'
import { get_markdown_content } from '../../libs/article'

// Example markdown file contents
const example_md_file = '---\ntitle: Front Matter\n---\nThis is content.'

// Mock Node fs library
jest.mock('fs')

// Mock the retuned value of 'readFileSync' to our raw test string
;(fs.readFileSync as jest.MockedFunction<any>).mockReturnValue(example_md_file)

describe('Article Lib', () => {
    it('Should render HTML from Markdown', () => {
        /**
         * Execute with dummy inputs, since we mock the
         * return value of readFileSync
         */
        const result = get_markdown_content('test', 'test')

        // Expect the title and body to be what we expect
        expect(result.title).toBe('Front Matter')
        expect(result.body).toBe('This is content.')

        /**
         * TO DO:
         * Add some more tests to test missing front matter
         * items or malformed markdown files
         */
    })
})
