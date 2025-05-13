// 全局变量
const deviceId = localStorage.getItem('deviceId') || createAndStoreDeviceId();
let currentClipboardContent = '';
let isMonitoring = false;
let monitoringInterval = null;
let hasClipboardPermission = false; // 默认设为false，要求用户主动授权

// DOM元素
const currentClipboardEl = document.getElementById('current-clipboard');
const clipboardHistoryEl = document.getElementById('clipboard-history');
const copyBtn = document.getElementById('copy-btn');
const editBtn = document.getElementById('edit-btn');
const refreshBtn = document.getElementById('refresh-btn');
const editModal = document.getElementById('edit-modal');
const editTitleInput = document.getElementById('edit-title');
const editContentInput = document.getElementById('edit-content');
const editFavoriteCheckbox = document.getElementById('edit-favorite');
const editItemIdInput = document.getElementById('edit-item-id');
const saveEditBtn = document.getElementById('save-edit-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// 初始化
document.addEventListener('DOMContentLoaded', init);

// 创建并存储设备ID
function createAndStoreDeviceId() {
    const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', newId);
    return newId;
}

// 存储剪贴板权限状态
function setClipboardPermission(hasPermission) {
    hasClipboardPermission = hasPermission;
    localStorage.setItem('clipboardPermission', hasPermission ? 'true' : 'false');
}

async function init() {
    console.log("应用初始化中...");
    
    try {
        // 首先获取数据
        await fetchLatestClipboard();
        await fetchClipboardHistory();
        
        // 然后创建授权界面（确保在数据加载后创建UI）
        createPermissionUI();
        
        // 设置事件监听器
        setupEventListeners();
        
        // 检查剪贴板API可用性
        if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
            console.log("剪贴板API可用");
            updatePermissionStatus(false, "点击授权");
        } else {
            console.log("剪贴板API不可用");
            showNotification("此浏览器不支持自动剪贴板功能，请使用手动模式", "warning");
            updatePermissionStatus(false, "不支持");
            togglePermissionUI(false);
            addManualPasteInterface();
        }
    } catch (error) {
        console.error("初始化失败:", error);
        showNotification("应用初始化失败，请刷新页面", "error");
    }
}

// 创建授权界面
function createPermissionUI() {
    // 如果已存在授权容器，则移除它，以确保重新创建
    const existingPermContainer = document.getElementById('permission-container');
    if (existingPermContainer) {
        existingPermContainer.remove();
    }
    
    // 创建授权模式容器
    const permContainer = document.createElement('div');
    permContainer.id = 'permission-container';
    permContainer.className = 'bg-white rounded-lg shadow-md p-6 mb-6';
    permContainer.style.display = 'block'; // 确保可见
    permContainer.innerHTML = `
        <div class="text-center">
            <div class="mb-4">
                <svg class="h-16 w-16 mx-auto text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            <h2 class="text-xl font-semibold mb-2">需要剪贴板访问权限</h2>
            <p class="text-gray-600 mb-6">为了实现跨设备剪贴板同步，我们需要获取您的剪贴板访问权限</p>
            
            <div class="flex flex-col space-y-4">
                <button id="grant-permission-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg text-lg font-medium">
                    授权剪贴板访问
                </button>
                <div class="text-sm text-gray-500">或者</div>
                <button id="use-manual-mode-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg">
                    使用手动粘贴模式
                </button>
            </div>
            
            <div class="mt-6 text-sm text-gray-500">
                <p>剪贴板自动同步功能需要浏览器权限才能工作</p>
                <p>您随时可以在设置中取消此权限</p>
            </div>
        </div>
    `;
    
    // 找到正确的插入点 - main元素的第一个子元素
    const mainContainer = document.querySelector('main');
    if (mainContainer && mainContainer.firstChild) {
        mainContainer.insertBefore(permContainer, mainContainer.firstChild);
        console.log("授权UI已添加到页面");
    } else {
        // 备选方案 - 插入到body
        console.warn("找不到main容器，尝试添加到body");
        document.body.insertBefore(permContainer, document.body.firstChild);
    }
    
    // 添加授权按钮事件
    const grantPermBtn = document.getElementById('grant-permission-btn');
    if (grantPermBtn) {
        grantPermBtn.addEventListener('click', () => {
            try {
                requestClipboardPermission();
            } catch (err) {
                console.error("授权过程中发生错误:", err);
                showNotification("授权过程出错，请重试", "error");
            }
        });
    } else {
        console.error("找不到授权按钮元素");
    }
    
    // 添加手动模式按钮事件
    const manualModeBtn = document.getElementById('use-manual-mode-btn');
    if (manualModeBtn) {
        manualModeBtn.addEventListener('click', () => {
            // 隐藏授权容器
            togglePermissionUI(false);
            // 显示手动粘贴界面
            addManualPasteInterface();
        });
    } else {
        console.error("找不到手动模式按钮元素");
    }
    
    return permContainer;
}

