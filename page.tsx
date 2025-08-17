"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Star,
  MapPin,
  Clock,
  Mountain,
  Users,
  Search,
  Heart,
  Calendar,
  Camera,
  Award,
  Trophy,
  Loader2,
} from "lucide-react"
import AuthModal from "@/components/auth-modal"
import ProfileEditModal from "@/components/profile-edit-modal"
import UserProfileCard from "@/components/user-profile-card"
import CourseCompletionModal from "@/components/course-completion-modal"
import CompletedCoursesList from "@/components/completed-courses-list"
import { supabase } from "@/lib/supabase/client"

const popularDestinations = [
  { name: "일본", count: 45, image: "/japan-mountain-hiking-trail.png" },
  { name: "네팔", count: 32, image: "/placeholder-e146k.png" },
  { name: "한국", count: 28, image: "/korea-autumn-hike.png" },
  { name: "인도네시아", count: 24, image: "/indonesia-volcano-hiking.png" },
  { name: "부탄", count: 18, image: "/placeholder.svg?height=200&width=300" },
  { name: "대만", count: 22, image: "/placeholder.svg?height=200&width=300" },
]

export default function HikingWebsite() {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [favorites, setFavorites] = useState(new Set())
  const [activeTab, setActiveTab] = useState("courses")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [bookings, setBookings] = useState([])
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState("login")
  const [userStats, setUserStats] = useState({
    completedCourses: 0,
    totalDistance: 0,
    favoriteCount: 0,
  })
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [userProfile, setUserProfile] = useState({
    full_name: "",
    email: "",
    avatar_url: "",
    bio: "",
    location: "",
    experience_level: "초급",
    favorite_activity: "하이킹",
  })
  const [joinDate, setJoinDate] = useState("")
  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [selectedCourseForCompletion, setSelectedCourseForCompletion] = useState(null)

  const [hikingCourses, setHikingCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState(null)

  useEffect(() => {
    checkAuthState()
    loadHikingCourses()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsLoggedIn(true)
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User")
        setUserEmail(session.user.email || "")
        setAuthModalOpen(false)
        loadUserData(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false)
        setUserName("")
        setUserEmail("")
        setUserStats({ completedCourses: 0, totalDistance: 0, favoriteCount: 0 })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadHikingCourses = async () => {
    try {
      setCoursesLoading(true)
      setCoursesError(null)

      const { data, error } = await supabase
        .from("hiking_courses")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Transform database data to match UI expectations
      const transformedCourses = data.map((course) => ({
        id: course.id,
        title: course.name,
        country: course.country,
        location: course.location,
        difficulty: course.difficulty,
        distance_km: course.distance_km,
        duration_hours: course.duration_hours,
        best_season: ["4월", "5월", "9월", "10월"], // Default seasons
        description: course.description,
        image: course.image_url,
        rating: 4.5, // Default rating
        reviews: Math.floor(Math.random() * 1000) + 100, // Random review count
        price: course.price_krw ? `₩${course.price_krw.toLocaleString()}` : "무료",
        highlights: ["아름다운 경치", "좋은 트레킹", "추천 코스"], // Default highlights
        elevation_gain: course.elevation_gain,
      }))

      setHikingCourses(transformedCourses)
    } catch (error) {
      console.error("Error loading hiking courses:", error)
      setCoursesError("하이킹 코스를 불러오는 중 오류가 발생했습니다.")
    } finally {
      setCoursesLoading(false)
    }
  }

  const checkAuthState = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      setIsLoggedIn(true)
      setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User")
      setUserEmail(session.user.email || "")
      loadUserData(session.user.id)
    }
  }

  const loadUserData = async (userId) => {
    try {
      const { data: statsData, error: statsError } = await supabase.rpc("get_user_stats", { user_uuid: userId })

      if (statsError) throw statsError

      if (statsData && statsData.length > 0) {
        const stats = statsData[0]
        setUserStats({
          completedCourses: stats.completed_courses || 0,
          totalDistance: Number.parseFloat(stats.total_distance) || 0,
          favoriteCount: stats.favorite_courses || 0,
        })
      }

      const { data: favoritesData, error: favoritesError } = await supabase
        .from("user_favorites")
        .select("course_id")
        .eq("user_id", userId)

      if (favoritesError) throw favoritesError

      const favoriteIds = new Set(favoritesData.map((fav) => fav.course_id))
      setFavorites(favoriteIds)

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError)
      } else if (profileData) {
        setUserProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || "",
          avatar_url: profileData.avatar_url || "",
          bio: profileData.bio || "",
          location: profileData.location || "",
          experience_level: profileData.experience_level || "초급",
          favorite_activity: profileData.favorite_activity || "하이킹",
        })
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userData.user) {
        setJoinDate(new Date(userData.user.created_at).toLocaleDateString())
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const handleLogin = () => {
    setAuthMode("login")
    setAuthModalOpen(true)
  }

  const handleSignup = () => {
    setAuthMode("signup")
    setAuthModalOpen(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleBooking = (course) => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다!")
      return
    }
    const newBooking = {
      id: Date.now(),
      courseId: course.id,
      courseName: course.title,
      date: new Date().toLocaleDateString(),
      status: "예약완료",
    }
    setBookings([...bookings, newBooking])
    alert(`${course.title} 일정이 계획되었습니다!`)
  }

  const handleGalleryView = (course) => {
    alert(`${course.title}의 갤러리를 보여드립니다!`)
  }

  const handleNewPost = () => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다!")
      return
    }
    const title = prompt("게시글 제목을 입력하세요:")
    const content = prompt("게시글 내용을 입력하세요:")
    if (title && content) {
      const newPost = {
        id: Date.now(),
        title,
        author: userName,
        time: "방금 전",
        replies: 0,
        content,
      }
      setCommunityPosts([newPost, ...communityPosts])
      alert("게시글이 작성되었습니다!")
    }
  }

  const handlePostClick = (post) => {
    alert(`게시글: ${post.title}\n작성자: ${post.author}\n내용: ${post.content}`)
  }

  const handleSocialLogin = (platform) => {
    alert(`${platform}으로 연결됩니다!`)
  }

  const handleFooterLink = (linkName) => {
    alert(`${linkName} 페이지로 이동합니다!`)
  }

  const filteredCourses = hikingCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = difficultyFilter === "all" || course.difficulty === difficultyFilter
    const matchesCountry = countryFilter === "all" || course.country === countryFilter
    return matchesSearch && matchesDifficulty && matchesCountry
  })

  const toggleFavorite = async (courseId) => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다!")
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const newFavorites = new Set(favorites)

      if (newFavorites.has(courseId)) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("course_id", courseId)

        if (error) throw error
        newFavorites.delete(courseId)
      } else {
        const { error } = await supabase.from("user_favorites").insert({
          user_id: user.id,
          course_id: courseId,
        })

        if (error) throw error
        newFavorites.add(courseId)
      }

      setFavorites(newFavorites)
      setUserStats((prev) => ({ ...prev, favoriteCount: newFavorites.size }))
    } catch (error) {
      console.error("Error toggling favorite:", error)
      alert("찜하기 처리 중 오류가 발생했습니다.")
    }
  }

  const handleMarkAsCompleted = (course) => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다!")
      return
    }
    setSelectedCourseForCompletion(course)
    setCompletionModalOpen(true)
  }

  const handleCompletionSaved = async () => {
    // Reload user data to update stats
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      loadUserData(user.id)
    }
  }

  const getDifficultyColor = (difficulty) => {
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

  const [communityPosts, setCommunityPosts] = useState([
    {
      id: 1,
      title: "후지산 등반 후기 - 일출이 정말 아름다웠어요!",
      author: "하이커123",
      time: "2시간 전",
      replies: 12,
      content: "어제 후지산 등반을 다녀왔습니다. 새벽 3시에 출발해서 일출을 보는 순간이 정말 감동적이었어요!",
    },
    {
      id: 2,
      title: "안나푸르나 트레킹 준비물 추천",
      author: "산악인",
      time: "5시간 전",
      replies: 8,
      content: "안나푸르나 트레킹을 준비하시는 분들을 위해 필수 준비물을 정리해봤습니다.",
    },
    {
      id: 3,
      title: "제주 올레길 완주 인증!",
      author: "제주러버",
      time: "1일 전",
      replies: 24,
      content: "드디어 제주 올레길 전 코스를 완주했습니다! 정말 뿌듯해요.",
    },
  ])

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile)
    setUserName(updatedProfile.full_name || updatedProfile.email?.split("@")[0] || "User")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Mountain className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">아시아 하이킹</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Button variant="ghost" onClick={() => setActiveTab("courses")}>
                코스
              </Button>
              <Button variant="ghost" onClick={() => setActiveTab("destinations")}>
                여행지
              </Button>
              <Button variant="ghost" onClick={() => setActiveTab("community")}>
                커뮤니티
              </Button>
              <Button variant="ghost" onClick={() => setActiveTab("mypage")}>
                마이페이지
              </Button>
            </nav>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">안녕하세요, {userName}님!</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    로그아웃
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleLogin}>
                    로그인
                  </Button>
                  <Button size="sm" onClick={handleSignup}>
                    회원가입
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">아시아의 숨겨진 하이킹 코스를 발견하세요</h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            초급부터 중급까지, 당신에게 완벽한 하이킹 코스를 찾아보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="코스명, 국가, 지역으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-gray-900"
              />
            </div>
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 h-12 px-8"
              onClick={() => {
                if (searchTerm.trim()) {
                  alert(`"${searchTerm}"에 대한 검색 결과를 표시합니다!`)
                } else {
                  alert("검색어를 입력해주세요!")
                }
              }}
            >
              검색하기
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="courses">하이킹 코스</TabsTrigger>
            <TabsTrigger value="destinations">인기 여행지</TabsTrigger>
            <TabsTrigger value="community">커뮤니티</TabsTrigger>
            <TabsTrigger value="mypage">마이페이지</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="난이도" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 난이도</SelectItem>
                  <SelectItem value="초급">초급</SelectItem>
                  <SelectItem value="중급">중급</SelectItem>
                  <SelectItem value="고급">고급</SelectItem>
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="국가" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 국가</SelectItem>
                  <SelectItem value="일본">일본</SelectItem>
                  <SelectItem value="한국">한국</SelectItem>
                  <SelectItem value="네팔">네팔</SelectItem>
                  <SelectItem value="부탄">부탄</SelectItem>
                  <SelectItem value="인도네시아">인도네시아</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setDifficultyFilter("all")
                  setCountryFilter("all")
                }}
              >
                필터 초기화
              </Button>

              <Button variant="outline" onClick={loadHikingCourses} disabled={coursesLoading}>
                {coursesLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    새로고침 중...
                  </>
                ) : (
                  "새로고침"
                )}
              </Button>
            </div>

            {coursesLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">하이킹 코스를 불러오는 중...</span>
              </div>
            ) : coursesError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{coursesError}</p>
                <Button onClick={loadHikingCourses}>다시 시도</Button>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">검색 조건에 맞는 하이킹 코스가 없습니다.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setDifficultyFilter("all")
                    setCountryFilter("all")
                  }}
                >
                  필터 초기화
                </Button>
              </div>
            ) : (
              /* Course Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                        onClick={() => toggleFavorite(course.id)}
                      >
                        <Heart
                          className={`h-4 w-4 ${favorites.has(course.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                        />
                      </Button>
                      <Badge className={`absolute top-2 left-2 ${getDifficultyColor(course.difficulty)}`}>
                        {course.difficulty}
                      </Badge>
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4" />
                            {course.country}, {course.location}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{course.rating}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Mountain className="h-4 w-4" />
                          {course.distance_km}km
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.duration_hours}시간
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.reviews}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {course.highlights.map((highlight, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-600">{course.price}</span>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button onClick={() => setSelectedCourse(course)}>자세히 보기</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              {selectedCourse && (
                                <>
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl">{selectedCourse.title}</DialogTitle>
                                    <DialogDescription className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      {selectedCourse.country}, {selectedCourse.location}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <img
                                      src={selectedCourse.image || "/placeholder.svg"}
                                      alt={selectedCourse.title}
                                      className="w-full h-64 object-cover rounded-lg"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Mountain className="h-5 w-5 text-gray-600" />
                                          <span>거리: {selectedCourse.distance_km}km</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-5 w-5 text-gray-600" />
                                          <span>소요시간: {selectedCourse.duration_hours}시간</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Star className="h-5 w-5 text-yellow-400" />
                                          <span>
                                            평점: {selectedCourse.rating} ({selectedCourse.reviews}개 리뷰)
                                          </span>
                                        </div>
                                        {selectedCourse.elevation_gain && (
                                          <div className="flex items-center gap-2">
                                            <Mountain className="h-5 w-5 text-gray-600" />
                                            <span>고도 상승: {selectedCourse.elevation_gain}m</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Badge className={getDifficultyColor(selectedCourse.difficulty)}>
                                          {selectedCourse.difficulty}
                                        </Badge>
                                        <div>
                                          <span className="font-semibold">최적 시기:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedCourse.best_season.map((season, index) => (
                                              <Badge key={index} variant="outline" className="text-xs">
                                                {season}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-gray-700">{selectedCourse.description}</p>
                                    <div>
                                      <h4 className="font-semibold mb-2">주요 특징</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedCourse.highlights.map((highlight, index) => (
                                          <Badge key={index} variant="secondary">
                                            {highlight}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                      <Button className="flex-1" onClick={() => handleBooking(selectedCourse)}>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        일정 계획하기
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        onClick={() => handleGalleryView(selectedCourse)}
                                      >
                                        <Camera className="h-4 w-4 mr-2" />
                                        갤러리 보기
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="flex-1 bg-green-50 text-green-700 hover:bg-green-100"
                                        onClick={() => handleMarkAsCompleted(selectedCourse)}
                                      >
                                        <Trophy className="h-4 w-4 mr-2" />
                                        완주 인증
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="destinations">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularDestinations.map((destination, index) => (
                <Card
                  key={index}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setCountryFilter(destination.name)
                    setActiveTab("courses")
                    alert(`${destination.name}의 하이킹 코스를 보여드립니다!`)
                  }}
                >
                  <div className="relative">
                    <img
                      src={destination.image || "/placeholder.svg"}
                      alt={destination.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-end">
                      <div className="p-4 text-white">
                        <h3 className="text-xl font-bold">{destination.name}</h3>
                        <p className="text-sm opacity-90">{destination.count}개 코스</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="community">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>하이킹 커뮤니티</CardTitle>
                  <CardDescription>다른 하이커들과 경험을 나누고 정보를 공유하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" onClick={handleNewPost}>
                      새 글 작성하기
                    </Button>
                    <div className="space-y-3">
                      {communityPosts.map((post, index) => (
                        <Card
                          key={post.id}
                          className="p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handlePostClick(post)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{post.title}</h4>
                              <p className="text-sm text-gray-600">
                                {post.author} • {post.time}
                              </p>
                            </div>
                            <Badge variant="outline">{post.replies}개 댓글</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mypage">
            {isLoggedIn && (
              <UserProfileCard
                profile={userProfile}
                userStats={userStats}
                joinDate={joinDate}
                onEditProfile={() => setProfileEditOpen(true)}
              />
            )}

            {isLoggedIn && (
              <div className="mb-6">
                <CompletedCoursesList
                  userId={userEmail}
                  onEditCompletion={(completion) => {
                    // Handle editing existing completion
                    setSelectedCourseForCompletion({
                      id: completion.course_id,
                      title: completion.hiking_courses?.name,
                      country: completion.hiking_courses?.country,
                      location: completion.hiking_courses?.location,
                      difficulty: completion.hiking_courses?.difficulty,
                      distance_km: completion.hiking_courses?.distance_km,
                    })
                    setCompletionModalOpen(true)
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    찜한 코스
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{userStats.favoriteCount}개</p>
                  <p className="text-sm text-gray-600">관심 있는 코스들</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    완주한 코스
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{userStats.completedCourses}개</p>
                  <p className="text-sm text-gray-600">도전 완료!</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mountain className="h-5 w-5" />총 거리
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{userStats.totalDistance}km</p>
                  <p className="text-sm text-gray-600">누적 하이킹 거리</p>
                </CardContent>
              </Card>
            </div>
            {bookings.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>예약한 일정</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <div>
                          <span className="font-medium">{booking.courseName}</span>
                          <p className="text-sm text-gray-600">예약일: {booking.date}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">{booking.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>최근 활동</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: "후지산 요시다 루트를 찜했습니다", time: "2시간 전" },
                    { action: "제주 올레길 7코스 완주 인증", time: "3일 전" },
                    { action: "설악산 울산바위 후기 작성", time: "1주 전" },
                  ].map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>{activity.action}</span>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Mountain className="h-6 w-6" />
                <span className="text-xl font-bold">아시아 하이킹</span>
              </div>
              <p className="text-gray-400">아시아 최고의 하이킹 코스를 발견하고 공유하는 플랫폼</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">서비스</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-gray-400"
                    onClick={() => handleFooterLink("코스 검색")}
                  >
                    코스 검색
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-gray-400"
                    onClick={() => handleFooterLink("추천 시스템")}
                  >
                    추천 시스템
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-gray-400"
                    onClick={() => handleFooterLink("커뮤니티")}
                  >
                    커뮤니티
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">지원</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-gray-400"
                    onClick={() => handleFooterLink("고객센터")}
                  >
                    고객센터
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-gray-400"
                    onClick={() => handleFooterLink("이용약관")}
                  >
                    이용약관
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-gray-400"
                    onClick={() => handleFooterLink("개인정보처리방침")}
                  >
                    개인정보처리방침
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">연결</h3>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm" onClick={() => handleSocialLogin("Facebook")}>
                  Facebook
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSocialLogin("Instagram")}>
                  Instagram
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSocialLogin("YouTube")}>
                  YouTube
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 아시아 하이킹. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={profileEditOpen}
        onClose={() => setProfileEditOpen(false)}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Course Completion Modal */}
      <CourseCompletionModal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        course={selectedCourseForCompletion}
        onCompletion={handleCompletionSaved}
      />
    </div>
  )
}
