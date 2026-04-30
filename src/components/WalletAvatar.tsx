import { useMemo } from 'react';
import { toSvg } from 'jdenticon';

interface WalletAvatarProps {
  publicKey: string;
  size?: number;
  className?: string;
}

export default function WalletAvatar({ publicKey, size = 32, className = '' }: WalletAvatarProps) {
  const svg = useMemo(() => {
    return toSvg(publicKey, size);
  }, [publicKey, size]);

  return (
    <div
      className={`inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ width: size, height: size }}
    />
  );
}