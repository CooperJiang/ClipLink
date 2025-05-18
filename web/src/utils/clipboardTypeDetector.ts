import { ClipboardType } from '@/types/clipboard';

// 常见编程语言关键字
const CODE_KEYWORDS = [
  // JavaScript/TypeScript
  'function', 'const', 'let', 'var', 'import', 'export', 'class', 'interface', 'extends', 'implements',
  'return', 'if', 'else', 'switch', 'case', 'for', 'while', 'do', 'try', 'catch', 'async', 'await',
  // Python
  'def', 'import', 'from', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except',
  'lambda', 'with', 'as', 'yield', 'pass', 'break', 'continue',
  // Java/C#/C++
  'public', 'private', 'protected', 'static', 'void', 'int', 'string', 'bool', 'float', 'double',
  'new', 'this', 'super', 'null', 'true', 'false'
];

// 常见代码符号模式
const CODE_PATTERNS = [
  /\{\s*[\w\d_]+\s*:\s*[\w\d_"']+\s*\}/,  // JSON对象或字典 {key: value}
  /function\s*[\w\d_]*\s*\([\w\d_,\s]*\)\s*\{/,  // 函数定义 function foo() {
  /[\w\d_]+\s*=\s*function\s*\([\w\d_,\s]*\)\s*\{/, // 函数赋值 foo = function() {
  /const|let|var\s+[\w\d_]+\s*=/, // 变量声明 const foo =
  /if\s*\([\w\d_\s!=><&|]+\)\s*\{/, // if语句 if (condition) {
  /for\s*\([\w\d_\s;=<>]+\)\s*\{/, // for循环 for (i=0; i<10; i++) {
  /^\s*import\s+[\w\d_{}*\s]+\s+from\s+['"]/, // ES6 import
  /^\s*<[\w\d_]+[^>]*>[\s\S]*<\/[\w\d_]+>/, // HTML标签
  /class\s+[\w\d_]+(\s+extends\s+[\w\d_]+)?\s*\{/, // 类定义
  /^\s*@[\w\d_]+/, // 装饰器
  /^\s*#include/, // C/C++ include
  /^\s*#define/, // C/C++ 宏定义
  /^\s*package\s+[\w\d_.]+;/, // Java包声明
  /^\s*using\s+[\w\d_.]+;/, // C# using
  /^\s*SELECT\s+[\w\d_*]+\s+FROM\s+[\w\d_]+/i, // SQL查询
  /=[=>][\s{]/ // 箭头函数
];

// 密码相关关键字
const PASSWORD_KEYWORDS = [
  'password', 'pwd', 'passwd', 'pass', 'secret', 'key', 'token', 'api_key', 'apikey', 'sk-',
  'access_key', 'secret_key', 'credentials', 'auth', 'authentication', '密码', '口令', '秘钥', '验证码'
];

// 链接模式
const URL_PATTERN = /^(https?:\/\/)?[\w\d-]+(\.[\w\d-]+)+([\w\d.,@?^=%&:/~+#-]*[\w\d@?^=%&/~+#-])?$/;

/**
 * 检测剪贴板内容的类型
 * @param content 剪贴板内容
 * @returns 推测的内容类型
 */
export function detectClipboardType(content: string): ClipboardType {
  if (!content || typeof content !== 'string') {
    return ClipboardType.TEXT;
  }
  
  // 去除首尾空白
  const trimmedContent = content.trim();
  
  // 空内容当做普通文本
  if (!trimmedContent) {
    return ClipboardType.TEXT;
  }
  
  // 检测URL - 整行是否为URL
  if (URL_PATTERN.test(trimmedContent)) {
    return ClipboardType.LINK;
  }
  
  // 检测是否含有多个URL - 如果包含多个URL但不是纯URL可能是普通文本
  const urlMatches = trimmedContent.match(/(https?:\/\/[^\s]+)/g);
  if (urlMatches && urlMatches.length > 0) {
    // 如果URL占内容的大部分，视为链接类型
    const urlTotalLength = urlMatches.reduce((total, url) => total + url.length, 0);
    if (urlTotalLength / trimmedContent.length > 0.7) {
      return ClipboardType.LINK;
    }
  }
  
  // 检测代码
  // 1. 检查是否包含常见代码关键字
  const contentWords = trimmedContent.split(/[\s.,;:(){}[\]<>!?=+\-*/&|^%]+/);
  const codeKeywordCount = contentWords.filter(word => 
    CODE_KEYWORDS.includes(word.toLowerCase())
  ).length;
  
  // 如果关键字数量占比较高，很可能是代码
  if (codeKeywordCount >= 3 || (contentWords.length > 0 && codeKeywordCount / contentWords.length >= 0.15)) {
    return ClipboardType.CODE;
  }
  
  // 2. 检查是否匹配代码模式
  for (const pattern of CODE_PATTERNS) {
    if (pattern.test(trimmedContent)) {
      return ClipboardType.CODE;
    }
  }
  
  // 3. 检查缩进和换行符 - 代码通常有规律的缩进
  const lines = trimmedContent.split('\n');
  if (lines.length > 3) {
    const indentationPattern = /^(\s+)\S/;
    let indentedLines = 0;
    
    for (const line of lines) {
      if (indentationPattern.test(line)) {
        indentedLines++;
      }
    }
    
    // 如果超过30%的行有缩进，可能是代码
    if (indentedLines / lines.length > 0.3) {
      return ClipboardType.CODE;
    }
  }
  
  // 检测密码或敏感信息
  // 1. 检查是否包含密码相关关键字
  for (const keyword of PASSWORD_KEYWORDS) {
    if (
      trimmedContent.toLowerCase().includes(keyword.toLowerCase()) ||
      // 检查常见的密码格式，如 "password: xxx" 或 "password=xxx"
      new RegExp(`${keyword}[\\s]*[:=][\\s]*[\\w\\d@#$%^&*()-+=]+`, 'i').test(trimmedContent)
    ) {
      return ClipboardType.PASSWORD;
    }
  }
  
  // 2. 检查是否看起来像API密钥
  if (/\b[A-Za-z0-9_-]{20,}\b/.test(trimmedContent) || // 至少20个字符的连续字母数字字符
      /sk-[A-Za-z0-9]{20,}/.test(trimmedContent) ||    // OpenAI密钥格式
      /gh[pousr]_[A-Za-z0-9]{16,}/.test(trimmedContent) // GitHub令牌格式
  ) {
    return ClipboardType.PASSWORD;
  }
  
  // 默认为普通文本
  return ClipboardType.TEXT;
}

/**
 * 获取剪贴板类型的中文名称
 */
export function getClipboardTypeName(type: ClipboardType): string {
  switch (type) {
    case ClipboardType.TEXT:
      return '文本';
    case ClipboardType.LINK:
      return '链接';
    case ClipboardType.CODE:
      return '代码';
    case ClipboardType.PASSWORD:
      return '密码';
    case ClipboardType.IMAGE:
      return '图片';
    default:
      return '文本';
  }
} 