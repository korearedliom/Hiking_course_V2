"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/client"
import { Camera, Save, X } from "lucide-react"

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileUpdate: (profile: any) => void
}

export default function ProfileEditModal({ isOpen, onClose, onProfileUpdate }: ProfileEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    avatar_url: "",
    bio: "",
    location: "",
    experience_level: "초급",
    favorite_activity: "하이킹",
  })

  useEffect(() => {
    if (isOpen) {
      loadProfile()
    }
  }, [isOpen])

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error)
        return
      }

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: user.email || "",
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
          location: data.location || "",
          experience_level: data.experience_level || "초급",
          favorite_activity: data.favorite_activity || "하이킹",
        })
      } else {
        // Create profile if it doesn't exist
        setProfile({
          full_name: user.user_metadata?.full_name || "",
          email: user.email || "",
          avatar_url: user.user_metadata?.avatar_url || "",
          bio: "",
          location: "",
          experience_level: "초급",
          favorite_activity: "하이킹",
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const filePath = `avatars/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      setProfile({ ...profile, avatar_url: publicUrl })
    } catch (error: any) {
      alert("Error uploading avatar: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const updates = {
        id: user.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        location: profile.location,
        experience_level: profile.experience_level,
        favorite_activity: profile.favorite_activity,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("profiles").upsert(updates)

      if (error) throw error

      onProfileUpdate(profile)
      onClose()
      alert("프로필이 업데이트되었습니다!")
    } catch (error: any) {
      alert("Error updating profile: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">프로필 편집</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="relative">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("avatar-upload")?.click()}
                disabled={uploading}
              >
                <Camera className="w-4 h-4 mr-2" />
                {uploading ? "업로드 중..." : "사진 변경"}
              </Button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">이름</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" value={profile.email} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500">이메일은 변경할 수 없습니다</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">거주지</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="예: 서울, 한국"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_level">경험 수준</Label>
              <select
                id="experience_level"
                value={profile.experience_level}
                onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="초급">초급</option>
                <option value="중급">중급</option>
                <option value="고급">고급</option>
                <option value="전문가">전문가</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite_activity">선호 활동</Label>
              <select
                id="favorite_activity"
                value={profile.favorite_activity}
                onChange={(e) => setProfile({ ...profile, favorite_activity: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="하이킹">하이킹</option>
                <option value="트레킹">트레킹</option>
                <option value="등반">등반</option>
                <option value="백패킹">백패킹</option>
                <option value="캠핑">캠핑</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">자기소개</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="자신을 소개해주세요..."
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={saveProfile} disabled={loading} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "저장 중..." : "저장"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              <X className="w-4 h-4 mr-2" />
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
