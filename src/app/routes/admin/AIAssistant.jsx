import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Send, ArrowRight, Bot, Trash2, Cpu, CheckCircle, Info, ExternalLink } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/Toast'
import aiService from '../../../services/ai'
import { cn } from '../../../utils/format'

const suggestedPrompts = [
  'Who hasn\'t paid their fees for this month?',
  'Show overdue students and total pending amounts.',
  'How much fee has been collected vs outstanding target?',
  'Give me a detailed academic performance summary.',
  'Which class has the lowest attendance rate?',
  'Draft an announcement notice for upcoming examinations.',
]

export default function AIAssistant() {
  const navigate = useNavigate()
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isGeminiActive, setIsGeminiActive] = useState(aiService.isConfigured())
  const scrollRef = useRef(null)

  useEffect(() => {
    setIsGeminiActive(aiService.isConfigured())
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const askQuestion = async (question) => {
    if (!question.trim() || loading) return
    const userMsg = { type: 'user', text: question, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const response = await aiService.askAssistant(question, messages)
      setMessages(prev => [...prev, {
        type: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...response,
      }])
    } catch {
      toast.error('Failed to get AI response')
    }
    setLoading(false)
  }

  const clearChat = () => {
    setMessages([])
    toast.success('Conversation history cleared')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="AI School Assistant"
        subtitle="Intelligent administrative and academic co-pilot powered by Gemini"
        actions={
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              isGeminiActive ? 'bg-success-light text-success border border-success/30' : 'bg-warning-light text-warning border border-warning/30'
            }`}>
              <Cpu className="w-3.5 h-3.5" />
              <span>{isGeminiActive ? 'Gemini 1.5 Flash Active' : 'Local AI Mode (Add Key in .env)'}</span>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <Trash2 className="w-4 h-4 text-danger" />
                Clear
              </Button>
            )}
          </div>
        }
      />

      <Card className="flex-1 flex flex-col overflow-hidden" padding={false}>
        {/* Messages Container */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-4 shadow-sm">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-1">Learnify AI Administrative Intelligence</h3>
              <p className="text-sm text-ink-secondary max-w-lg mb-6 leading-relaxed">
                Ask anything about fee collections, overdue students, curriculum progress, attendance records, exam schedules, or report generation.
              </p>

              {!isGeminiActive && (
                <div className="w-full max-w-lg p-3.5 mb-6 rounded-btn bg-surface-app border border-border text-left flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-ink-secondary">
                    <span className="font-semibold text-ink">Ready for your Gemini API Key:</span> Paste your Gemini Key into <code className="bg-white px-1.5 py-0.5 rounded border border-border font-mono text-ink">VITE_GEMINI_API_KEY</code> in your <code className="font-mono text-ink">.env</code> file for live conversational reasoning.
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full max-w-lg">
                <span className="text-xs font-semibold text-ink-muted text-left uppercase tracking-wider mb-1">Suggested Queries</span>
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => askQuestion(prompt)}
                    className="flex items-center justify-between p-3 rounded-btn border border-border bg-white hover:border-primary hover:bg-primary-50/40 transition-all text-left group shadow-xs"
                  >
                    <span className="text-sm font-medium text-ink group-hover:text-primary transition-colors">{prompt}</span>
                    <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-3', msg.type === 'user' && 'flex-row-reverse')}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs',
                msg.type === 'user' ? 'bg-ink text-white' : 'bg-primary-light text-primary'
              )}>
                {msg.type === 'user' ? <span className="text-xs font-bold">You</span> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn('max-w-[85%]', msg.type === 'user' && 'text-right')}>
                <div className={cn(
                  'inline-block px-4 py-3 rounded-card text-sm text-left shadow-xs',
                  msg.type === 'user' ? 'bg-primary text-white' : 'bg-surface-app text-ink border border-border'
                )}>
                  <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                </div>
                {msg.time && (
                  <span className="text-[11px] text-ink-muted block mt-1 px-1">{msg.time}</span>
                )}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.actions.map((action, j) => (
                      <button
                        key={j}
                        onClick={() => navigate(action.link)}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-btn bg-white border border-border font-medium text-primary hover:bg-primary-light transition-all shadow-xs"
                      >
                        <span>{action.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="inline-block px-4 py-3 rounded-card bg-surface-app border border-border">
                <div className="flex items-center gap-1.5 py-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-ink-muted ml-2">Analyzing school records...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-white">
          <form onSubmit={(e) => { e.preventDefault(); askQuestion(input) }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about fees, students, attendance, or academics..."
              className="input flex-1 focus:ring-2 focus:ring-primary/20"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
              <span>Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
