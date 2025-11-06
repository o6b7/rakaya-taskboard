import React, { useState } from "react";
import { User } from "lucide-react";

interface AvatarProps {
  name?: string;
  avatar?: string | null;
  size?: number;
}

const Avatar: React.FC<AvatarProps> = ({
  name = "User",
  avatar,
  size = 40,
}) => {
  const [imgError, setImgError] = useState(false);

  const showDefault = !avatar || imgError;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {showDefault ? (
        <div
          className={`w-full h-full rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center text-gray-500 dark:text-dark-muted`}
        >
          <User className={`${size * 0.6}px ${size * 0.6}px`} />
        </div>
      ) : (
        <img
          src={avatar}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full rounded-full object-cover"
        />
      )}

      {/* Online indicator */}
        <span
          className="absolute bottom-0 right-0 w-3 h-3 flex items-center justify-center"
        >
          <span className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          </span>
        </span>
    </div>
  );
};

export default Avatar;
