-- Add additional fields to course_completions table
ALTER TABLE public.course_completions ADD COLUMN IF NOT EXISTS difficulty_experienced TEXT;
ALTER TABLE public.course_completions ADD COLUMN IF NOT EXISTS weather_conditions TEXT;
ALTER TABLE public.course_completions ADD COLUMN IF NOT EXISTS companions TEXT;

-- Update the get_user_stats function to use real data
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE(
  completed_courses INTEGER,
  total_distance DECIMAL,
  total_elevation INTEGER,
  favorite_courses INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(cc.id)::INTEGER, 0) as completed_courses,
    COALESCE(SUM(hc.distance_km), 0) as total_distance,
    COALESCE(SUM(hc.elevation_gain), 0) as total_elevation,
    COALESCE((SELECT COUNT(*)::INTEGER FROM user_favorites WHERE user_id = user_uuid), 0) as favorite_courses
  FROM course_completions cc
  JOIN hiking_courses hc ON cc.course_id = hc.id
  WHERE cc.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get completion stats by difficulty
CREATE OR REPLACE FUNCTION get_completion_stats_by_difficulty(user_uuid UUID)
RETURNS TABLE(
  difficulty TEXT,
  count INTEGER,
  avg_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hc.difficulty,
    COUNT(cc.id)::INTEGER as count,
    COALESCE(AVG(cc.rating), 0) as avg_rating
  FROM course_completions cc
  JOIN hiking_courses hc ON cc.course_id = hc.id
  WHERE cc.user_id = user_uuid
  GROUP BY hc.difficulty
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
