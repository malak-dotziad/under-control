import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: "Invalid login" });
  }

  const ok = await bcrypt.compare(password, data.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid login" });
  }

  res.status(200).json({ userId: data.id });
}
