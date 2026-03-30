'use client'

import { QuizForm } from '@/components/QuizForm'

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Your Exposure Assessment</h1>
          <p className="text-gray-400">
            Understand how exposed your job and skills are to AI displacement
          </p>
        </div>
        <QuizForm />
      </div>
    </div>
  )
}