// 请求剪贴板权限
async function requestClipboardPermission() {
    try {
        showNotification('正在请求剪贴板权限...', 'info');
        
        // 创建一个用户交互按钮来触发剪贴板API
        // 这样可以帮助浏览器识别这是用户发起的操作
        const interactionPrompt = document.createElement('div');
        interactionPrompt.style.position = 'fixed';
        interactionPrompt.style.top = '0';
        interactionPrompt.style.left = '0';
        interactionPrompt.style.width = '100%';
        interactionPrompt.style.height = '100%';
        interactionPrompt.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        interactionPrompt.style.display = 'flex';
        interactionPrompt.style.justifyContent = 'center';
        interactionPrompt.style.alignItems = 'center';
        interactionPrompt.style.zIndex = '9999';
        
        // 创建提示框
        const promptBox = document.createElement('div');
        promptBox.style.backgroundColor = 'white';
        promptBox.style.padding = '30px';
        promptBox.style.borderRadius = '8px';
        promptBox.style.maxWidth = '400px';
        promptBox.style.textAlign = 'center';
        
        promptBox.innerHTML = `
            <h2 style="font-size: 20px; margin-bottom: 20px; font-weight: bold;">请点击下方按钮授权剪贴板</h2>
            <p style="margin-bottom: 20px;">浏览器需要您的明确点击操作才能授予剪贴板访问权限</p>
            <button id="direct-permission-btn" style="background-color: #3B82F6; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">授权访问剪贴板</button>
        `;
        
        interactionPrompt.appendChild(promptBox);
        document.body.appendChild(interactionPrompt);
        
        // 创建一个Promise，在用户点击按钮时解析
        const userInteraction = new Promise((resolve) => {
            document.getElementById('direct-permission-btn').addEventListener('click', async () => {
                try {
                    // 尝试读取剪贴板
                    const text = await navigator.clipboard.readText();
                    resolve(text);
                } catch (err) {
                    resolve(null); // 即使失败也要解析Promise
                } finally {
                    // 移除交互提示
                    document.body.removeChild(interactionPrompt);
                }
            });
        });
        
        // 等待用户交互
        const text = await userInteraction;
        
        if (text !== null) {
            // 授权成功
            setClipboardPermission(true);
            
            // 更新UI状态
            updatePermissionStatus(true);
            showNotification('已获取剪贴板访问权限', 'success');
            
            // 隐藏授权UI，显示手动粘贴界面
            togglePermissionUI(false);
            addManualPasteInterface();
            
            // 如果获取到内容，尝试保存
            if (text && text !== currentClipboardContent) {
                await saveClipboardContent(text);
            }
        } else {
            throw new Error('用户取消或权限被拒绝');
        }
    } catch (err) {
        console.error('剪贴板权限请求失败:', err);
        setClipboardPermission(false);
        
        // 针对不同错误类型提供不同的提示
        if (err.name === 'NotAllowedError') {
            updatePermissionStatus(false, '权限被拒绝');
            showNotification('浏览器拒绝了剪贴板访问权限', 'error');
        } else {
            updatePermissionStatus(false, '授权失败');
            showNotification('无法获取剪贴板权限，请使用手动模式', 'error');
        }
    }
}

// 切换授权UI的显示状态
function togglePermissionUI(show = true) {
    const permContainer = document.getElementById('permission-container');
    if (permContainer) {
        permContainer.style.display = show ? 'block' : 'none';
    }
}

