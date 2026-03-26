interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export default function UserAvatar({ src, name, size = 40, className = '' }: UserAvatarProps) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.35) }}
      className={`rounded-full bg-[#A67564] text-white flex items-center justify-center font-semibold select-none flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
