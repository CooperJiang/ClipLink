// 全局变量
const deviceId = localStorage.getItem('deviceId');
let currentClipboardContent = '';
let isMonitoring = false;
let monitoringInterval = null;

// DOM元素
const currentClipboardEl = document.getElementById('current-clipboard');
const clipboardHistoryEl = document.getElementById('clipboard-history');
const copyBtn = document.getElementById('copy-btn');
const refreshBtn = document.getElementById('refresh-btn');

// 初始化
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        await fetchLatestClipboard();
        await fetchClipboardHistory();
        
        // 不再自动开始监控剪贴板
        if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
            // 添加授权按钮
            addClipboardPermissionButton();
        } else {
            showNotification('此浏览器不支持自动剪贴板同步', 'error');
        }
        
        setupEventListeners();
    } catch (err) {
        console.error('初始化失败:', err);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 复制按钮
    copyBtn.addEventListener('click', async () => {
        try {
            // 使用新的复制函数，它会处理通知
            await copyToClipboard(currentClipboardContent);
        } catch (err) {
            console.error('复制到剪贴板失败:', err);
        }
    });
    
    // 刷新按钮
    refreshBtn.addEventListener('click', async () => {
        await fetchLatestClipboard();
        await fetchClipboardHistory();
    });
    
    // 监听粘贴事件
    document.addEventListener('paste', async (e) => {
        const text = e.clipboardData.getData('text/plain');
        if (text && text !== currentClipboardContent) {
            await saveClipboardContent(text);
        }
    });
}

// 开始监控剪贴板
function startClipboardMonitoring() {
    if (isMonitoring) return;
    
    isMonitoring = true;
    monitoringInterval = setInterval(checkClipboard, 2000);
}

// 停止监控剪贴板
function stopClipboardMonitoring() {
    if (!isMonitoring) return;
    
    isMonitoring = false;
    clearInterval(monitoringInterval);
}

// 检查剪贴板变化
async function checkClipboard() {
    // 如果文档不可见或没有焦点，不尝试读取剪贴板
    if (document.hidden || !document.hasFocus()) {
        console.log('文档不可见或无焦点，跳过剪贴板检查');
        return;
    }
    
    try {
        // 确保文档有焦点并添加一点延迟
        window.focus();
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const text = await navigator.clipboard.readText();
        if (text && text !== currentClipboardContent) {
            await saveClipboardContent(text);
        }
    } catch (err) {
        console.error('读取剪贴板失败:', err);
        
        // 根据错误类型处理
        if (err.name === 'NotAllowedError') {
            console.log('剪贴板权限被拒绝，停止监控');
            // 出错时停止监控
            stopClipboardMonitoring();
            showNotification('无法读取剪贴板，请检查浏览器权限', 'error');
        } else if (err.message && err.message.includes('Document is not focused')) {
            console.log('文档无焦点，暂停一次检查');
            // 不做任何处理，等待下一次有焦点时再检查
        } else {
            // 其他错误，停止监控
            stopClipboardMonitoring();
            showNotification('剪贴板访问出错，已停止自动同步', 'error');
        }
    }
}

// 获取最新的剪贴板内容
async function fetchLatestClipboard() {
    try {
        currentClipboardEl.innerHTML = '<div class="flex justify-center"><div class="loading"></div></div>';
        
        const response = await fetch('/api/clipboard');
        if (!response.ok) throw new Error('获取剪贴板失败');
        
        const data = await response.json();
        if (data && data.content) {
            currentClipboardContent = data.content;
            displayCurrentClipboard(data);
        } else {
            currentClipboardEl.innerHTML = '<p class="text-gray-400 italic">没有剪贴板内容</p>';
        }
    } catch (err) {
        console.error('获取最新剪贴板失败:', err);
        currentClipboardEl.innerHTML = '<p class="text-red-500">获取剪贴板内容失败</p>';
    }
}

// 获取剪贴板历史
async function fetchClipboardHistory() {
    try {
        clipboardHistoryEl.innerHTML = '<div class="flex justify-center"><div class="loading"></div></div>';
        
        const response = await fetch('/api/clipboard/history?limit=10');
        if (!response.ok) throw new Error('获取历史记录失败');
        
        const data = await response.json();
        if (data && data.length > 0) {
            displayClipboardHistory(data);
        } else {
            clipboardHistoryEl.innerHTML = '<p class="text-gray-400 italic">没有历史记录</p>';
        }
    } catch (err) {
        console.error('获取剪贴板历史失败:', err);
        clipboardHistoryEl.innerHTML = '<p class="text-red-500">获取历史记录失败</p>';
    }
}

// 保存剪贴板内容
async function saveClipboardContent(content) {
    try {
        const response = await fetch('/api/clipboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                type: 'text',
                device_id: deviceId
            })
        });
        
        if (!response.ok) throw new Error('保存剪贴板失败');
        
        currentClipboardContent = content;
        await fetchLatestClipboard();
        await fetchClipboardHistory();
        
        showNotification('剪贴板内容已同步');
    } catch (err) {
        console.error('保存剪贴板内容失败:', err);
        showNotification('同步剪贴板内容失败', 'error');
    }
}

