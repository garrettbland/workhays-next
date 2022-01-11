import type { NextApiRequest, NextApiResponse } from 'next'

const hello = (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({ name: 'Work Hays API' })
}

export default hello
