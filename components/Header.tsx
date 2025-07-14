"use client"

import { Button } from "@/components/ui/button"
import { LogOut, Music } from "lucide-react"

interface HeaderProps {
  user: { email: string; name: string }
  onLogout: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-white">MyMusicVault</h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-300 hidden sm:inline">Welcome, {user.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
