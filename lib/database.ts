import { supabase } from "./supabase"

export interface Song {
  id: string
  user_id: string
  title: string
  file_name: string
  file_path: string
  duration: number
  file_size?: number
  mime_type: string
  position: number
  created_at: string
  updated_at: string
}

export interface Playlist {
  id: string
  user_id: string
  name: string
  description?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

// Profile functions
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile:", error)

      // If profile doesn't exist, try to create it
      if (error.code === "PGRST116") {
        console.log("Profile not found, attempting to create...")
        return await createProfileForUser(userId)
      }
      return null
    }

    return data
  } catch (err) {
    console.error("Unexpected error in getProfile:", err)
    return null
  }
}

export async function createProfileForUser(userId: string): Promise<Profile | null> {
  try {
    // Get user info from auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      console.error("User mismatch or no user found")
      return null
    }

    const newProfile = {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
    }

    console.log("Creating profile:", newProfile)

    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .insert([newProfile])
      .select()
      .single()

    if (createError) {
      console.error("Error creating profile:", createError)
      return null
    }

    console.log("Profile created successfully:", createdProfile)

    // Also create default playlist
    try {
      await supabase.from("playlists").insert([
        {
          user_id: user.id,
          name: "My Music",
          is_default: true,
        },
      ])
      console.log("Default playlist created")
    } catch (playlistError) {
      console.error("Error creating default playlist:", playlistError)
      // Don't fail profile creation if playlist creation fails
    }

    return createdProfile
  } catch (err) {
    console.error("Unexpected error in createProfileForUser:", err)
    return null
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

  if (error) {
    console.error("Error updating profile:", error)
    return false
  }

  return true
}

// Song functions
export async function getSongs(userId: string): Promise<Song[]> {
  try {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true })

    if (error) {
      console.error("Error fetching songs:", error)

      // If table doesn't exist, return empty array
      if (error.code === "42P01") {
        console.warn("Songs table doesn't exist yet. Please run the database setup scripts.")
        return []
      }

      return []
    }

    return data || []
  } catch (err) {
    console.error("Unexpected error in getSongs:", err)
    return []
  }
}

export async function addSong(song: Omit<Song, "id" | "created_at" | "updated_at">): Promise<Song | null> {
  try {
    const { data, error } = await supabase.from("songs").insert([song]).select().single()

    if (error) {
      console.error("Error adding song:", error)
      return null
    }

    return data
  } catch (err) {
    console.error("Unexpected error in addSong:", err)
    return null
  }
}

export async function updateSong(songId: string, updates: Partial<Song>): Promise<boolean> {
  const { error } = await supabase.from("songs").update(updates).eq("id", songId)

  if (error) {
    console.error("Error updating song:", error)
    return false
  }

  return true
}

export async function deleteSong(songId: string): Promise<boolean> {
  const { error } = await supabase.from("songs").delete().eq("id", songId)

  if (error) {
    console.error("Error deleting song:", error)
    return false
  }

  return true
}

export async function updateSongPositions(songs: { id: string; position: number }[]): Promise<boolean> {
  try {
    const updates = songs.map((song) => supabase.from("songs").update({ position: song.position }).eq("id", song.id))

    await Promise.all(updates)
    return true
  } catch (error) {
    console.error("Error updating song positions:", error)
    return false
  }
}

// File upload function
export async function uploadSongFile(file: File, userId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage.from("songs").upload(fileName, file)

    if (error) {
      console.error("Error uploading file:", error)
      return null
    }

    return fileName
  } catch (err) {
    console.error("Unexpected error in uploadSongFile:", err)
    return null
  }
}

export async function deleteSongFile(filePath: string): Promise<boolean> {
  const { error } = await supabase.storage.from("songs").remove([filePath])

  if (error) {
    console.error("Error deleting file:", error)
    return false
  }

  return true
}

export function getSongUrl(filePath: string): string {
  const { data } = supabase.storage.from("songs").getPublicUrl(filePath)
  return data.publicUrl
}

// Playlist functions
export async function getPlaylists(userId: string): Promise<Playlist[]> {
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching playlists:", error)
    return []
  }

  return data || []
}

export async function getDefaultPlaylist(userId: string): Promise<Playlist | null> {
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .eq("is_default", true)
    .single()

  if (error) {
    console.error("Error fetching default playlist:", error)
    return null
  }

  return data
}
