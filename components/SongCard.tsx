"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Trash2, GripVertical } from "lucide-react"
import type { Song } from "@/lib/database"

// Add url property to the Song type for the component
interface SongWithUrl extends Song {
  url: string
}

interface SongCardProps {
  song: SongWithUrl
  index: number
  isPlaying: boolean
  onPlay: () => void
  onSongEnded: () => void
  onDelete: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
}

export default function SongCard({
  song,
  index,
  isPlaying,
  onPlay,
  onSongEnded,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
}: SongCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card
      className={`border-gray-700 hover:bg-gray-750 transition-colors cursor-move ${
        isPlaying ? "bg-gray-700 border-blue-500 shadow-lg shadow-blue-500/20" : "bg-gray-800"
      }`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <GripVertical className="h-5 w-5 text-gray-500 cursor-grab active:cursor-grabbing" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-white font-medium truncate">{song.title}</h3>
              {isPlaying && (
                <div className="flex space-x-1">
                  <div className="w-1 h-3 bg-blue-400 rounded animate-pulse"></div>
                  <div className="w-1 h-2 bg-blue-400 rounded animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-1 h-4 bg-blue-400 rounded animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              Duration: {song.duration > 0 ? formatDuration(song.duration) : "Unknown"}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onPlay}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={song.url}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              // Duration is now available from the database
            }
          }}
          onEnded={onSongEnded}
        />
      </CardContent>
    </Card>
  )
}
