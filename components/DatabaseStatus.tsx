"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Database, CheckCircle } from "lucide-react"

interface DatabaseStatusProps {
  onStatusChange: (isReady: boolean) => void
}

export default function DatabaseStatus({ onStatusChange }: DatabaseStatusProps) {
  const [status, setStatus] = useState<"checking" | "ready" | "missing">("checking")

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Try to query the profiles table
        const { error } = await supabase.from("profiles").select("id").limit(1)

        if (error) {
          if (error.code === "42P01") {
            setStatus("missing")
            onStatusChange(false)
          } else {
            setStatus("ready")
            onStatusChange(true)
          }
        } else {
          setStatus("ready")
          onStatusChange(true)
        }
      } catch (err) {
        console.error("Database check error:", err)
        setStatus("missing")
        onStatusChange(false)
      }
    }

    checkDatabase()
  }, [onStatusChange])

  if (status === "checking") {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6 text-center">
          <Database className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
          <p className="text-gray-300">Checking database connection...</p>
        </CardContent>
      </Card>
    )
  }

  if (status === "missing") {
    return (
      <Card className="bg-gray-900 border-yellow-600">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Database Setup Required
          </CardTitle>
          <CardDescription className="text-gray-400">The database tables haven't been created yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-300">
            <p>To use MyMusicVault with full functionality, you need to:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                Create a Supabase project at{" "}
                <a href="https://supabase.com" className="text-blue-400 hover:underline">
                  supabase.com
                </a>
              </li>
              <li>Run the SQL scripts in your Supabase SQL Editor</li>
              <li>Set up your environment variables</li>
              <li>Create a storage bucket named "songs"</li>
            </ol>
            <p className="text-yellow-400 mt-4">
              For now, you can still use the app with local storage (songs won't persist between sessions).
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-green-600">
      <CardContent className="p-4 text-center">
        <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
        <p className="text-green-400 text-sm">Database connected successfully</p>
      </CardContent>
    </Card>
  )
}
