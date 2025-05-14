/**
 * 根据代码内容尝试识别编程语言
 * @param code 要识别的代码内容
 * @returns 识别到的语言标识符，如果无法识别则返回默认值'javascript'
 */
export function detectLanguage(code: string): string {
  if (!code || typeof code !== 'string') return 'javascript';
  
  const cleanCode = code.trim();
  
  // 检测Python
  if (
    cleanCode.includes('def ') || 
    cleanCode.includes('import ') && cleanCode.includes(':') ||
    cleanCode.includes('from ') && cleanCode.includes(' import ') ||
    cleanCode.includes('print(') ||
    /^([ \t]*)for.*in.*:/.test(cleanCode) ||
    /^([ \t]*)if.*:/.test(cleanCode) ||
    /^([ \t]*)class.*:/.test(cleanCode)
  ) {
    return 'python';
  }
  
  // 检测HTML
  if (
    (cleanCode.includes('<html') || cleanCode.includes('<!DOCTYPE')) ||
    (cleanCode.includes('<div') && cleanCode.includes('</div>')) ||
    (cleanCode.includes('<p') && cleanCode.includes('</p>')) ||
    (cleanCode.includes('<span') && cleanCode.includes('</span>'))
  ) {
    return 'html';
  }
  
  // 检测CSS
  if (
    cleanCode.includes('{') && 
    cleanCode.includes('}') && 
    (cleanCode.includes(':') && !cleanCode.includes('?:')) &&
    (cleanCode.includes(';') || /[^;"\]]\s*\n/.test(cleanCode)) &&
    (cleanCode.match(/{/g) || []).length === (cleanCode.match(/}/g) || []).length
  ) {
    return 'css';
  }
  
  // 检测SQL
  if (
    /SELECT\s+.*\s+FROM/i.test(cleanCode) ||
    /INSERT\s+INTO/i.test(cleanCode) ||
    /UPDATE\s+.*\s+SET/i.test(cleanCode) ||
    /DELETE\s+FROM/i.test(cleanCode) ||
    /CREATE\s+TABLE/i.test(cleanCode)
  ) {
    return 'sql';
  }
  
  // 检测Java
  if (
    /public\s+class/i.test(cleanCode) ||
    /private\s+static/i.test(cleanCode) ||
    /protected\s+void/i.test(cleanCode) ||
    /import\s+java\./i.test(cleanCode) ||
    /package\s+[a-z0-9_\.]+;/i.test(cleanCode)
  ) {
    return 'java';
  }
  
  // 检测C++
  if (
    /#include\s+<[a-z0-9_]+>/i.test(cleanCode) ||
    /std::/i.test(cleanCode) ||
    /namespace\s+[a-z0-9_]+\s*{/i.test(cleanCode) ||
    /template\s*<.*>/i.test(cleanCode)
  ) {
    return 'cpp';
  }
  
  // 检测Go
  if (
    /package\s+main/i.test(cleanCode) ||
    /import\s+\(/i.test(cleanCode) ||
    /func\s+\([a-z]\s+\*?[A-Z][a-zA-Z0-9_]*\)/i.test(cleanCode) ||
    /func\s+[A-Z][a-zA-Z0-9_]*\s*\(/i.test(cleanCode)
  ) {
    return 'go';
  }
  
  // 检测Rust
  if (
    /fn\s+[a-z0-9_]+\s*\(/i.test(cleanCode) ||
    /let\s+mut\s+/i.test(cleanCode) ||
    /impl\s+/i.test(cleanCode) ||
    /use\s+std::/i.test(cleanCode)
  ) {
    return 'rust';
  }
  
  // 检测TypeScript
  if (
    /interface\s+[A-Z][a-zA-Z0-9_]*\s*\{/.test(cleanCode) ||
    /type\s+[A-Z][a-zA-Z0-9_]*\s*[=<]/.test(cleanCode) ||
    /:\s*(string|number|boolean|any)\s*[,;=){\[]/.test(cleanCode) ||
    /:\s*[A-Z][a-zA-Z0-9_]*\s*[,;=){\[]/.test(cleanCode) ||
    /import\s+[{]/.test(cleanCode) && /}\s+from\s+/.test(cleanCode)
  ) {
    return 'typescript';
  }
  
  // 检测JSON
  if (
    (cleanCode.startsWith('{') && cleanCode.endsWith('}')) ||
    (cleanCode.startsWith('[') && cleanCode.endsWith(']'))
  ) {
    try {
      JSON.parse(cleanCode);
      return 'json';
    } catch {
      // 不是有效的JSON，继续检测
    }
  }
  
  // 默认为JavaScript
  return 'javascript';
} 