// 更新权限状态UI
function updatePermissionStatus(hasPermission, statusText) {
    const statusIndicator = document.getElementById('permission-status');
    if (statusIndicator) {
        if (hasPermission) {
            statusIndicator.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
            statusIndicator.innerHTML = '<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>自动同步';
        } else {
            statusIndicator.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
            statusIndicator.innerHTML = `<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>${statusText || '手动模式'}`;
        }
    }
}

// 添加手动粘贴界面
function addManualPasteInterface() {
    // 检查是否已经存在手动粘贴界面
    if (document.getElementById('manual-paste-container')) {
        return; // 如果已存在则不重复创建
    }
    
    // 创建手动粘贴界面
    const manualPasteContainer = document.createElement('div');
    manualPasteContainer.id = 'manual-paste-container';
    manualPasteContainer.className = 'bg-blue-50 border border-blue-200 rounded p-4 mb-4';
    manualPasteContainer.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="ml-3 flex-grow">
                <div class="flex justify-between items-center">
                    <h3 class="text-sm font-medium text-blue-800">剪贴板同步</h3>
                    <span id="permission-status" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        ${hasClipboardPermission ? '自动同步' : '手动模式'}
                    </span>
                </div>
                <div class="mt-1 text-sm text-blue-700">
                    ${hasClipboardPermission 
                        ? '自动同步已启用，可随时读取剪贴板内容' 
                        : '您可以手动粘贴内容或尝试获取剪贴板权限'}
                </div>
                <div class="mt-2">
                    ${!hasClipboardPermission ? `
                        <button id="read-clipboard-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm w-full mb-2">
                            授权并读取系统剪贴板内容
                        </button>
                    ` : ''}
                    <div class="mt-2">
                        <textarea id="manual-paste-textarea" placeholder="在此粘贴内容..." class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2"></textarea>
                        <button id="manual-paste-btn" class="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm w-full">
                            同步手动粘贴的内容
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    currentClipboardEl.parentNode.insertBefore(manualPasteContainer, currentClipboardEl);
    
    // 设置"读取剪贴板"按钮事件 (如果存在)
    const readClipboardBtn = document.getElementById('read-clipboard-btn');
    if (readClipboardBtn) {
        readClipboardBtn.addEventListener('click', requestClipboardPermission);
    }
    
    // 设置手动粘贴按钮事件
    const manualPasteBtn = document.getElementById('manual-paste-btn');
    const manualPasteTextarea = document.getElementById('manual-paste-textarea');
    
    if (manualPasteBtn && manualPasteTextarea) {
        manualPasteBtn.addEventListener('click', () => {
            // 确保正确获取textarea值
            const text = manualPasteTextarea instanceof HTMLTextAreaElement 
                ? manualPasteTextarea.value.trim() 
                : '';
            
            if (text) {
                saveClipboardContent(text);
                // 确保正确设置textarea值
                if (manualPasteTextarea instanceof HTMLTextAreaElement) {
                    manualPasteTextarea.value = ''; // 清空输入框
                }
            } else {
                showNotification('请先输入内容', 'warning');
                if (manualPasteTextarea instanceof HTMLTextAreaElement) {
                    manualPasteTextarea.focus();
                }
            }
        });
    }
}

