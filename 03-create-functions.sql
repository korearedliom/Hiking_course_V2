-- Function to get user stats
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

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
