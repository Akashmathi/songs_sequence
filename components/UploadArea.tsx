"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Music } from "lucide-react"

interface UploadAreaProps {
  onFileUpload: (files: File[]) => void
}

export default function UploadArea({ onFileUpload }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === "audio/mpeg" || file.name.endsWith(".mp3"),
      )

      if (files.length > 0) {
        onFileUpload(files)
      }
    },
    [onFileUpload],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileUpload(files)
    }
    // Reset input
    e.target.value = ""
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Upload Songs
        </CardTitle>
        <CardDescription className="text-gray-400">Add MP3 files to your playlist</CardDescription>
      </CardHeader>

      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-600"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Music className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Drag and drop MP3 files here, or click to select</p>

          <input
            type="file"
            accept=".mp3,audio/mpeg"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />

          <Button asChild variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent">
            <label htmlFor="file-upload" className="cursor-pointer">
              Select Files
            </label>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
