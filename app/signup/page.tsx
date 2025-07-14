"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import AuthForm from "@/components/AuthForm"

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.push("/dashboard")
      }
    }
    checkUser()
  }, [router])

  const handleSignup = async (email: string, password: string) => {
    setIsLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split("@")[0],
          },
        },
      })

      if (error) {
        console.error("Signup error:", error)
        setMessage(error.message)
      } else if (data.user) {
        if (data.user.email_confirmed_at) {
          // User is immediately confirmed (email confirmation disabled)
          setMessage("Account created successfully! Redirecting...")
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        } else {
          // Email confirmation required
          setMessage("Please check your email to confirm your account, then try signing in!")
          setTimeout(() => {
            router.push("/")
          }, 3000)
        }
      }
    } catch (err) {
      console.error("Unexpected signup error:", err)
      setMessage("An unexpected error occurred. Please try again.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">MyMusicVault</h1>
          <p className="text-gray-400">Create your music collection</p>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              message.includes("successfully") || message.includes("check your email")
                ? "bg-green-900 text-green-300 border border-green-700"
                : "bg-red-900 text-red-300 border border-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <AuthForm mode="signup" onSubmit={handleSignup} isLoading={isLoading} />
      </div>
    </div>
  )
}
