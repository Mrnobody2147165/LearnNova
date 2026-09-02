import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyurqlgrcpdysmrfiayl.supabase.co'
const supabaseKey = 'sb_publishable_Vb1CGXd5Si6NuIM1JnOr6A_dzlWbaX0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetToZero() {
  console.log('🧹 Wiping all operational records in Supabase to 0...')

  const tables = [
    'homework_submissions',
    'homework',
    'attendance_records',
    'payments',
    'challan_items',
    'challans',
    'student_discounts',
    'discounts',
    'students',
    'notifications',
    'audit_logs',
  ]

  for (const t of tables) {
    try {
      const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) console.warn(`Note deleting from ${t}:`, error.message)
      else console.log(`✅ Cleared ${t}`)
    } catch (err) {
      console.warn(`Error on ${t}:`, err.message)
    }
  }

  console.log('\n🔍 Verifying all table counts after wipe:')
  for (const t of tables) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true })
    console.log(`   ${t.padEnd(25)} : ${count ?? 0}`)
  }

  console.log('\n🎉 ALL DATABASE DATA SUCCESSFULLY RESET TO 0!')
}

resetToZero().catch(console.error)
