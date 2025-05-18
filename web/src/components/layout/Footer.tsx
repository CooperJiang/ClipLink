import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fixed bottom-1 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 rounded-full px-3 py-1.5 text-xs text-gray-500 shadow-sm border border-gray-200 hidden md:flex items-center z-10">
      <div className="mr-2">
        &copy; {currentYear} ClipLink
      </div>
      <a 
        href="https://github.com/CooperJiang/ClipLink" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center hover:text-gray-700 transition-colors"
      >
        <FontAwesomeIcon icon={faGithub} className="text-base mr-1" />
        <span>开源项目</span>
      </a>
    </footer>
  );
} 