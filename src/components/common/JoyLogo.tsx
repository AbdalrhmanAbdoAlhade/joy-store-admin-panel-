interface JoyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSlogan?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: { logo: 'text-2xl', slogan: 'text-[10px]' },
  md: { logo: 'text-3xl', slogan: 'text-xs' },
  lg: { logo: 'text-5xl', slogan: 'text-sm' },
};

export function JoyLogo({ size = 'md', showSlogan = true, className }: JoyLogoProps) {
  return (
    <div className={`flex flex-col items-center ${className ?? ''}`} dir="rtl">
      <span
        className={`font-black tracking-tight bg-linear-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent ${sizeClasses[size].logo}`}
      >
        JOY
      </span>
      {showSlogan && (
        <span
          className={`text-gray-500 dark:text-gray-400 tracking-wider ${sizeClasses[size].slogan} font-medium mt-0.5`}
        >
          إلعب وتعلم
        </span>
      )}
    </div>
  );
}

export default JoyLogo;
