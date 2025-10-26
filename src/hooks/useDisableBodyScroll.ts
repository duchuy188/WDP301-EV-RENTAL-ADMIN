import { useEffect } from 'react';

/**
 * Custom hook to disable body scroll when modal/overlay is open
 * Prevents scrolling of background content while modal is displayed
 * 
 * @param isOpen - Boolean indicating if the modal is open
 */
function useDisableBodyScroll(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // Get original values
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Disable scroll on body
      document.body.style.overflow = 'hidden';
      
      // Add padding to prevent layout shift when scrollbar disappears
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      // Cleanup function to restore scroll when modal closes
      return () => {
        // Restore original styles
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);
}

export default useDisableBodyScroll;

