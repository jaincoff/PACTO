"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getProfilePhotoUrl } from "@/lib/api";

interface UserAvatarProps {
  photo: string | null | undefined;
  name: string;
  gender?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({
  photo,
  name,
  gender,
  size = 112,
  className,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getProfilePhotoUrl(photo);

  if (photoUrl && !imgError) {
    return (
      <div
        className={cn("relative overflow-hidden rounded-full border-4 border-primary/20", className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={photoUrl}
          alt={`Foto de ${name}`}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: gender-based avatar
  const isMale = gender?.toLowerCase() === "masculino";
  const isFemale = gender?.toLowerCase() === "feminino";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full border-4",
        isMale
          ? "border-blue-200 bg-blue-100 text-blue-600"
          : isFemale
            ? "border-pink-200 bg-pink-100 text-pink-600"
            : "border-primary/20 bg-primary/10 text-primary",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="opacity-80"
        style={{ width: size * 0.55, height: size * 0.55 }}
      >
        {isMale ? (
          // Male icon
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        ) : isFemale ? (
          // Female icon
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        ) : (
          // Generic person icon
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        )}
      </svg>
    </div>
  );
}
