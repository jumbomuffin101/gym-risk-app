import React from "react";

export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4
                      shadow-lg shadow-black/40">
        <h1 className="text-2xl font-semibold text-white/90">{title}</h1>
        {children}
      </div>
    </div>
  );
}
