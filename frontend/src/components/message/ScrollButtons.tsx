import React from 'react';
import { Icon } from '../common';
import styles from './ScrollButtons.module.css';

interface ScrollButtonsProps {
  showUp: boolean;
  showDown: boolean;
  visible: boolean;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

export const ScrollButtons: React.FC<ScrollButtonsProps> = ({
  showUp,
  showDown,
  visible,
  onScrollUp,
  onScrollDown,
}) => {
  if (!showUp && !showDown) return null;

  return (
    <div className={`${styles.wrapper} ${visible ? styles.visible : ''}`}>
      {showUp && (
        <button className={styles.btn} onClick={onScrollUp} title="Scroll to top">
          <Icon name="keyboard_arrow_up" size="sm" />
        </button>
      )}
      {showDown && (
        <button className={styles.btn} onClick={onScrollDown} title="Scroll to bottom">
          <Icon name="keyboard_arrow_down" size="sm" />
        </button>
      )}
    </div>
  );
};
