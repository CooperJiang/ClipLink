import { ClipboardItem } from "@/types/clipboard";

/**
 * 检查新内容是否已经存在于剪贴板历史记录中
 * @param newContent 新复制的内容
 * @param existingItems 现有剪贴板项目
 * @returns 如果内容已存在，返回true；否则返回false
 */
export const isContentDuplicate = (newContent: string, existingItems: ClipboardItem[]): boolean => {
  // 参数验证
  if (!newContent || !existingItems || existingItems.length === 0) {
    return false;
  }
  
  // 标准化内容，去除前后空格
  const normalizedNewContent = newContent.trim();
  
  // 空内容不视为重复
  if (normalizedNewContent === '') {
    return false;
  }
  
  // 精确匹配优先
  for (const item of existingItems) {
    try {
      // 如果内容完全相同（注意进行trim处理）
      if (item.content && item.content.trim() === normalizedNewContent) {
        return true;
      }
    } catch (error) {
      // 安静处理错误，继续检查下一个
    }
  }
  
  // 对于较长的内容，考虑检查部分匹配以避免轻微修改的文本被重复保存
  if (normalizedNewContent.length > 100) {
    const contentLower = normalizedNewContent.toLowerCase();
    
    for (const item of existingItems) {
      try {
        // 确保item.content存在且不为空
        if (!item.content) continue;
        
        const itemContentLower = item.content.trim().toLowerCase();
        
        // 检查是否有很高的相似度 (长度相近且内容包含关系)
        // 如果内容长度相近 (差异不超过10%)
        const lengthDiffRatio = Math.abs(contentLower.length - itemContentLower.length) / Math.max(contentLower.length, 1);
        
        if (lengthDiffRatio < 0.1) {
          // 检查是否有很高的文本包含率
          if (contentLower.includes(itemContentLower) || itemContentLower.includes(contentLower)) {
            return true;
          }
        }
      } catch (error) {
        // 安静处理错误，继续检查下一个
      }
    }
  }
  
  return false;
};

/**
 * 格式化剪贴板内容，用于显示
 * @param content 原始内容
 * @param maxLength 最大长度
 * @returns 格式化后的内容
 */
export const formatClipboardContent = (content: string, maxLength: number = 50): string => {
  if (!content) return '';
  
  // 如果内容太长，截断并添加省略号
  if (content.length > maxLength) {
    return content.substring(0, maxLength) + '...';
  }
  
  return content;
}; 