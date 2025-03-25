import { useRef, useEffect } from 'react';

interface ProjectDropdownProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
}

const ProjectDropdown = ({ projectId, isOpen, onClose, position }: ProjectDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleCopyLink = () => {
    const projectUrl = `${window.location.origin}/${projectId}`;
    navigator.clipboard.writeText(projectUrl)
      .then(() => {
        // You could add a toast notification here
        console.log('Link copied to clipboard');
      })
      .catch((error) => {
        console.error('Failed to copy link:', error);
      });
    onClose();
  };

  const handleSaveProject = () => {
    // Implement save project functionality here
    console.log('Save project clicked for:', projectId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 w-48"
      style={{ top: position.top, left: position.left }}
    >
      <button
        onClick={handleCopyLink}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy Link
      </button>
      <button
        onClick={handleSaveProject}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Save Project
      </button>
    </div>
  );
};

export default ProjectDropdown;