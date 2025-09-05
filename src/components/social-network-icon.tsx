import { SocialNetwork } from '@/lib/types';

interface SocialNetworkIconProps {
  network: SocialNetwork;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SocialNetworkIcon({ network, size = 'md', className = '' }: SocialNetworkIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const getNetworkData = (network: SocialNetwork) => {
    switch (network) {
      case 'LinkedIn':
        return {
          icon: '💼',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'Instagram':
        return {
          icon: '📷',
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
        };
      case 'YouTube':
        return {
          icon: '🎥',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      case 'Facebook':
        return {
          icon: '👥',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
        };
      case 'Pinterest':
        return {
          icon: '📌',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
        };
      case 'TikTok':
        return {
          icon: '🎵',
          color: 'text-black',
          bgColor: 'bg-gray-50',
        };
      default:
        return {
          icon: '📱',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const networkData = getNetworkData(network);

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${networkData.bgColor} 
        ${networkData.color}
        rounded-lg flex items-center justify-center text-lg
        ${className}
      `}
    >
      {networkData.icon}
    </div>
  );
}
