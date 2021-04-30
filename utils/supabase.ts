import { createClient } from '@supabase/supabase-js'

// supabase URL
const URL = 'https://hsiujimtslvazsutyygg.supabase.co'

// supabase Key
const KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxOTU4MDI5MSwiZXhwIjoxOTM1MTU2MjkxfQ.R-oPAH0TyoE8fL6YlvGJTUvoNa4I3x2lNpXcQ3RSFA4'

// Create a single supabase client for interacting with your database
export const supabase = createClient(URL, KEY)
