"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  getSongs,
  addSong,
  deleteSong,
  updateSongPositions,
  uploadSongFile,
  deleteSongFile,
  getSongUrl,
  getProfile,
} from "@/lib/database"
import Header from "@/components/Header"
import UploadArea from "@/components/UploadArea"
import PlaylistView from "@/components/PlaylistView"
import type { Song } from "@/lib/database"
import DatabaseStatus from "@/components/DatabaseStatus"

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDatabaseReady, setIsDatabaseReady] = useState(false)
  const [useLocalStorage, setUseLocalStorage] = useState(false)

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // First check if we have a session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          router.push("/")
          return
        }

        if (!session?.user) {
          console.log("No session found, redirecting to login")
          router.push("/")
          return
        }

        console.log("User session found:", session.user.id)

        // Get user profile with retry logic
        let profile = await getProfile(session.user.id)

        // If profile doesn't exist, create it
        if (!profile) {
          console.log("Profile not found, creating new profile")
          const newProfile = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
          }

          // Try to insert the profile directly
          const { data: createdProfile, error: createError } = await supabase
            .from("profiles")
            .insert([newProfile])
            .select()
            .single()

          if (createError) {
            console.error("Error creating profile:", createError)
            // Still try to continue with session data
            profile = {
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          } else {
            profile = createdProfile
          }
        }

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name || profile.email.split("@")[0],
          })

          console.log("Loading songs for user:", profile.id)

          // Load user's songs with error handling
          try {
            const userSongs = await getSongs(profile.id)
            console.log("Loaded songs:", userSongs.length)
            setSongs(userSongs)
          } catch (songsError) {
            console.error("Error loading songs:", songsError)
            // Continue without songs rather than failing completely
            setSongs([])
          }
        }
      } catch (error) {
        console.error("Error in initializeUser:", error)
        // Don't redirect on error, just show the error state
      } finally {
        setIsLoading(false)
      }
    }

    initializeUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      if (event === "SIGNED_OUT" || !session) {
        setUser(null)
        setSongs([])
        router.push("/")
      } else if (event === "SIGNED_IN" && session) {
        // Reinitialize when user signs in
        window.location.reload()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // Add this useEffect after the existing auth useEffect
  useEffect(() => {
    // Load from localStorage if database is not ready
    if (!isDatabaseReady && useLocalStorage) {
      const savedSongs = localStorage.getItem("myMusicVault_songs")
      if (savedSongs) {
        try {
          const parsedSongs = JSON.parse(savedSongs)
          setSongs(parsedSongs)
        } catch (error) {
          console.error("Error parsing saved songs:", error)
        }
      }
    }
  }, [isDatabaseReady, useLocalStorage])

  // Add this useEffect after the existing useEffect
  useEffect(() => {
    // Auto-save playlist order when songs change (but not on initial load)
    if (songs.length > 0 && user) {
      const timeoutId = setTimeout(async () => {
        const updates = songs.map((song, index) => ({
          id: song.id,
          position: index,
        }))
        await updateSongPositions(updates)
      }, 1000) // Debounce for 1 second

      return () => clearTimeout(timeoutId)
    }
  }, [songs, user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleFileUpload = async (files: File[]) => {
    if (!user) return

    setIsLoading(true)

    for (const file of files) {
      try {
        if (isDatabaseReady) {
          // Database mode
          const filePath = await uploadSongFile(file, user.id)
          if (!filePath) continue

          const newSong = await addSong({
            user_id: user.id,
            title: file.name.replace(".mp3", ""),
            file_name: file.name,
            file_path: filePath,
            duration: 0,
            file_size: file.size,
            mime_type: file.type || "audio/mpeg",
            position: songs.length,
          })

          if (newSong) {
            setSongs((prev) => [...prev, newSong])
          }
        } else {
          // Local storage fallback mode
          const newSong = {
            id: Math.random().toString(36).substr(2, 9),
            user_id: user.id,
            title: file.name.replace(".mp3", ""),
            file_name: file.name,
            file_path: URL.createObjectURL(file),
            duration: 0,
            file_size: file.size,
            mime_type: file.type || "audio/mpeg",
            position: songs.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          setSongs((prev) => {
            const updated = [...prev, newSong]
            localStorage.setItem("myMusicVault_songs", JSON.stringify(updated))
            return updated
          })
        }
      } catch (error) {
        console.error("Error uploading file:", error)
        alert(`Failed to upload ${file.name}`)
      }
    }

    setIsLoading(false)
  }

  const handleDeleteSong = async (id: string) => {
    const song = songs.find((s) => s.id === id)
    if (!song) return

    const success = await deleteSong(id)
    if (success) {
      // Delete file from storage
      await deleteSongFile(song.file_path)

      setSongs((prev) => prev.filter((s) => s.id !== id))

      if (currentlyPlaying === id) {
        setCurrentlyPlaying(null)
      }
    } else {
      alert("Failed to delete song")
    }
  }

  const handleReorderSongs = async (reorderedSongs: Song[]) => {
    setSongs(reorderedSongs)

    // Update positions in database
    const updates = reorderedSongs.map((song, index) => ({
      id: song.id,
      position: index,
    }))

    await updateSongPositions(updates)
  }

  const handleSavePlaylist = async () => {
    // Force immediate sync of playlist order
    const updates = songs.map((song, index) => ({
      id: song.id,
      position: index,
    }))

    const success = await updateSongPositions(updates)
    if (success) {
      // Show a temporary success message
      const button = document.querySelector("[data-sync-button]") as HTMLElement
      if (button) {
        const originalText = button.textContent
        button.textContent = "✓ Synced!"
        button.style.color = "#10b981"
        setTimeout(() => {
          button.textContent = originalText
          button.style.color = ""
        }, 2000)
      }
    } else {
      alert("Failed to sync playlist order")
    }
  }

  const handlePlaySong = (id: string) => {
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null) // Pause current song
    } else {
      setCurrentlyPlaying(id) // Play selected song
    }
  }

  const handleSongEnded = (currentSongId: string) => {
    const currentIndex = songs.findIndex((song) => song.id === currentSongId)
    const nextIndex = currentIndex + 1

    if (nextIndex < songs.length) {
      // Play next song
      setCurrentlyPlaying(songs[nextIndex].id)
    } else {
      // End of playlist
      setCurrentlyPlaying(null)
    }
  }

  // Add song URLs for playback
  const songsWithUrls = songs.map((song) => ({
    ...song,
    url: getSongUrl(song.file_path),
  }))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Please log in to continue</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header user={user} onLogout={handleLogout} />

      {!isDatabaseReady && (
        <div className="container mx-auto px-4 py-4">
          <DatabaseStatus
            onStatusChange={(ready) => {
              setIsDatabaseReady(ready)
              if (!ready) {
                setUseLocalStorage(true)
              }
            }}
          />
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <UploadArea onFileUpload={handleFileUpload} />
          </div>

          <div className="lg:col-span-2">
            <PlaylistView
              songs={songsWithUrls}
              currentlyPlaying={currentlyPlaying}
              onPlaySong={handlePlaySong}
              onSongEnded={handleSongEnded}
              onDeleteSong={handleDeleteSong}
              onReorderSongs={handleReorderSongs}
              onSavePlaylist={handleSavePlaylist}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
