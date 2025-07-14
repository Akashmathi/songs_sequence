"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Music } from "lucide-react"
import SongCard from "./SongCard"
import type { Song } from "@/lib/database"

// Add url property to the Song type for the component
interface SongWithUrl extends Song {
  url: string
}

interface PlaylistViewProps {
  songs: SongWithUrl[]
  currentlyPlaying: string | null
  onPlaySong: (id: string) => void
  onSongEnded: (songId: string) => void
  onDeleteSong: (id: string) => void
  onReorderSongs: (songs: SongWithUrl[]) => void
  onSavePlaylist: () => void
}

export default function PlaylistView({
  songs,
  currentlyPlaying,
  onPlaySong,
  onSongEnded,
  onDeleteSong,
  onReorderSongs,
  onSavePlaylist,
}: PlaylistViewProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === index) return

    const newSongs = [...songs]
    const draggedSong = newSongs[draggedIndex]

    // Remove dragged item
    newSongs.splice(draggedIndex, 1)

    // Insert at new position
    newSongs.splice(index, 0, draggedSong)

    onReorderSongs(newSongs)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center">
              <Music className="h-5 w-5 mr-2" />
              Your Playlist
            </CardTitle>
            <CardDescription className="text-gray-400">
              {songs.length} song{songs.length !== 1 ? "s" : ""} in your collection
            </CardDescription>
          </div>

          {songs.length > 0 && (
            <div className="flex items-center space-x-3">
              <div className="text-sm text-green-400 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Auto-saved
              </div>
              <Button
                onClick={onSavePlaylist}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
                data-sync-button
              >
                <Save className="h-4 w-4 mr-2" />
                Sync Order
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {songs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No songs uploaded yet</p>
            <p className="text-gray-500">Upload some MP3 files to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map((song, index) => (
              <SongCard
                key={song.id}
                song={song}
                index={index}
                isPlaying={currentlyPlaying === song.id}
                onPlay={() => onPlaySong(song.id)}
                onSongEnded={() => onSongEnded(song.id)}
                onDelete={() => onDeleteSong(song.id)}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
