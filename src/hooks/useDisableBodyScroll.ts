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
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Disable scroll on body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Cleanup function to restore scroll when modal closes
      return () => {
        // Restore scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
}

export default useDisableBodyScroll;

