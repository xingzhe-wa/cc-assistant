import React from 'react';

interface IconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  className = '',
  onClick
}) => {
  const sizeClass = {
    xs: 'material-icons-round xs',
    sm: 'material-icons-round sm',
    md: 'material-icons-round',
    lg: 'material-icons-round lg'
  }[size];

  return (
    <span
      className={`${sizeClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {name}
    </span>
  );
};
