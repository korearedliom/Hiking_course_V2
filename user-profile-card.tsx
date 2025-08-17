"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Edit } from "lucide-react"

interface UserProfileCardProps {
  profile: {
    full_name: string
    email: string
    avatar_url: string
    bio: string
    location: string
    experience_level: string
    favorite_activity: string
  }
  userStats: {
    completedCourses: number
    totalDistance: number
    favoriteCount: number
  }
  joinDate: string
  onEditProfile: () => void
}

export default function UserProfileCard({ profile, userStats, joinDate, onEditProfile }: UserProfileCardProps) {
  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case "초급":
        return "bg-green-100 text-green-800"
      case "중급":
        return "bg-yellow-100 text-yellow-800"
      case "고급":
        return "bg-orange-100 text-orange-800"
      case "전문가":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile.full_name || "사용자"}</CardTitle>
              <p className="text-gray-600">{profile.email}</p>
              {profile.location && (
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              )}
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                가입일: {joinDate}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onEditProfile}>
            <Edit className="w-4 h-4 mr-2" />
            편집
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={getExperienceBadgeColor(profile.experience_level)}>{profile.experience_level}</Badge>
            <Badge variant="secondary">{profile.favorite_activity}</Badge>
          </div>

          {profile.bio && (
            <div>
              <h4 className="font-semibold mb-2">자기소개</h4>
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userStats.completedCourses}</div>
              <div className="text-sm text-gray-600">완주한 코스</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{userStats.totalDistance}km</div>
              <div className="text-sm text-gray-600">총 거리</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.favoriteCount}</div>
              <div className="text-sm text-gray-600">찜한 코스</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
