import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "user" | "admin";
      username: string;
      fullName?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    picture?: string | null;
    role?: "user" | "admin";
    username?: string;
    fullName?: string | null;
    email?: string | null;
  }
}
