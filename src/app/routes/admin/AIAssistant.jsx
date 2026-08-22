import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Send, ArrowRight } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import { useToast } from '../../../components/ui/Toast'
import aiService from '../../../services/ai'
import { cn } from '../../../utils/format'

const suggestedPrompts = [
  'Who hasn\'t paid this month?',
  'Show overdue students.',
  'How much fee is outstanding?',
  'Generate a fee collection report.',
  'Which class has the highest outstanding fees?',
]

export default function AIAssistant() {
  const navigate = useNavigate()
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const askQuestion = async (question) => {
    if (!question.trim() || loading) return
    const userMsg = { type: 'user', text: question }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const response = await aiService.askAssistant(question)
      setMessages(prev => [...prev, { type: 'assistant', ...response }])
    } catch {
      toast.error('Failed to get AI response')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="AI School Assistant" subtitle="Your intelligent administrative assistant" />

      <Card className="flex-1 flex flex-col overflow-hidden" padding={false}>
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-14 h-14 rounded-card bg-primary-light flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-2">Ask me anything about your school</h3>
              <p className="text-sm text-ink-secondary max-w-md mb-6">I can help you analyze fee collection, student data, attendance, and more.</p>
              <div className="flex flex-col gap-2 w-full max-w-md">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => askQuestion(prompt)}
                    className="flex items-center justify-between p-3 rounded-btn border border-border hover:border-primary hover:bg-primary-50/30 transition-colors text-left group"
                  >
                    <span className="text-sm text-ink">{prompt}</span>
                    <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-3', msg.type === 'user' && 'flex-row-reverse')}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                msg.type === 'user' ? 'bg-ink text-white' : 'bg-primary-light text-primary'
              )}>
                {msg.type === 'user' ? <span className="text-xs font-semibold">U</span> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className={cn('max-w-[80%]', msg.type === 'user' && 'text-right')}>
                <div className={cn(
                  'inline-block px-4 py-3 rounded-card text-sm',
                  msg.type === 'user' ? 'bg-ink text-white' : 'bg-surface-app text-ink border border-border'
                )}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.actions.map((action, j) => (
                      <button
                        key={j}
                        onClick={() => navigate(action.link)}
                        className="text-xs px-3 py-1.5 rounded-btn bg-white border border-border text-primary hover:bg-primary-light transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="inline-block px-4 py-3 rounded-card bg-surface-app border border-border">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form onSubmit={(e) => { e.preventDefault(); askQuestion(input) }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your school..."
              className="input flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
