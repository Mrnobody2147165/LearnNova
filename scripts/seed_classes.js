/**
 * Seed Classes into Supabase
 * Run once: node scripts/seed_classes.js
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyurqlgrcpdysmrfiayl.supabase.co'
const supabaseKey = 'sb_publishable_Vb1CGXd5Si6NuIM1JnOr6A_dzlWbaX0'
const schoolId = 'abc88e49-fa7c-4987-b877-09b05b61d6a6'

const supabase = createClient(supabaseUrl, supabaseKey)

const classes = [
  { name: 'Class 1',  numeric_order: 1 },
  { name: 'Class 2',  numeric_order: 2 },
  { name: 'Class 3',  numeric_order: 3 },
  { name: 'Class 4',  numeric_order: 4 },
  { name: 'Class 5',  numeric_order: 5 },
  { name: 'Class 6',  numeric_order: 6 },
  { name: 'Class 7',  numeric_order: 7 },
  { name: 'Class 8',  numeric_order: 8 },
  { name: 'Class 9',  numeric_order: 9 },
  { name: 'Class 10', numeric_order: 10 },
]

async function seedClasses() {
  console.log('🚀 Seeding classes into Supabase...')

  // Check existing classes
  const { data: existing } = await supabase
    .from('classes')
    .select('name')
    .eq('school_id', schoolId)

  const existingNames = new Set((existing || []).map(c => c.name))
  console.log(`Found ${existingNames.size} existing classes`)

  let inserted = 0
  let skipped = 0

  for (const cls of classes) {
    if (existingNames.has(cls.name)) {
      console.log(`  ⏭ Skipped (exists): ${cls.name}`)
      skipped++
      continue
    }

    const { error } = await supabase.from('classes').insert([{
      school_id: schoolId,
      name: cls.name,
      numeric_order: cls.numeric_order,
    }])

    if (error) {
      console.error(`  ✗ Failed to insert ${cls.name}:`, error.message)
    } else {
      console.log(`  ✓ Inserted: ${cls.name}`)
      inserted++
    }
  }

  console.log(`\n✅ Done! Inserted: ${inserted}, Skipped: ${skipped}`)
  console.log('Now re-import your students and they will be assigned to the correct class.')
}

seedClasses().catch(console.error)
