import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<string, string> = {
    primary: "bg-orange-500 text-white hover:bg-orange-600",
    secondary: "bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
    danger: "bg-red-600/90 text-white hover:bg-red-600",
    ghost: "bg-transparent text-neutral-300 hover:bg-neutral-800",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 ${props.className ?? ""}`}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-neutral-400">{children}</label>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-neutral-800 bg-neutral-900/60 p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "red" | "yellow" | "blue" }) {
  const tones: Record<string, string> = {
    neutral: "bg-neutral-800 text-neutral-300",
    green: "bg-emerald-500/15 text-emerald-400",
    red: "bg-red-500/15 text-red-400",
    yellow: "bg-yellow-500/15 text-yellow-400",
    blue: "bg-blue-500/15 text-blue-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-800 py-14 text-center text-sm text-neutral-500">
      {message}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
      {message}
    </div>
  );
}
