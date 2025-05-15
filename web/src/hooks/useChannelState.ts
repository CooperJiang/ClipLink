import { useState, useCallback, useEffect } from 'react';
import { useChannel } from '@/contexts/ChannelContext';

interface UseChannelStateProps {
  onChannelVerifiedChange?: (isVerified: boolean) => void;
}

interface UseChannelStateReturn {
  isChannelModalOpen: boolean;
  setIsChannelModalOpen: (isOpen: boolean) => void;
  handleCloseChannelModal: () => void;
  channelId: string | null;
  isChannelVerified: boolean;
  isChannelLoading: boolean;
}

export const useChannelState = ({
  onChannelVerifiedChange
}: UseChannelStateProps = {}): UseChannelStateReturn => {
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const { channelId, isChannelVerified, isLoading: isChannelLoading } = useChannel();
  
  // 处理通道状态变化
  useEffect(() => {
    if (!isChannelLoading) {
      if (!isChannelVerified) {
        setIsChannelModalOpen(true);
        
        if (onChannelVerifiedChange) {
          onChannelVerifiedChange(false);
        }
      } else {
        setIsChannelModalOpen(false);
        
        if (onChannelVerifiedChange) {
          onChannelVerifiedChange(true);
        }
      }
    }
  }, [isChannelLoading, isChannelVerified, onChannelVerifiedChange]);
  
  // 处理关闭通道模态框
  const handleCloseChannelModal = useCallback(() => {
    // 只有通道已验证才能关闭模态框
    if (isChannelVerified) {
      setIsChannelModalOpen(false);
    }
  }, [isChannelVerified]);
  
  return {
    isChannelModalOpen,
    setIsChannelModalOpen,
    handleCloseChannelModal,
    channelId,
    isChannelVerified,
    isChannelLoading
  };
}; 