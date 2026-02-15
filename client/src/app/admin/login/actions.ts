"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { AppUser } from "@/models";
import { signToken, comparePassword, SESSION_COOKIE_NAME } from "@/lib/admin/auth";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    await connectDB();
    const user = await AppUser.findOne({ email: email.toLowerCase() });

    if (!user) {
      return { error: "Invalid email or password" };
    }

    if (user.accountStatus !== "Active" && user.accountStatus !== "active") {
      return { error: "Account is not active" };
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return { error: "Invalid email or password" };
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      name: `${user.name?.first || ""} ${user.name?.last || ""}`.trim(),
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 86400, // 24 hours
    });
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An error occurred. Please try again." };
  }

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
