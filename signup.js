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
  const hash = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("users").insert({
    username,
    password_hash: hash
  });

  if (error) {
    return res.status(400).json({ error: "User already exists" });
  }

  res.status(200).json({ success: true });
}
