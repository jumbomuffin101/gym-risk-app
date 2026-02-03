import React from "react";

type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
};

export function AuthInput({ label, id, className, ...props }: AuthInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-white/80">
        {label}
      </label>
      <input
        id={id}
        className={[
          "h-11 w-full rounded-xl border border-[rgba(148,163,184,0.18)]",
          "bg-[rgba(8,12,20,0.72)] px-3 text-sm text-white/90",
          "placeholder:text-white/35 outline-none transition",
          "focus-visible:border-[rgba(56,189,248,0.6)] focus-visible:ring-2",
          "focus-visible:ring-[rgba(56,189,248,0.3)] motion-reduce:transition-none",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className ?? "",
        ].join(" ")}
        {...props}
      />
    </div>
  );
}
