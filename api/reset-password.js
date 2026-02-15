import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: true,
  },
};

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Missing Supabase server credentials" });
  }

  const { email, newPassword } = req.body || {};
  const emailValue = String(email || "").trim().toLowerCase();
  const passwordValue = String(newPassword || "");

  if (!isValidEmail(emailValue)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  if (passwordValue.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      return res.status(500).json({ error: "Failed to list users" });
    }

    const user = (usersData?.users || []).find(
      (u) => (u.email || "").toLowerCase() === emailValue
    );

    if (!user) {
      return res.status(404).json({ error: "No account found for that email" });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: passwordValue,
    });

    if (updateError) {
      return res.status(500).json({ error: "Failed to reset password" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Password reset failed" });
  }
}
