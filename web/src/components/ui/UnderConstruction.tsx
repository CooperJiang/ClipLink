import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHammer, faToolbox } from '@fortawesome/free-solid-svg-icons';

interface UnderConstructionProps {
  title: string;
  description?: string;
}

export default function UnderConstruction({ title, description = '功能正在开发中，敬请期待...' }: UnderConstructionProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="mb-4 text-gray-400 flex items-center">
        <FontAwesomeIcon icon={faHammer} className="text-4xl mr-2 animate-bounce" />
        <FontAwesomeIcon icon={faToolbox} className="text-4xl" />
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md">{description}</p>
      <div className="mt-6 bg-gray-100 p-4 rounded-lg text-sm text-gray-600 max-w-md">
        <p className="mb-2">感谢您的关注！</p>
        <p>我们正在努力开发此功能，您的反馈对我们很重要。</p>
        <p className="mt-2">
          <a 
            href="https://github.com/CooperJiang/ClipLink" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            欢迎在GitHub上提出建议或参与贡献
          </a>
        </p>
      </div>
    </div>
  );
} 