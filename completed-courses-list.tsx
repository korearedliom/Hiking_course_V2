"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { Star, Calendar, MapPin, Trophy, Edit } from "lucide-react"

interface CompletedCoursesListProps {
  userId: string
  onEditCompletion: (completion: any) => void
}

export default function CompletedCoursesList({ userId, onEditCompletion }: CompletedCoursesListProps) {
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadCompletions()
    }
  }, [userId])

  const loadCompletions = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("course_completions")
        .select(`
          *,
          hiking_courses (
            name,
            location,
            country,
            difficulty,
            distance_km,
            image_url
          )
        `)
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })

      if (error) throw error

      setCompletions(data || [])
    } catch (error) {
      console.error("Error loading completions:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "초급":
        return "bg-green-100 text-green-800"
      case "중급":
        return "bg-yellow-100 text-yellow-800"
      case "고급":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            완주한 코스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">로딩 중...</p>
        </CardContent>
      </Card>
    )
  }

  if (completions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            완주한 코스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">아직 완주한 코스가 없습니다.</p>
          <p className="text-center text-sm text-gray-400 mt-2">첫 번째 하이킹을 완주하고 인증해보세요!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          완주한 코스 ({completions.length}개)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {completions.map((completion) => (
            <div key={completion.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <img
                    src={completion.hiking_courses?.image_url || "/placeholder.svg"}
                    alt={completion.hiking_courses?.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{completion.hiking_courses?.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      {completion.hiking_courses?.country}, {completion.hiking_courses?.location}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getDifficultyColor(completion.hiking_courses?.difficulty)}>
                        {completion.hiking_courses?.difficulty}
                      </Badge>
                      <span className="text-sm text-gray-500">{completion.hiking_courses?.distance_km}km</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => onEditCompletion(completion)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= completion.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">({completion.rating}/5)</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {formatDate(completion.completed_at)}
                  </div>
                </div>

                {completion.review && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">"{completion.review}"</p>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  {completion.difficulty_experienced && (
                    <Badge variant="outline">체감: {completion.difficulty_experienced}</Badge>
                  )}
                  {completion.weather_conditions && (
                    <Badge variant="outline">날씨: {completion.weather_conditions}</Badge>
                  )}
                  {completion.companions && <Badge variant="outline">동행: {completion.companions}</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
