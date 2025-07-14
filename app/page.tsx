"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import AuthForm from "@/components/AuthForm"

export default function LoginPage() {
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

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login error:", error)
        if (error.message.includes("Email not confirmed")) {
          setMessage("Please check your email and confirm your account before signing in.")
        } else if (error.message.includes("Invalid login credentials")) {
          setMessage("Invalid email or password. Please try again.")
        } else {
          setMessage(error.message)
        }
      } else if (data.user) {
        console.log("Login successful, redirecting to dashboard")
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Unexpected login error:", err)
      setMessage("An unexpected error occurred. Please try again.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">MyMusicVault</h1>
          <p className="text-gray-400">Sign in to your music collection</p>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-md text-sm bg-red-900 text-red-300 border border-red-700">{message}</div>
        )}

        <AuthForm mode="login" onSubmit={handleLogin} isLoading={isLoading} />
      </div>
    </div>
  )
}
