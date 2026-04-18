import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../common';
import styles from './Dropdown.module.css';

interface DropdownOption {
  id: string;
  name: string;
  icon?: string;
  isAction?: boolean;  // Special action option (e.g., "Configure new...")
  isDivider?: boolean;  // Divider line
}

interface DropdownProps {
  trigger: React.ReactNode;
  options: DropdownOption[];
  value: string;
  onChange: (id: string) => void;
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  options,
  value,
  onChange,
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.trigger} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      <div className={`${styles.menu} ${isOpen ? styles.open : ''} ${styles[align]}`}>
        {options.map((option, index) => {
          if (option.isDivider) {
            return <div key={`divider-${index}`} className={styles.divider} />;
          }
          return (
            <div
              key={option.id}
              className={`${styles.item} ${option.id === value ? styles.active : ''} ${option.isAction ? styles.action : ''}`}
              onClick={() => handleSelect(option.id)}
            >
              {option.icon && <Icon name={option.icon} />}
              <span>{option.name}</span>
              {option.id === value && !option.isAction && (
                <Icon name="check" className={styles.checkIcon} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