// 设置事件监听器
function setupEventListeners() {
    console.log("设置事件监听器");
    
    // 复制按钮
    console.log("设置复制按钮事件");
    copyBtn.addEventListener('click', async () => {
        try {
            // 使用新的复制函数，它会处理通知
            await copyToClipboard(currentClipboardContent);
        } catch (err) {
            console.error('复制到剪贴板失败:', err);
        }
    });
    
    // 编辑按钮
    console.log("设置编辑按钮事件");
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            console.log("点击了编辑按钮");
            openEditModalForCurrentItem();
        });
    } else {
        console.error("编辑按钮未找到!");
    }
    
    // 刷新按钮
    console.log("设置刷新按钮事件");
    refreshBtn.addEventListener('click', async () => {
        await fetchLatestClipboard();
        await fetchClipboardHistory();
    });
    
    // 编辑模态框关闭按钮
    console.log("设置模态框关闭按钮事件");
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeEditModal);
    } else {
        console.error("模态框关闭按钮未找到!");
    }
    
    // 保存编辑按钮
    console.log("设置保存编辑按钮事件");
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', saveEdit);
    } else {
        console.error("保存编辑按钮未找到!");
    }
    
    // 点击模态框背景关闭模态框
    console.log("设置模态框背景点击事件");
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                closeEditModal();
            }
        });
    } else {
        console.error("编辑模态框未找到!");
    }
    
    // 监听粘贴事件 - 全局粘贴
    console.log("设置全局粘贴事件监听");
    document.addEventListener('paste', async (e) => {
        const text = e.clipboardData.getData('text/plain');
        if (text && text !== currentClipboardContent) {
            await saveClipboardContent(text);
        }
    });
    
    // 监听焦点变化，当窗口获得焦点时尝试读取剪贴板（仅当已获得权限时）
    console.log("设置窗口焦点变化事件监听");
    window.addEventListener('focus', async () => {
        if (hasClipboardPermission) {
            try {
                // 增加小延迟确保焦点已完全获取
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const text = await navigator.clipboard.readText();
                if (text && text !== currentClipboardContent) {
                    await saveClipboardContent(text);
                }
            } catch (err) {
                console.log('窗口获得焦点，但无法读取剪贴板:', err);
                setClipboardPermission(false);
                updatePermissionStatus(false, '权限已失效');
            }
        }
    });
    
    console.log("事件监听器设置完成");
}

// 获取最新的剪贴板内容
async function fetchLatestClipboard() {
    try {
        currentClipboardEl.innerHTML = '<div class="flex justify-center"><div class="loading"></div></div>';
        
        const response = await fetch('/api/clipboard');
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `服务器返回错误: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.content) {
            currentClipboardContent = data.content;
            displayCurrentClipboard(data);
        } else {
            currentClipboardEl.innerHTML = '<p class="text-gray-400 italic">没有剪贴板内容</p>';
        }
    } catch (err) {
        console.error('获取最新剪贴板失败:', err);
        currentClipboardEl.innerHTML = `<p class="text-red-500">获取剪贴板内容失败: ${err.message || '未知错误'}</p>`;
    }
}

// 获取剪贴板历史
async function fetchClipboardHistory() {
    try {
        clipboardHistoryEl.innerHTML = '<div class="flex justify-center"><div class="loading"></div></div>';
        
        const response = await fetch('/api/clipboard/history?limit=10');
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `服务器返回错误: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.length > 0) {
            displayClipboardHistory(data);
        } else {
            clipboardHistoryEl.innerHTML = '<p class="text-gray-400 italic">没有历史记录</p>';
        }
    } catch (err) {
        console.error('获取剪贴板历史失败:', err);
        clipboardHistoryEl.innerHTML = `<p class="text-red-500">获取历史记录失败: ${err.message || '未知错误'}</p>`;
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
                device_id: deviceId,
                title: '' // 添加默认空标题，确保字段存在
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `服务器返回错误: ${response.status}`);
        }
        
        // 保存成功后更新界面
        currentClipboardContent = content;
        await fetchLatestClipboard();
        await fetchClipboardHistory();
        
        showNotification('剪贴板内容已同步');
    } catch (err) {
        console.error('保存剪贴板内容失败:', err);
        showNotification(`同步失败: ${err.message || '未知错误'}`, 'error');
    }
}

