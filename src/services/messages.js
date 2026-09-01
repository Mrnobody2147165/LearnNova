/**
 * Messages Service
 * Manages communication between admin and students.
 * Uses localStorage as the data store (learnify_messages key).
 * Replace with Supabase/REST API calls later without changing the interface.
 */

const STORAGE_KEY = 'learnify_messages'
const READ_KEY = 'learnify_messages_read'

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

const getMessages = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveMessages = (messages) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
}

const getReadIds = () => {
  try {
    const stored = localStorage.getItem(READ_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveReadIds = (ids) => {
  localStorage.setItem(READ_KEY, JSON.stringify(ids))
}

export const messageService = {
  /**
   * Get all messages (admin view — all messages).
   */
  async getAll() {
    await delay()
    return getMessages().sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
  },

  /**
   * Get messages visible to a specific student.
   * Includes: messages to "All Students", messages to student's class,
   * and messages addressed to the student individually.
   */
  async getForStudent(student) {
    await delay()
    const messages = getMessages()
    const studentClass = `${student.class || ''}-${student.section || ''}`

    return messages
      .filter(msg => {
        if (msg.recipientType === 'all') return true
        if (msg.recipientType === 'class' && msg.recipientId === studentClass) return true
        if (msg.recipientType === 'student' && msg.recipientId === student.studentId) return true
        return false
      })
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
  },

  /**
   * Get a single message by ID.
   */
  async getById(id) {
    await delay()
    const messages = getMessages()
    return messages.find(m => m.id === id) || null
  },

  /**
   * Create and send a new message.
   * @param {Object} data - { subject, body, recipientType, recipientId, recipientName }
   */
  async send(data) {
    await delay(400)

    if (!data.subject || !data.body) {
      throw new Error('Subject and message body are required')
    }
    if (!data.recipientType) {
      throw new Error('Recipient type is required')
    }

    const messages = getMessages()
    const newMessage = {
      id: 'MSG-' + Date.now(),
      subject: data.subject,
      body: data.body,
      recipientType: data.recipientType, // 'all', 'class', 'student'
      recipientId: data.recipientId || '',
      recipientName: data.recipientName || '',
      sentAt: new Date().toISOString(),
      status: 'Sent',
      senderId: 'admin',
    }

    messages.push(newMessage)
    saveMessages(messages)
    return newMessage
  },

  /**
   * Mark a message as read for a specific student.
   */
  async markAsRead(messageId, studentId) {
    const readIds = getReadIds()
    const key = `${messageId}_${studentId}`
    if (!readIds.includes(key)) {
      readIds.push(key)
      saveReadIds(readIds)
    }
  },

  /**
   * Mark all messages as read for a specific student.
   */
  async markAllAsRead(studentId) {
    const messages = getMessages()
    const readIds = getReadIds()
    messages.forEach(msg => {
      const key = `${msg.id}_${studentId}`
      if (!readIds.includes(key)) {
        readIds.push(key)
      }
    })
    saveReadIds(readIds)
  },

  /**
   * Check if a message is read for a specific student.
   */
  isRead(messageId, studentId) {
    const readIds = getReadIds()
    return readIds.includes(`${messageId}_${studentId}`)
  },

  /**
   * Get unread count for a specific student.
   */
  async getUnreadCount(student) {
    const messages = await this.getForStudent(student)
    const readIds = getReadIds()
    return messages.filter(msg => !readIds.includes(`${msg.id}_${student.studentId}`)).length
  },

  /**
   * Delete a message (admin only).
   */
  async delete(id) {
    await delay()
    const messages = getMessages().filter(m => m.id !== id)
    saveMessages(messages)
    return { success: true }
  },
}

export default messageService
