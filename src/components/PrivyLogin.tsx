"use client";
import { usePrivy } from "@privy-io/react-auth";

export default function PrivyLogin() {
  const { login, logout, user, ready, authenticated } = usePrivy();

  if (!ready) return <button className="a-btn">Loading…</button>;

  if (!authenticated) {
    return (
      <button onClick={login} className="a-btn">
        Login (Privy)
      </button>
    );
  }

  const email = user?.email?.address;
  const phone = user?.phone?.number;
  const short = email ?? phone ?? user?.wallet?.address ?? "Signed in";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-300">{short}</span>
      <button onClick={logout} className="a-btn">Logout</button>
    </div>
  );
}
