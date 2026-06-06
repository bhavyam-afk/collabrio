"use client";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

export default function MetaConnectButton() {

  const pathname = usePathname();
  const username = pathname.split("/")[2];

  const { data: session, status } = useSession();
  const [connected, setConnected] = useState<Boolean | null>(null);

  useEffect(() => {
    // Only check DB when user is authenticated
    if (status !== "authenticated") return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/influencer/${username}/creator-social-account`);
        if (!res.ok) {
          setConnected(false);
          return;
        }
        const data = await res.json();
        setConnected(Boolean(data.connected));
      } catch (e) {
        console.error(e);
        setConnected(false);
      }
    };

    fetchStatus();
  }, [status]);

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_META_APP_ID;
    const redirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error("Missing Meta env vars");
      return;
    }

    if (status !== "authenticated") {
      signIn();
      return;
    }

    const statePayload = {
      creatorId: session?.user?.id,
      username: session?.user?.username,
    };
    if (!statePayload.creatorId) {
      console.error("Missing creatorId in session — ensure NextAuth session includes user.id via callbacks");
      return;
    }
    const state = encodeURIComponent(JSON.stringify(statePayload));

    const scope = [
      "email",
      "public_profile",
      "pages_show_list",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_manage_insights",
    ].join(",");

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_type=code` +
      `&state=${state}`;

    window.location.href = authUrl;
  };

  // Only show button when we know the user is authenticated and not connected
  if (status !== "authenticated" || connected !== false) return null;

  return (
    <>
      {connected === false &&
        <button onClick={handleConnect} className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded">
          Connect Instagram
        </button>
      }
    </>
  );
}