// 删除剪贴板项目
async function deleteClipboardItem(id) {
    try {
        const response = await fetch(`/api/clipboard/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('删除失败');
        
        await fetchClipboardHistory();
        showNotification('已删除');
    } catch (err) {
        console.error('删除剪贴板项目失败:', err);
        showNotification('删除失败', 'error');
    }
}

// 显示当前剪贴板内容
function displayCurrentClipboard(data) {
    currentClipboardEl.innerHTML = `
        <div class="content-display text-gray-800">${escapeHTML(data.content)}</div>
        <div class="text-xs text-gray-500 mt-2">
            ${formatDate(new Date(data.created_at))} | 来自: ${shortenDeviceId(data.device_id)}
        </div>
    `;
}

// 显示剪贴板历史
function displayClipboardHistory(items) {
    const html = items.map(item => `
        <div class="clipboard-item p-3 border border-gray-200 rounded bg-gray-50 relative">
            <div class="content-display text-gray-800">${escapeHTML(item.content)}</div>
            <div class="flex justify-between items-center mt-2">
                <div class="text-xs text-gray-500">
                    ${formatDate(new Date(item.created_at))} | 来自: ${shortenDeviceId(item.device_id)}
                </div>
                <div class="flex space-x-2">
                    <button class="text-blue-500 hover:text-blue-700 text-sm" 
                            onclick="copyToClipboard('${escapeJS(item.content)}')">
                        复制
                    </button>
                    <button class="delete-btn text-red-500 hover:text-red-700 text-sm" 
                            onclick="deleteClipboardItem('${item.id}')">
                        删除
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    clipboardHistoryEl.innerHTML = html;
}

// 复制内容到剪贴板
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        
        // 添加成功提示
        showNotification('内容已复制到剪贴板', 'success');
        return true;
    } catch (err) {
        console.error('复制到剪贴板失败:', err);
        showNotification('复制失败，请手动复制', 'error');
        return false;
    }
}

// 显示通知
function showNotification(message, type = 'success') {
    // 移除现有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        document.body.removeChild(existingNotification);
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    
    // 设置样式
    let bgColor = 'bg-green-500';
    if (type === 'error') {
        bgColor = 'bg-red-500';
    } else if (type === 'warning') {
        bgColor = 'bg-yellow-500';
    } else if (type === 'info') {
        bgColor = 'bg-blue-500';
    }
    
    notification.className = `notification ${bgColor}`;
    notification.textContent = message;
    
    // 添加到文档
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动关闭
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 格式化日期
function formatDate(date) {
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

// 数字补零
function padZero(num) {
    return num.toString().padStart(2, '0');
}

// 缩短设备ID显示
function shortenDeviceId(id) {
    return id.substring(0, 8);
}

// 转义HTML内容
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 转义JavaScript字符串
function escapeJS(text) {
    return text.replace(/"/g, '\\"').replace(/'/g, "\\'");
}

// 将函数暴露到全局作用域
window.copyToClipboard = copyToClipboard;
window.deleteClipboardItem = deleteClipboardItem;

// 添加剪贴板授权按钮
function addClipboardPermissionButton() {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'clipboard-control-buttons';
    buttonsContainer.className = 'mb-4 space-y-2';
    
    // 添加授权按钮
    const permButton = document.createElement('button');
    permButton.id = 'enable-clipboard-btn';
    permButton.className = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full';
    permButton.textContent = '授权剪贴板访问';
    
    // 将按钮添加到容器
    buttonsContainer.appendChild(permButton);
    
    // 插入到当前剪贴板内容区域之前
    currentClipboardEl.parentNode.insertBefore(buttonsContainer, currentClipboardEl);
    
    // 添加点击事件
    permButton.addEventListener('click', async () => {
        try {
            // 请求授权
            showNotification('正在请求剪贴板权限...', 'info');
            
            // 确保文档有焦点
            window.focus();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 尝试读取剪贴板 - 这会触发权限请求
            await navigator.clipboard.readText();
            
            // 如果成功，开始监控
            showNotification('已获取剪贴板权限', 'success');
            startClipboardMonitoring();
            
            // 移除授权按钮
            permButton.remove();
            
            // 添加读取剪贴板按钮
            addReadClipboardButton(buttonsContainer);
        } catch (err) {
            console.error('权限请求失败:', err);
            showNotification('无法获取剪贴板权限，请检查浏览器设置', 'error');
        }
    });
}

// 添加读取剪贴板按钮
function addReadClipboardButton(container) {
    const readButton = document.createElement('button');
    readButton.id = 'read-clipboard-btn';
    readButton.className = 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full flex items-center justify-center';
    readButton.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        读取剪贴板内容
    `;
    
    // 将按钮添加到指定容器
    container.appendChild(readButton);
    
    // 添加点击事件
    readButton.addEventListener('click', async () => {
        try {
            showNotification('正在读取剪贴板...', 'info');
            
            // 确保文档有焦点
            window.focus();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 读取剪贴板
            const text = await navigator.clipboard.readText();
            
            if (text) {
                if (text !== currentClipboardContent) {
                    await saveClipboardContent(text);
                    showNotification('剪贴板内容已同步', 'success');
                } else {
                    showNotification('剪贴板内容没有变化', 'info');
                }
            } else {
                showNotification('剪贴板为空', 'warning');
            }
        } catch (err) {
            console.error('读取剪贴板失败:', err);
            showNotification('无法读取剪贴板，请重新授权', 'error');
        }
    });
} 