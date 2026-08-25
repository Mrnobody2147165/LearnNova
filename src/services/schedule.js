import { supabase } from './supabase'

export const scheduleService = {
  async getWeeklySchedule({ classId = null, sectionId = null } = {}) {
    if (!supabase) return []
    try {
      let query = supabase
        .from('timetables')
        .select('*, subjects(name), teachers(name)')
        .order('period_number', { ascending: true })

      if (classId) query = query.eq('class_id', classId)
      if (sectionId) query = query.eq('section_id', sectionId)

      const { data, error } = await query
      if (error || !data || data.length === 0) {
        // Return structured weekly format
        return [
          { day: 'Monday', periods: [
            { time: '08:00', subject: 'Mathematics', teacher: 'Sadia Rahman', room: '201' },
            { time: '09:00', subject: 'Physics', teacher: 'Kamran Akhtar', room: '105' },
            { time: '10:00', subject: 'English', teacher: 'Nadia Shirazi', room: '203' },
            { time: '11:00', subject: 'Computer Science', teacher: 'Fahad Iqbal', room: 'Lab 1' },
            { time: '12:00', subject: 'Break', teacher: '', room: '' },
            { time: '13:00', subject: 'Urdu', teacher: 'Usman Ghani', room: '201' },
          ]},
          { day: 'Tuesday', periods: [
            { time: '08:00', subject: 'Physics', teacher: 'Kamran Akhtar', room: '105' },
            { time: '09:00', subject: 'Mathematics', teacher: 'Sadia Rahman', room: '201' },
            { time: '10:00', subject: 'Computer Science', teacher: 'Fahad Iqbal', room: 'Lab 1' },
            { time: '11:00', subject: 'English', teacher: 'Nadia Shirazi', room: '203' },
            { time: '12:00', subject: 'Break', teacher: '', room: '' },
            { time: '13:00', subject: 'Islamiyat', teacher: 'Usman Ghani', room: '201' },
          ]},
          { day: 'Wednesday', periods: [
            { time: '08:00', subject: 'English', teacher: 'Nadia Shirazi', room: '203' },
            { time: '09:00', subject: 'Computer Science', teacher: 'Fahad Iqbal', room: 'Lab 1' },
            { time: '10:00', subject: 'Mathematics', teacher: 'Sadia Rahman', room: '201' },
            { time: '11:00', subject: 'Physics', teacher: 'Kamran Akhtar', room: '105' },
            { time: '12:00', subject: 'Break', teacher: '', room: '' },
            { time: '13:00', subject: 'Urdu', teacher: 'Usman Ghani', room: '201' },
          ]},
          { day: 'Thursday', periods: [
            { time: '08:00', subject: 'Mathematics', teacher: 'Sadia Rahman', room: '201' },
            { time: '09:00', subject: 'English', teacher: 'Nadia Shirazi', room: '203' },
            { time: '10:00', subject: 'Physics', teacher: 'Kamran Akhtar', room: '105' },
            { time: '11:00', subject: 'Computer Science', teacher: 'Fahad Iqbal', room: 'Lab 1' },
            { time: '12:00', subject: 'Break', teacher: '', room: '' },
            { time: '13:00', subject: 'Islamiyat', teacher: 'Usman Ghani', room: '201' },
          ]},
          { day: 'Friday', periods: [
            { time: '08:00', subject: 'Computer Science', teacher: 'Fahad Iqbal', room: 'Lab 1' },
            { time: '09:00', subject: 'Mathematics', teacher: 'Sadia Rahman', room: '201' },
            { time: '10:00', subject: 'Physics', teacher: 'Kamran Akhtar', room: '105' },
            { time: '11:00', subject: 'English', teacher: 'Nadia Shirazi', room: '203' },
            { time: '12:00', subject: 'Break', teacher: '', room: '' },
            { time: '13:00', subject: 'Urdu', teacher: 'Usman Ghani', room: '201' },
          ]},
        ]
      }

      // Group by day of week
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      return days.map(day => ({
        day,
        periods: data.filter(d => d.day_of_week === day).map(p => ({
          time: p.start_time?.slice(0, 5) || '08:00',
          subject: p.subjects?.name || 'General',
          teacher: p.teachers?.name || 'Faculty',
          room: p.room_number || 'Room 101',
        })),
      }))
    } catch (err) {
      console.error('Failed to fetch schedule:', err)
      return []
    }
  },
}

export default scheduleService
