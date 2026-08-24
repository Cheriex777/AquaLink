import { useState } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'

interface Scheme {
  scheme_id?: string
  scheme_name?: string
  government_level?: string
  state?: string
  beneficiary_type?: string
  category?: string
  relevance?: string
  benefits?: string
  eligibility?: string
  official_source?: string
}

interface ChatResponse {
  detected_information: {
    state: string
    user_type: string
    category: string
  }
  total_matches: number
  schemes: Scheme[]
}

export default function SchemeChatbotPage() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ChatResponse | null>(null)
  const [error, setError] = useState('')

  async function sendMessage() {
    if (!question.trim()) return

    setLoading(true)
    setError('')
    setResponse(null)

    try {
      const result = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
        }),
      })

      if (!result.ok) {
        throw new Error('Failed to get scheme recommendations')
      }

      const data = await result.json()
      setResponse(data)
    } catch (err) {
      setError(
        'Could not connect to the chatbot. Make sure the FastAPI server is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-100 p-3">
            <Bot className="size-7 text-primary-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Government Scheme Assistant
            </h1>

            <p className="mt-1 text-gray-500">
              Ask about government schemes for rainwater harvesting,
              groundwater recharge, watershed development and water conservation.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex gap-3">
          <div className="rounded-full bg-primary-100 p-2">
            <User className="size-5 text-primary-600" />
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Example: I am a farmer in Maharashtra. Which government schemes can help me with groundwater recharge?"
            className="min-h-28 flex-1 rounded-xl border p-4 outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          onClick={sendMessage}
          disabled={loading || !question.trim()}
          className="mt-4 flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Send className="size-5" />
              Ask Assistant
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {response && (
        <div className="space-y-5">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Bot className="size-6 text-primary-600" />
              AI Analysis
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">State</p>
                <p className="mt-1 font-semibold">
                  {response.detected_information.state}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Beneficiary</p>
                <p className="mt-1 font-semibold">
                  {response.detected_information.user_type}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Requirement</p>
                <p className="mt-1 font-semibold">
                  {response.detected_information.category}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold">
              Recommended Government Schemes
              <span className="ml-2 text-base font-normal text-gray-500">
                ({response.total_matches} found)
              </span>
            </h2>

            {response.schemes.length === 0 ? (
              <div className="rounded-xl border bg-white p-6 text-gray-500">
                No matching schemes found for this query.
              </div>
            ) : (
              <div className="space-y-4">
                {response.schemes.map((scheme, index) => (
                  <div
                    key={scheme.scheme_id || index}
                    className="rounded-2xl border bg-white p-6 shadow-sm"
                  >
                    <h3 className="text-xl font-bold">
                      {scheme.scheme_name}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {scheme.government_level && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm">
                          {scheme.government_level}
                        </span>
                      )}

                      {scheme.category && (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-sm">
                          {scheme.category}
                        </span>
                      )}
                    </div>

                    {scheme.benefits && (
                      <div className="mt-4">
                        <p className="font-semibold">Benefits</p>
                        <p className="mt-1 text-gray-600">
                          {scheme.benefits}
                        </p>
                      </div>
                    )}

                    {scheme.eligibility && (
                      <div className="mt-4">
                        <p className="font-semibold">Eligibility</p>
                        <p className="mt-1 text-gray-600">
                          {scheme.eligibility}
                        </p>
                      </div>
                    )}

                    {scheme.official_source && (
                      <a
                        href={scheme.official_source}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-block font-medium text-primary-600 hover:underline"
                      >
                        View Official Source →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}