// 删除剪贴板项目
async function deleteClipboardItem(id) {
    try {
        const response = await fetch(`/api/clipboard/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `服务器返回错误: ${response.status}`);
        }
        
        await fetchClipboardHistory();
        showNotification('已删除');
    } catch (err) {
        console.error('删除剪贴板项目失败:', err);
        showNotification(`删除失败: ${err.message || '未知错误'}`, 'error');
    }
}

// 显示当前剪贴板内容
function displayCurrentClipboard(data) {
    currentClipboardEl.innerHTML = `
        <div class="content-display text-gray-800">${escapeHTML(data.content)}</div>
        <div class="flex justify-between items-center mt-2">
            <div class="text-xs text-gray-500">
                ${formatDate(new Date(data.created_at))} | 来自: ${shortenDeviceId(data.device_id)}
            </div>
            ${data.title ? `<div class="text-sm font-medium text-blue-600">${escapeHTML(data.title)}</div>` : ''}
            ${data.favorite ? `
                <div class="text-yellow-500">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </div>
            ` : ''}
        </div>
    `;
    
    // 存储当前项目ID，以便编辑时使用
    currentClipboardEl.dataset.itemId = data.id;
}

// 显示剪贴板历史
function displayClipboardHistory(items) {
    const html = items.map(item => `
        <div class="clipboard-item p-3 border border-gray-200 rounded bg-gray-50 relative" data-id="${item.id}">
            <div class="flex justify-between items-start">
                <div class="flex-grow">
                    ${item.title ? `<div class="font-medium text-gray-900 mb-1">${escapeHTML(item.title)}</div>` : ''}
                    <div class="content-display text-gray-800">${escapeHTML(item.content)}</div>
                    <div class="text-xs text-gray-500 mt-2">
                        ${formatDate(new Date(item.created_at))} | 来自: ${shortenDeviceId(item.device_id)}
                    </div>
                </div>
                <div class="ml-2 flex-shrink-0">
                    ${item.favorite ? 
                        `<span class="text-yellow-500" title="已收藏">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </span>` 
                        : ''}
                </div>
            </div>
            <div class="flex justify-end space-x-2 mt-2">
                <button class="text-blue-500 hover:text-blue-700 text-sm" 
                        onclick="copyToClipboard('${escapeJS(item.content)}')">
                    复制
                </button>
                <button class="edit-item-btn text-green-500 hover:text-green-700 text-sm" 
                        data-id="${item.id}">
                    编辑
                </button>
                <button class="favorite-btn text-yellow-500 hover:text-yellow-700 text-sm" 
                        data-id="${item.id}" data-favorite="${item.favorite ? 'true' : 'false'}">
                    ${item.favorite ? '取消收藏' : '收藏'}
                </button>
                <button class="delete-btn text-red-500 hover:text-red-700 text-sm" 
                        onclick="deleteClipboardItem('${item.id}')">
                    删除
                </button>
            </div>
        </div>
    `).join('');
    
    clipboardHistoryEl.innerHTML = html || '<p class="text-gray-400 italic">没有历史记录</p>';
    
    // 添加编辑按钮事件
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openEditModal(id);
        });
    });
    
    // 添加收藏按钮事件
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const isFavorite = btn.getAttribute('data-favorite') === 'true';
            
            try {
                await toggleFavorite(id);
                await fetchClipboardHistory(); // 刷新历史记录
                showNotification(isFavorite ? '已取消收藏' : '已添加到收藏', 'success');
            } catch (err) {
                console.error('收藏操作失败:', err);
                showNotification('操作失败', 'error');
            }
        });
    });
}

// 切换收藏状态
async function toggleFavorite(id) {
    const response = await fetch(`/api/clipboard/${id}/favorite`, {
        method: 'PUT'
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `操作失败: ${response.status}`);
    }
    
    return await response.json();
}

// 为当前剪贴板项目打开编辑模态框
function openEditModalForCurrentItem() {
    console.log("尝试打开当前项目的编辑模态框");
    const itemId = currentClipboardEl.dataset.itemId;
    if (itemId) {
        console.log("找到当前项目ID:", itemId);
        openEditModal(itemId);
    } else {
        console.error("无法获取当前项目ID");
        showNotification('无法编辑，未找到当前项目ID', 'error');
    }
}

// 打开编辑模态框
async function openEditModal(id) {
    try {
        console.log("正在打开编辑模态框，ID:", id);
        // 获取项目详情
        const response = await fetch(`/api/clipboard/${id}`);
        if (!response.ok) {
            throw new Error('获取项目详情失败');
        }
        
        const item = await response.json();
        console.log("获取项目详情成功:", item);
        
        // 填充表单 - 使用JavaScript方式类型转换
        const titleInput = document.getElementById('edit-title');
        const contentInput = document.getElementById('edit-content');
        const favoriteCheckbox = document.getElementById('edit-favorite');
        const itemIdInput = document.getElementById('edit-item-id');
        
        // 检查元素是否存在
        if (!titleInput || !contentInput || !favoriteCheckbox || !itemIdInput) {
            console.error("编辑模态框中的元素未找到:", {
                titleInput, contentInput, favoriteCheckbox, itemIdInput
            });
            throw new Error("编辑表单元素未找到");
        }
        
        if ('value' in titleInput) titleInput.value = item.title || '';
        if ('value' in contentInput) contentInput.value = item.content || '';
        if ('checked' in favoriteCheckbox) favoriteCheckbox.checked = item.favorite;
        if ('value' in itemIdInput) itemIdInput.value = item.id;
        
        console.log("表单填充完成");
        
        // 显示模态框
        console.log("显示编辑模态框");
        editModal.classList.remove('hidden');
    } catch (err) {
        console.error('打开编辑模态框失败:', err);
        showNotification('无法加载项目详情', 'error');
    }
}

// 关闭编辑模态框
function closeEditModal() {
    console.log("关闭编辑模态框");
    editModal.classList.add('hidden');
    
    // 清空表单 - 使用JavaScript方式类型转换
    const titleInput = document.getElementById('edit-title');
    const contentInput = document.getElementById('edit-content');
    const favoriteCheckbox = document.getElementById('edit-favorite');
    const itemIdInput = document.getElementById('edit-item-id');
    
    if (titleInput && 'value' in titleInput) titleInput.value = '';
    if (contentInput && 'value' in contentInput) contentInput.value = '';
    if (favoriteCheckbox && 'checked' in favoriteCheckbox) favoriteCheckbox.checked = false;
    if (itemIdInput && 'value' in itemIdInput) itemIdInput.value = '';
}

// 保存编辑
async function saveEdit() {
    console.log("开始保存编辑");
    // 获取表单值 - 使用JavaScript方式类型转换
    const titleInput = document.getElementById('edit-title');
    const contentInput = document.getElementById('edit-content');
    const favoriteCheckbox = document.getElementById('edit-favorite');
    const itemIdInput = document.getElementById('edit-item-id');
    
    // 检查元素是否存在
    if (!titleInput || !contentInput || !favoriteCheckbox || !itemIdInput) {
        console.error("保存编辑时表单元素未找到");
        showNotification('表单元素未找到', 'error');
        return;
    }
    
    const id = ('value' in itemIdInput) ? itemIdInput.value : '';
    const title = ('value' in titleInput && typeof titleInput.value === 'string') ? titleInput.value.trim() : '';
    const content = ('value' in contentInput && typeof contentInput.value === 'string') ? contentInput.value.trim() : '';
    const favorite = ('checked' in favoriteCheckbox) ? favoriteCheckbox.checked : false;
    
    console.log("表单数据:", { id, title, content, favorite });
    
    if (!id) {
        console.error("ID为空");
        showNotification('ID不能为空', 'error');
        return;
    }
    
    if (!content) {
        console.error("内容为空");
        showNotification('内容不能为空', 'error');
        if ('focus' in contentInput && typeof contentInput.focus === 'function') contentInput.focus();
        return;
    }
    
    try {
        console.log("开始发送更新请求");
        // 先更新内容和标题
        const updateResponse = await fetch(`/api/clipboard/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });
        
        if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => null);
            throw new Error(errorData?.error || '更新失败');
        }
        
        console.log("内容和标题更新成功");
        
        // 更新收藏状态
        const currentItem = await updateResponse.json();
        console.log("更新后的项目:", currentItem);
        
        if (currentItem.favorite !== favorite) {
            console.log("需要更新收藏状态");
            await toggleFavorite(id);
            console.log("收藏状态更新成功");
        }
        
        // 刷新数据
        await fetchLatestClipboard();
        await fetchClipboardHistory();
        
        closeEditModal();
        showNotification('更新成功', 'success');
    } catch (err) {
        console.error('保存编辑失败:', err);
        showNotification(`更新失败: ${err.message || '未知错误'}`, 'error');
    }
}

// 复制内容到剪贴板
async function copyToClipboard(text) {
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