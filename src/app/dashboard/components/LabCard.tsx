import React from "react";

type LabCardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function LabCard({ hover = true, className = "", ...props }: LabCardProps) {
  const classes = ["lab-card", hover ? "lab-hover" : "", className].filter(Boolean).join(" ");

  return <div className={classes} {...props} />;
}
