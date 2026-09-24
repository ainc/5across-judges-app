import type { SelectHTMLAttributes } from "react";

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function AppSelect({ className = "", ...props }: AppSelectProps) {
  return <select className={className} {...props} />;
}
