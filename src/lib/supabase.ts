import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uuirdyzyutdiewdspfeq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aXJkeXp5dXRkaWV3ZHNwZmVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDcxMTMsImV4cCI6MjEwNjc4MzExM30.VFA3jtaGezDCAdAlhf3RGrF0hr53xF7gMLIHBLU3pjE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
