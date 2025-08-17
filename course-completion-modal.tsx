"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"
import { Star, Trophy, Save, X } from "lucide-react"

interface CourseCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  course: any
  onCompletion: () => void
}

export default function CourseCompletionModal({ isOpen, onClose, course, onCompletion }: CourseCompletionModalProps) {
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split("T")[0])
  const [difficulty, setDifficulty] = useState("")
  const [weather, setWeather] = useState("")
  const [companions, setCompanions] = useState("")

  const handleStarClick = (starRating: number) => {
    setRating(starRating)
  }

  const handleSubmit = async () => {
    if (!course || rating === 0) {
      alert("평점을 선택해주세요!")
      return
    }

    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("로그인이 필요합니다")

      // Check if already completed
      const { data: existingCompletion, error: checkError } = await supabase
        .from("course_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      if (existingCompletion) {
        // Update existing completion
        const { error: updateError } = await supabase
          .from("course_completions")
          .update({
            rating,
            review,
            completed_at: new Date(completionDate).toISOString(),
            difficulty_experienced: difficulty,
            weather_conditions: weather,
            companions,
          })
          .eq("id", existingCompletion.id)

        if (updateError) throw updateError
      } else {
        // Insert new completion
        const { error: insertError } = await supabase.from("course_completions").insert({
          user_id: user.id,
          course_id: course.id,
          rating,
          review,
          completed_at: new Date(completionDate).toISOString(),
          difficulty_experienced: difficulty,
          weather_conditions: weather,
          companions,
        })

        if (insertError) throw insertError
      }

      onCompletion()
      onClose()
      alert("완주 기록이 저장되었습니다!")
    } catch (error: any) {
      console.error("Error saving completion:", error)
      alert("완주 기록 저장 중 오류가 발생했습니다: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!course) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            코스 완주 인증
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Info */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">{course.title}</h3>
            <p className="text-gray-600">
              {course.country}, {course.location}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{course.difficulty}</Badge>
              <span className="text-sm text-gray-500">
                {course.distance_km}km • {course.duration_hours}시간
              </span>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>평점 *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => handleStarClick(star)} className="focus:outline-none">
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    } hover:text-yellow-400 transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {rating === 0 && "평점을 선택해주세요"}
              {rating === 1 && "별로예요"}
              {rating === 2 && "그저 그래요"}
              {rating === 3 && "보통이에요"}
              {rating === 4 && "좋아요"}
              {rating === 5 && "최고예요!"}
            </p>
          </div>

          {/* Completion Date */}
          <div className="space-y-2">
            <Label htmlFor="completion-date">완주 날짜</Label>
            <Input
              id="completion-date"
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">체감 난이도</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">선택하세요</option>
                <option value="매우 쉬움">매우 쉬움</option>
                <option value="쉬움">쉬움</option>
                <option value="보통">보통</option>
                <option value="어려움">어려움</option>
                <option value="매우 어려움">매우 어려움</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weather">날씨</Label>
              <select
                id="weather"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">선택하세요</option>
                <option value="맑음">맑음</option>
                <option value="흐림">흐림</option>
                <option value="비">비</option>
                <option value="눈">눈</option>
                <option value="안개">안개</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companions">동행자</Label>
            <Input
              id="companions"
              value={companions}
              onChange={(e) => setCompanions(e.target.value)}
              placeholder="예: 혼자, 친구 2명, 가족"
            />
          </div>

          {/* Review */}
          <div className="space-y-2">
            <Label htmlFor="review">후기</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="이 코스에 대한 경험을 공유해주세요..."
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={loading || rating === 0} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "저장 중..." : "완주 인증"}
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
