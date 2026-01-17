import { useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { FiMessageSquare, FiSend, FiCpu, FiLoader } from 'react-icons/fi'

const AIAssistant = () => {
    const [prompt, setPrompt] = useState('')
    const [response, setResponse] = useState('')
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const handleAnalyze = async (e) => {
        e.preventDefault()
        if (!prompt.trim()) return

        setLoading(true)
        setResponse('')

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY

            if (!apiKey) {
                throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.')
            }

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

            // Add context about the app
            const systemContext = "You are a helpful assistant for BloodConnect, a blood donation platform. You help match donors with patients and provide health advice related to blood donation. Keep answers concise."
            const fullPrompt = `${systemContext}\n\nUser: ${prompt}`

            const result = await model.generateContent(fullPrompt)
            const text = result.response.text()
            setResponse(text)
        } catch (error) {
            console.error("Gemini Error:", error)

            let errorMessage = "Sorry, I encountered an error. "

            if (error.message?.includes('API key')) {
                errorMessage += "Please check your API key configuration."
            } else if (error.message?.includes('404')) {
                errorMessage += "The AI model is not available. Please contact support."
            } else if (error.message?.includes('quota')) {
                errorMessage += "API quota exceeded. Please try again later."
            } else if (error.message?.includes('SAFETY')) {
                errorMessage += "Your question was blocked by safety filters. Please rephrase."
            } else {
                errorMessage += `Error: ${error.message || 'Unknown error occurred'}`
            }

            setResponse(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 flex items-center gap-2"
            >
                <FiCpu className="text-xl" />
                <span className="font-bold">AI Help</span>
            </button>
        )
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col animate-fade-in-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <FiCpu />
                    <h3 className="font-bold">Smart Assistant</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white"
                >
                    &times;
                </button>
            </div>

            {/* Content */}
            <div className="p-4 h-80 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                {response ? (
                    <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed">
                        {response}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        <FiMessageSquare className="mx-auto text-2xl mb-2 opacity-50" />
                        <p>Ask me about donation eligibility, <br />finding donors, or health tips.</p>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-4">
                        <FiLoader className="animate-spin text-indigo-600" />
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleAnalyze} className="p-3 bg-white border-t border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ask AI..."
                        className="w-full pl-4 pr-12 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                    <button
                        type="submit"
                        disabled={loading || !prompt.trim()}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        <FiSend className="text-xs" />
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AIAssistant
