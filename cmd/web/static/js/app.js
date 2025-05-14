// 全局变量
const deviceId = localStorage.getItem('deviceId') || createAndStoreDeviceId();
let currentClipboardContent = '';
let isMonitoring = false;
let monitoringInterval = null;
let hasClipboardPermission = false; // 默认设为false，要求用户主动授权
let autoUploadEnabled = true; // 默认启用自动上传
let retentionDays = 0; // 默认保存时间：0=无限期

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

// 权限弹窗元素
const permissionModal = document.getElementById('permission-modal');
const modalGrantPermissionBtn = document.getElementById('modal-grant-permission-btn');
const modalManualModeBtn = document.getElementById('modal-manual-mode-btn');

// 设置弹窗元素
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const autoUploadSetting = document.getElementById('auto-upload-setting');
const retentionDaysSetting = document.getElementById('retention-days');
const managePermissionBtn = document.getElementById('manage-permission-btn');
const permissionDescription = document.getElementById('permission-description');

// 初始化
document.addEventListener('DOMContentLoaded', init);

// 初始化排序和筛选按钮事件
function initExtraControls() {
    const sortBtn = document.getElementById('sort-btn');
    const filterBtn = document.getElementById('filter-btn');
    
    if (sortBtn) {
        sortBtn.addEventListener('click', toggleSortMenu);
    }
    
    if (filterBtn) {
        filterBtn.addEventListener('click', toggleFilterMenu);
    }
    
    // 添加设置按钮事件
    const settingsBtn = document.querySelector('button i.fa-gear');
    if (settingsBtn && settingsBtn.parentElement) {
        settingsBtn.parentElement.addEventListener('click', openSettingsModal);
    }
}

// 显示/隐藏排序菜单
function toggleSortMenu() {
    let sortMenu = document.getElementById('sort-menu');
    
    if (sortMenu) {
        // 已存在则切换显示/隐藏
        sortMenu.classList.toggle('hidden');
        return;
    }
    
    // 创建排序菜单
    sortMenu = document.createElement('div');
    sortMenu.id = 'sort-menu';
    sortMenu.className = 'absolute right-0 mt-2 bg-white rounded-md shadow-lg z-10 overflow-hidden w-48';
    sortMenu.style.top = '100%';
    
    sortMenu.innerHTML = `
        <div class="py-1">
            <button class="sort-option w-full text-left px-4 py-2 text-sm hover:bg-gray-100" data-sort="newest">
                <span class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd"/>
                    </svg>
                    最新优先
                </span>
            </button>
            <button class="sort-option w-full text-left px-4 py-2 text-sm hover:bg-gray-100" data-sort="oldest">
                <span class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-5a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 16.586V13z" clip-rule="evenodd"/>
                    </svg>
                    最早优先
                </span>
            </button>
            <button class="sort-option w-full text-left px-4 py-2 text-sm hover:bg-gray-100" data-sort="title">
                <span class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                    </svg>
                    按标题排序
                </span>
            </button>
        </div>
    `;
    
    // 添加到排序按钮后
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn && sortBtn.parentElement) {
        const sortBtnParent = sortBtn.parentElement;
        sortBtnParent.style.position = 'relative';
        sortBtnParent.appendChild(sortMenu);
    
        // 添加排序选项点击事件
        sortMenu.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', (e) => {
                if (e.currentTarget instanceof HTMLElement) {
                    const sortType = e.currentTarget.getAttribute('data-sort');
                    if (sortType) {
                        sortClipboardHistory(sortType);
                    }
                    sortMenu.classList.add('hidden');
                }
            });
        });
    
        // 点击其他区域关闭菜单
        document.addEventListener('click', (e) => {
            if (e.target instanceof Node && sortMenu && !sortMenu.contains(e.target) && 
                e.target instanceof HTMLElement && e.target.id !== 'sort-btn') {
                sortMenu.classList.add('hidden');
            }
        });
    }
}

// 显示/隐藏筛选菜单
function toggleFilterMenu() {
    let filterMenu = document.getElementById('filter-menu');
    
    if (filterMenu) {
        // 已存在则切换显示/隐藏
        filterMenu.classList.toggle('hidden');
        return;
    }
    
    // 创建筛选菜单
    filterMenu = document.createElement('div');
    filterMenu.id = 'filter-menu';
    filterMenu.className = 'absolute right-0 mt-2 bg-white rounded-md shadow-lg z-10 overflow-hidden w-48';
    filterMenu.style.top = '100%';
    
    filterMenu.innerHTML = `
        <div class="py-1">
            <button class="filter-option w-full text-left px-4 py-2 text-sm hover:bg-gray-100" data-filter="all">
                <span class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                    </svg>
                    显示全部
                </span>
            </button>
            <button class="filter-option w-full text-left px-4 py-2 text-sm hover:bg-gray-100" data-filter="favorites">
                <span class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    仅显示收藏
                </span>
            </button>
            <button class="filter-option w-full text-left px-4 py-2 text-sm hover:bg-gray-100" data-filter="visible">
                <span class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    显示可见内容
                </span>
            </button>
            <button class="filter-option w-full text-left px-4 py-2 text-sm hover:bg-gray-100" data-filter="hidden">
                <span class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                    显示隐藏内容
                </span>
            </button>
        </div>
    `;
    
    // 添加到筛选按钮后
    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn && filterBtn.parentElement) {
        const filterBtnParent = filterBtn.parentElement;
        filterBtnParent.style.position = 'relative';
        filterBtnParent.appendChild(filterMenu);
    
        // 添加筛选选项点击事件
        filterMenu.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', (e) => {
                if (e.currentTarget instanceof HTMLElement) {
                    const filterType = e.currentTarget.getAttribute('data-filter');
                    if (filterType) {
                        filterClipboardHistory(filterType);
                    }
                    filterMenu.classList.add('hidden');
                }
            });
        });
    
        // 点击其他区域关闭菜单
        document.addEventListener('click', (e) => {
            if (e.target instanceof Node && filterMenu && !filterMenu.contains(e.target) && 
                e.target instanceof HTMLElement && e.target.id !== 'filter-btn') {
                filterMenu.classList.add('hidden');
            }
        });
    }
}

// 排序历史记录
function sortClipboardHistory(sortType) {
    // 当前缓存的历史记录
    const historyItems = Array.from(document.querySelectorAll('#clipboard-history .clipboard-item'));
    
    // 如果没有历史记录或只有一项，不需要排序
    if (historyItems.length <= 1) return;
    
    // 排序
    historyItems.sort((a, b) => {
        if (sortType === 'newest') {
            const dateTextA = a.querySelector('.text-xs.text-gray-500')?.textContent || '';
            const dateTextB = b.querySelector('.text-xs.text-gray-500')?.textContent || '';
            const dateA = new Date(dateTextA.split('|')[0].trim());
            const dateB = new Date(dateTextB.split('|')[0].trim());
            
            // 使用数字比较，保证类型兼容
            return dateB.getTime() - dateA.getTime(); // 最新优先
        } else if (sortType === 'oldest') {
            const dateTextA = a.querySelector('.text-xs.text-gray-500')?.textContent || '';
            const dateTextB = b.querySelector('.text-xs.text-gray-500')?.textContent || '';
            const dateA = new Date(dateTextA.split('|')[0].trim());
            const dateB = new Date(dateTextB.split('|')[0].trim());
            
            // 使用数字比较，保证类型兼容
            return dateA.getTime() - dateB.getTime(); // 最旧优先
        } else if (sortType === 'title') {
            const titleElA = a.querySelector('.font-medium.text-gray-900');
            const titleElB = b.querySelector('.font-medium.text-gray-900');
            
            const titleA = titleElA ? titleElA.textContent?.trim().toLowerCase() || '' : '';
            const titleB = titleElB ? titleElB.textContent?.trim().toLowerCase() || '' : '';
            
            return titleA.localeCompare(titleB); // 按标题字母顺序
        }
        
        return 0;
    });
    
    // 重新添加到容器
    const container = document.getElementById('clipboard-history');
    if (!container) return;
    
    // 清空容器
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // 添加排序后的元素
    historyItems.forEach(item => {
        container.appendChild(item);
    });
    
    // 显示排序提示
    let sortTypeText = '默认';
    if (sortType === 'newest') sortTypeText = '最新优先';
    else if (sortType === 'oldest') sortTypeText = '最早优先';
    else if (sortType === 'title') sortTypeText = '按标题排序';
    
    showNotification(`历史记录已排序: ${sortTypeText}`, 'info');
}

// 筛选历史记录
function filterClipboardHistory(filterType) {
    const historyItems = document.querySelectorAll('#clipboard-history .clipboard-item');
    
    historyItems.forEach(item => {
        if (filterType === 'all') {
            item.style.display = 'block';
        } else if (filterType === 'favorites') {
            const isFavorite = item.querySelector('.favorite-icon') !== null;
            item.style.display = isFavorite ? 'block' : 'none';
        } else if (filterType === 'visible') {
            const visibilityBtn = item.querySelector('.visibility-toggle');
            const isVisible = visibilityBtn && visibilityBtn.getAttribute('data-visible') === 'true';
            item.style.display = isVisible ? 'block' : 'none';
        } else if (filterType === 'hidden') {
            const visibilityBtn = item.querySelector('.visibility-toggle');
            const isVisible = visibilityBtn && visibilityBtn.getAttribute('data-visible') === 'true';
            item.style.display = !isVisible ? 'block' : 'none';
        }
    });
    
    // 显示筛选提示
    let filterTypeText = '全部';
    if (filterType === 'favorites') filterTypeText = '仅收藏';
    else if (filterType === 'visible') filterTypeText = '可见内容';
    else if (filterType === 'hidden') filterTypeText = '隐藏内容';
    
    showNotification(`已筛选: ${filterTypeText}`, 'info');
    
    // 检查是否有可见的项目
    const visibleItems = document.querySelectorAll('#clipboard-history .clipboard-item[style="display: block;"]');
    if (visibleItems.length === 0) {
        const container = document.getElementById('clipboard-history');
        const noItemsMsg = document.createElement('p');
        noItemsMsg.className = 'text-gray-400 italic col-span-full text-center py-4';
        noItemsMsg.textContent = '没有符合条件的项目';
        container.appendChild(noItemsMsg);
    }
}

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
        // 加载设置
        loadSettings();
        
        // 首先获取数据
        await fetchLatestClipboard();
        await fetchClipboardHistory();
        
        // 检查之前是否已授予剪贴板权限
        const savedPermission = localStorage.getItem('clipboardPermission');
        hasClipboardPermission = savedPermission === 'true';
        
        // 设置事件监听器
        setupEventListeners();
        
        // 初始化排序和筛选控制
        initExtraControls();
        
        // 检查剪贴板API可用性
        if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
            console.log("剪贴板API可用");
            
            // 如果之前已获得权限，尝试恢复权限状态
            if (hasClipboardPermission) {
                try {
                    // 尝试读取剪贴板，验证权限是否仍然有效
                    await navigator.clipboard.readText();
                    
                    // 成功读取，权限仍然有效
                    console.log("剪贴板权限已恢复");
                    updatePermissionStatus(true, "自动同步");
                    showNotification("剪贴板自动同步已启用", "success");
                    
                    // 如果设置了自动上传，则启动监控
                    if (autoUploadEnabled) {
                        startClipboardMonitoring();
                    }
                } catch (err) {
                    // 无法读取，权限可能已被撤销
                    console.log("无法恢复剪贴板权限:", err);
                    hasClipboardPermission = false;
                    localStorage.setItem('clipboardPermission', 'false');
                    updatePermissionStatus(false, "需要授权");
                    
                    // 显示权限弹窗
                    openPermissionModal();
                }
            } else {
                updatePermissionStatus(false, "点击授权");
                
                // 显示权限弹窗
                openPermissionModal();
            }
        } else {
            console.log("剪贴板API不可用");
            showNotification("此浏览器不支持自动剪贴板功能，请使用手动模式", "warning");
            updatePermissionStatus(false, "不支持");
            addManualPasteInterface();
        }
    } catch (error) {
        console.error("初始化失败:", error);
        showNotification("应用初始化失败，请刷新页面", "error");
    }
}

// 加载保存的设置
function loadSettings() {
    // 加载自动上传设置
    const savedAutoUpload = localStorage.getItem('autoUpload');
    if (savedAutoUpload !== null) {
        autoUploadEnabled = savedAutoUpload === 'true';
    }
    
    // 加载保存天数设置
    const savedRetentionDays = localStorage.getItem('retentionDays');
    if (savedRetentionDays !== null) {
        retentionDays = parseInt(savedRetentionDays, 10);
        if (isNaN(retentionDays)) {
            retentionDays = 0;
        }
    }
    
    // 更新设置弹窗中的值
    if (autoUploadSetting) {
        autoUploadSetting.checked = autoUploadEnabled;
    }
    
    if (retentionDaysSetting) {
        retentionDaysSetting.value = retentionDays;
    }
}

// 保存设置
function saveSettings() {
    // 获取当前设置值
    if (autoUploadSetting) {
        autoUploadEnabled = autoUploadSetting.checked;
        localStorage.setItem('autoUpload', autoUploadEnabled.toString());
    }
    
    if (retentionDaysSetting) {
        retentionDays = parseInt(retentionDaysSetting.value, 10);
        if (isNaN(retentionDays) || retentionDays < 0) {
            retentionDays = 0;
            retentionDaysSetting.value = "0";
        }
        localStorage.setItem('retentionDays', retentionDays.toString());
    }
    
    // 根据自动上传设置决定是否开启/关闭监控
    if (hasClipboardPermission) {
        if (autoUploadEnabled && !isMonitoring) {
            startClipboardMonitoring();
        } else if (!autoUploadEnabled && isMonitoring) {
            stopClipboardMonitoring();
        }
    }
    
    showNotification('设置已保存', 'success');
    closeSettingsModal();
}

// 打开权限弹窗
function openPermissionModal() {
    if (permissionModal) {
        permissionModal.classList.remove('hidden');
    }
}

// 关闭权限弹窗
function closePermissionModal() {
    if (permissionModal) {
        permissionModal.classList.add('hidden');
    }
}

// 打开设置弹窗
function openSettingsModal() {
    // 更新UI状态
    updateSettingsModalState();
    
    if (settingsModal) {
        settingsModal.classList.remove('hidden');
    }
}

// 关闭设置弹窗
function closeSettingsModal() {
    if (settingsModal) {
        settingsModal.classList.add('hidden');
    }
}

// 更新设置弹窗状态
function updateSettingsModalState() {
    // 更新自动上传开关
    if (autoUploadSetting) {
        autoUploadSetting.checked = autoUploadEnabled;
    }
    
    // 更新保存天数
    if (retentionDaysSetting) {
        retentionDaysSetting.value = retentionDays;
    }
    
    // 更新权限状态描述
    if (permissionDescription) {
        permissionDescription.textContent = hasClipboardPermission 
            ? "已授权，可自动读取系统剪贴板" 
            : "未授权，需要手动粘贴内容";
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
    
    // 权限弹窗按钮事件
    if (modalGrantPermissionBtn) {
        modalGrantPermissionBtn.addEventListener('click', async () => {
            closePermissionModal();
            await requestClipboardPermission();
        });
    }
    
    if (modalManualModeBtn) {
        modalManualModeBtn.addEventListener('click', () => {
            closePermissionModal();
            addManualPasteInterface();
        });
    }
    
    // 设置弹窗按钮事件
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', closeSettingsModal);
    }
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    if (managePermissionBtn) {
        managePermissionBtn.addEventListener('click', () => {
            closeSettingsModal();
            openPermissionModal();
        });
    }
    
    // 点击权限弹窗背景关闭
    if (permissionModal) {
        permissionModal.addEventListener('click', (e) => {
            if (e.target === permissionModal) {
                closePermissionModal();
            }
        });
    }
    
    // 点击设置弹窗背景关闭
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }
    
    // 监听粘贴事件 - 全局粘贴
    console.log("设置全局粘贴事件监听");
    document.addEventListener('paste', async (e) => {
        const text = e.clipboardData.getData('text/plain');
        // 只有在开启了自动上传的情况下才处理粘贴事件
        if (autoUploadEnabled && text && text !== currentClipboardContent) {
            await saveClipboardContent(text);
        }
    });
    
    // 监听焦点变化，当窗口获得焦点时尝试读取剪贴板（仅当已获得权限时）
    console.log("设置窗口焦点变化事件监听");
    window.addEventListener('focus', async () => {
        if (hasClipboardPermission && autoUploadEnabled) {
            try {
                // 增加小延迟确保焦点已完全获取
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // 确保窗口真的有焦点
                if (document.hasFocus()) {
                    const text = await navigator.clipboard.readText();
                    if (text && text !== currentClipboardContent) {
                        await saveClipboardContent(text);
                    }
                }
            } catch (err) {
                // 区分文档无焦点错误和真正的权限错误
                if (err.name === 'NotAllowedError' && err.message.includes('Document is not focused')) {
                    console.log('窗口获得焦点，但剪贴板读取需要用户交互，等待下一次尝试');
                } else {
                    console.error('窗口获得焦点，但无法读取剪贴板:', err);
                    // 只有在真正的权限错误时才重置权限状态
                    if (err.name === 'NotAllowedError' && !err.message.includes('Document is not focused')) {
                        setClipboardPermission(false);
                        updatePermissionStatus(false, '权限已失效');
                        showNotification("剪贴板访问权限已失效，已切换到手动模式", "warning");
                        addManualPasteInterface();
                    }
                }
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

// 显示剪贴板历史
function displayClipboardHistory(items) {
    // 保存当前滚动位置
    const scrollPosition = clipboardHistoryEl.scrollTop;
    
    const html = items.map(item => {
        // 默认设置为显示，后续需要从数据库获取真正的visible值
        const isVisible = item.visible !== false; // 如果没有visible字段或为true则显示
        
        return `
        <div class="history-item" data-id="${item.id}">
            ${item.favorite ? `
                <div class="starred" title="已收藏">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </div>
            ` : ''}
            
            <button class="delete-btn" title="删除" data-id="${item.id}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
            
            <div class="history-item-header">
                <div class="history-item-title">${item.title || '未命名内容'}</div>
            </div>
            
            <div class="history-item-content" onclick="window.copyToClipboard('${escapeJS(item.content)}')">
                ${isVisible ? escapeHTML(item.content) : '<span class="italic text-muted">内容已隐藏</span>'}
            </div>
            
            <div class="history-item-footer">
                <div>${formatDate(new Date(item.created_at))}</div>
                
                <div class="history-item-actions">
                    <button class="edit-item-btn icon-btn" title="编辑" data-id="${item.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button class="visibility-toggle icon-btn" 
                            title="${isVisible ? '隐藏内容' : '显示内容'}"
                            data-id="${item.id}" 
                            data-visible="${isVisible}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isVisible ? 
                            'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' : 
                            'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'}" />
                        </svg>
                    </button>
                    <button class="favorite-btn icon-btn ${item.favorite ? 'starred' : ''}" 
                            title="${item.favorite ? '取消收藏' : '收藏'}"
                            data-id="${item.id}" data-favorite="${item.favorite ? 'true' : 'false'}">
                        <svg class="w-4 h-4" fill="${item.favorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="${item.favorite ? '0' : '2'}" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;}).join('');
    
    clipboardHistoryEl.innerHTML = html || '<p class="text-gray-400 italic text-center py-4">没有历史记录</p>';
    
    // 恢复滚动位置
    clipboardHistoryEl.scrollTop = scrollPosition;
    
    // 添加编辑按钮事件
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            const id = btn.getAttribute('data-id');
            openEditModal(id);
        });
    });
    
    // 添加收藏按钮事件
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); // 阻止事件冒泡
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
    
    // 添加删除按钮事件 - 使用确认对话框
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            const id = btn.getAttribute('data-id');
            confirmDelete(id);
        });
    });
    
    // 添加可见性切换按钮事件
    document.querySelectorAll('.visibility-toggle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            const id = btn.getAttribute('data-id');
            const isVisible = btn.getAttribute('data-visible') === 'true';
            
            try {
                // 如果要隐藏，检查该项是否有标题
                if (isVisible) {
                    const itemElement = btn.closest('.history-item');
                    const titleElement = itemElement.querySelector('.history-item-title');
                    
                    if (!titleElement || titleElement.textContent === '未命名内容') {
                        showNotification('隐藏内容需要先设置标题', 'warning');
                        return;
                    }
                }
                
                // 这里需要调用后端API切换可见性
                await toggleVisibility(id);
                
                // 刷新历史记录
                await fetchClipboardHistory();
                
                showNotification(isVisible ? '内容已隐藏' : '内容已显示', 'success');
            } catch (err) {
                console.error('切换可见性失败:', err);
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
        const visibleCheckbox = document.getElementById('edit-visible');
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
        if (visibleCheckbox && 'checked' in visibleCheckbox) visibleCheckbox.checked = item.visible !== false;
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
    const visibleCheckbox = document.getElementById('edit-visible');
    const itemIdInput = document.getElementById('edit-item-id');
    
    if (titleInput && 'value' in titleInput) titleInput.value = '';
    if (contentInput && 'value' in contentInput) contentInput.value = '';
    if (favoriteCheckbox && 'checked' in favoriteCheckbox) favoriteCheckbox.checked = false;
    if (visibleCheckbox && 'checked' in visibleCheckbox) visibleCheckbox.checked = false;
    if (itemIdInput && 'value' in itemIdInput) itemIdInput.value = '';
}

// 保存编辑
async function saveEdit() {
    console.log("开始保存编辑");
    // 获取表单值 - 使用JavaScript方式类型转换
    const titleInput = document.getElementById('edit-title');
    const contentInput = document.getElementById('edit-content');
    const favoriteCheckbox = document.getElementById('edit-favorite');
    const visibleCheckbox = document.getElementById('edit-visible');
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
    const visible = visibleCheckbox ? (('checked' in visibleCheckbox) ? visibleCheckbox.checked : true) : true;
    
    console.log("表单数据:", { id, title, content, favorite, visible });
    
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
    
    // 如果内容设为隐藏，检查是否有标题
    if (!visible && !title) {
        console.error("隐藏内容需要标题");
        showNotification('隐藏内容需要设置标题', 'warning');
        if ('focus' in titleInput && typeof titleInput.focus === 'function') titleInput.focus();
        return;
    }
    
    try {
        console.log("开始发送更新请求");
        // 保存滚动位置
        const scrollPosition = clipboardHistoryEl.scrollTop;
        
        // 先更新内容和标题
        const updateResponse = await fetch(`/api/clipboard/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content,
                visible: visible
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
        
        // 恢复滚动位置
        setTimeout(() => {
            clipboardHistoryEl.scrollTop = scrollPosition;
        }, 100);
        
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
window.confirmDelete = confirmDelete;

// 开始监控剪贴板变化
function startClipboardMonitoring() {
    if (!hasClipboardPermission || isMonitoring || !autoUploadEnabled) {
        return;
    }
    
    isMonitoring = true;
    console.log("开始剪贴板监控");
    
    // 创建监控指示器
    const monitorIndicator = document.createElement('div');
    monitorIndicator.id = 'monitor-indicator';
    monitorIndicator.className = 'fixed bottom-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center';
    monitorIndicator.innerHTML = `
        <span class="inline-block w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
        <span>同步中</span>
    `;
    document.body.appendChild(monitorIndicator);
    
    // 设置定时器，按间隔检查剪贴板变化
    monitoringInterval = setInterval(async () => {
        try {
            // 只有在页面处于活动状态且开启了自动上传时才尝试读取剪贴板
            if (document.visibilityState === 'visible' && hasClipboardPermission && document.hasFocus() && autoUploadEnabled) {
                try {
                    const clipText = await navigator.clipboard.readText();
                    
                    // 如果剪贴板内容变化了，保存到服务器
                    if (clipText && clipText !== currentClipboardContent) {
                        console.log("检测到剪贴板变化，保存新内容");
                        currentClipboardContent = clipText;
                        await saveClipboardContent(clipText);
                    }
                } catch (clipErr) {
                    // 文档没有焦点或浏览器策略限制导致的错误
                    if (clipErr.name === 'NotAllowedError' && 
                        clipErr.message.includes('Document is not focused')) {
                        // 这是预期的错误，当窗口没有焦点时发生，只记录不停止监控
                        console.log("剪贴板读取需要窗口有焦点，等待下一次尝试");
                    } else {
                        // 处理其他权限错误 - 只有在确认是权限被撤销时才停止监控
                        console.error("剪贴板读取失败:", clipErr);
                        if (clipErr.name === 'NotAllowedError' && !clipErr.message.includes('Document is not focused')) {
                            // 权限被撤销，停止监控
                            stopClipboardMonitoring();
                            setClipboardPermission(false);
                            updatePermissionStatus(false, "权限已撤销");
                            showNotification("剪贴板访问权限已被撤销，已切换到手动模式", "warning");
                            
                            // 显示权限弹窗
                            openPermissionModal();
                        }
                    }
                }
            }
        } catch (err) {
            console.error("剪贴板监控整体错误:", err);
        }
    }, 2000); // 每2秒检查一次
}

// 停止剪贴板监控
function stopClipboardMonitoring() {
    if (!isMonitoring) {
        return;
    }
    
    console.log("停止剪贴板监控");
    isMonitoring = false;
    
    // 清除监控间隔
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
    }
    
    // 移除监控指示器
    const indicator = document.getElementById('monitor-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// 切换内容可见性
async function toggleVisibility(id) {
    try {
        const response = await fetch(`/api/clipboard/${id}/visibility`, {
            method: 'PUT'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `操作失败: ${response.status}`);
        }
        
        return await response.json();
    } catch (err) {
        console.error('切换可见性失败:', err);
        throw err;
    }
}

// 显示删除确认对话框
function confirmDelete(id) {
    // 创建确认对话框
    let confirmDialog = document.getElementById('confirm-dialog');
    if (!confirmDialog) {
        confirmDialog = document.createElement('div');
        confirmDialog.id = 'confirm-dialog';
        confirmDialog.className = 'confirm-dialog';
        confirmDialog.innerHTML = `
            <div class="confirm-dialog-content">
                <h3 class="text-lg font-medium text-gray-900 mb-3">确认删除</h3>
                <p class="text-gray-500 mb-5">确定要删除这项内容吗？此操作无法撤销。</p>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-delete" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">取消</button>
                    <button id="confirm-delete" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">删除</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmDialog);
        
        // 点击背景关闭对话框
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                confirmDialog.classList.remove('show');
            }
        });
    }
    
    // 显示对话框
    confirmDialog.classList.add('show');
    
    // 设置按钮事件
    const cancelBtn = document.getElementById('cancel-delete');
    const confirmBtn = document.getElementById('confirm-delete');
    
    // 移除可能的旧事件监听器
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newConfirmBtn = confirmBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // 添加新的事件监听器
    newCancelBtn.addEventListener('click', () => {
        confirmDialog.classList.remove('show');
    });
    
    newConfirmBtn.addEventListener('click', async () => {
        confirmDialog.classList.remove('show');
        await deleteClipboardItem(id);
    });
}

// 显示当前剪贴板内容
function displayCurrentClipboard(data) {
    currentClipboardEl.innerHTML = `
        <div class="clipboard-content" data-id="${data.id}">
            ${data.content ? escapeHTML(data.content) : '<p class="text-gray-400 italic">没有剪贴板内容</p>'}
        </div>
    `;
    
    // 存储当前项目ID，以便编辑时使用
    currentClipboardEl.dataset.itemId = data.id;
}

// 删除剪贴板项目
async function deleteClipboardItem(id) {
    // 保存滚动位置
    const scrollPosition = clipboardHistoryEl.scrollTop;
    
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
        
        // 恢复滚动位置
        setTimeout(() => {
            clipboardHistoryEl.scrollTop = scrollPosition;
        }, 100);
    } catch (err) {
        console.error('删除剪贴板项目失败:', err);
        showNotification(`删除失败: ${err.message || '未知错误'}`, 'error');
    }
}

// 请求剪贴板权限 - 修改版本
async function requestClipboardPermission() {
    try {
        showNotification('正在请求剪贴板权限...', 'info');
        
        try {
            // 直接尝试读取剪贴板，这会触发浏览器的权限请求
            const text = await navigator.clipboard.readText();
            
            // 如果成功读取，则设置权限状态为已授权
            setClipboardPermission(true);
            updatePermissionStatus(true, "自动同步");
            showNotification('已获取剪贴板访问权限', 'success');
            
            // 如果获取到内容，尝试保存
            if (text && text !== currentClipboardContent && autoUploadEnabled) {
                await saveClipboardContent(text);
            }
            
            // 如果设置了自动上传，则启动监控
            if (autoUploadEnabled) {
                startClipboardMonitoring();
            }
            
            return true;
        } catch (err) {
            // 权限请求失败
            const errorMessage = (err.name === 'NotAllowedError') 
                ? '浏览器拒绝了剪贴板访问请求' 
                : '无法获取剪贴板权限';
                
            showNotification(errorMessage, 'error');
            console.error('剪贴板权限错误:', err);
            
            // 设置为未授权状态
            setClipboardPermission(false);
            updatePermissionStatus(false, "权限被拒绝");
            addManualPasteInterface();
            
            return false;
        }
    } catch (err) {
        // 捕获函数整体执行中的任何错误
        console.error('剪贴板权限请求过程出错:', err);
        showNotification('权限请求过程出错，已切换到手动模式', 'error');
        
        // 设置为手动模式
        setClipboardPermission(false);
        updatePermissionStatus(false, "手动模式");
        addManualPasteInterface();
        
        return false;
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
        try {
            // 如果存在但需要更新状态
            updateManualInterfaceState();
        } catch (err) {
            console.error("更新手动界面状态失败:", err);
        }
        return; 
    }
    
    // 创建手动粘贴界面
    const manualPasteContainer = document.createElement('div');
    manualPasteContainer.id = 'manual-paste-container';
    manualPasteContainer.className = 'bg-blue-50 border border-blue-200 rounded p-4 mb-4';
    manualPasteContainer.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 102 0V6a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="ml-3 flex-grow">
                <div class="flex justify-between items-center">
                    <h3 class="text-sm font-medium text-blue-800">剪贴板同步</h3>
                    <span id="manual-permission-status" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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
                        <button id="read-clipboard-btn" class="app-btn app-btn-primary w-full mb-2">
                            授权并读取系统剪贴板内容
                        </button>
                    ` : ''}
                    <div class="mt-2">
                        <div class="relative">
                            <textarea id="manual-paste-textarea" placeholder="在此粘贴内容 (Ctrl+V)..." class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2"></textarea>
                            <div class="absolute top-2 right-2 text-gray-400 text-xs">
                                按 Ctrl+V 粘贴
                            </div>
                        </div>
                        <div class="flex space-x-2 mt-2">
                            <button id="manual-paste-btn" class="app-btn app-btn-success w-full">
                                <svg class="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                                </svg>
                                同步到云端
                            </button>
                            <button id="clear-paste-btn" class="app-btn app-btn-outline">
                                清空
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    try {
        // 添加到页面 - 确保父元素存在
        if (currentClipboardEl && currentClipboardEl.parentNode) {
            // 添加在当前剪贴板区域之前
            currentClipboardEl.parentNode.parentNode.insertBefore(manualPasteContainer, currentClipboardEl.parentNode);
            
            // 设置事件监听
            setupManualPasteEvents();
        } else {
            console.error("无法找到添加手动粘贴界面的父元素");
        }
    } catch (err) {
        console.error("添加手动粘贴界面失败:", err);
    }
}

// 更新手动界面状态
function updateManualInterfaceState() {
    const manualPermissionStatus = document.getElementById('manual-permission-status');
    const manualPasteContainer = document.getElementById('manual-paste-container');
    
    // 如果手动粘贴容器不存在，直接返回
    if (!manualPasteContainer) {
        return;
    }
    
    const statusText = manualPasteContainer.querySelector('.text-sm.text-blue-700');
    const permissionBtnContainer = manualPasteContainer.querySelector('.mt-2');
    
    if (manualPermissionStatus) {
        if (hasClipboardPermission) {
            manualPermissionStatus.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
            manualPermissionStatus.innerHTML = '<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>自动同步';
        } else {
            manualPermissionStatus.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
            manualPermissionStatus.innerHTML = '<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>手动模式';
        }
    }
    
    if (statusText) {
        statusText.textContent = hasClipboardPermission 
            ? '自动同步已启用，可随时读取剪贴板内容' 
            : '您可以手动粘贴内容或尝试获取剪贴板权限';
    }
    
    // 更新授权按钮
    if (permissionBtnContainer) {
        const readClipboardBtn = document.getElementById('read-clipboard-btn');
        
        if (!hasClipboardPermission && !readClipboardBtn) {
            // 需要添加授权按钮
            const btnDiv = document.createElement('div');
            btnDiv.innerHTML = `
                <button id="read-clipboard-btn" class="app-btn app-btn-primary w-full mb-2">
                    授权并读取系统剪贴板内容
                </button>
            `;
            permissionBtnContainer.insertBefore(btnDiv.firstChild, permissionBtnContainer.firstChild);
            
            // 添加事件监听 - 确保元素存在后再添加事件
            const newBtn = document.getElementById('read-clipboard-btn');
            if (newBtn) {
                newBtn.addEventListener('click', requestClipboardPermission);
            }
        } else if (hasClipboardPermission && readClipboardBtn) {
            // 移除授权按钮
            readClipboardBtn.remove();
        }
    }
}

// 设置手动粘贴界面的事件
function setupManualPasteEvents() {
    // 设置"读取剪贴板"按钮事件 (如果存在)
    const readClipboardBtn = document.getElementById('read-clipboard-btn');
    if (readClipboardBtn) {
        readClipboardBtn.addEventListener('click', requestClipboardPermission);
    }
    
    // 获取手动粘贴元素
    const manualPasteBtn = document.getElementById('manual-paste-btn');
    const clearPasteBtn = document.getElementById('clear-paste-btn');
    const manualPasteTextarea = document.getElementById('manual-paste-textarea');
    
    // 设置手动粘贴按钮事件
    if (manualPasteBtn && manualPasteTextarea) {
        manualPasteBtn.addEventListener('click', () => {
            handleManualPaste();
        });
    }
    
    // 设置清空按钮事件
    if (clearPasteBtn && manualPasteTextarea) {
        clearPasteBtn.addEventListener('click', () => {
            if (manualPasteTextarea instanceof HTMLTextAreaElement) {
                manualPasteTextarea.value = '';
                manualPasteTextarea.focus();
            }
        });
    }
    
    // 设置文本框事件
    if (manualPasteTextarea) {
        // 粘贴事件 - 自动获取粘贴内容
        manualPasteTextarea.addEventListener('paste', (e) => {
            // 如果用户选择了支持自动粘贴提交，则触发
            if (localStorage.getItem('autoPasteSubmit') === 'true') {
                // 延迟一点执行，确保内容已经粘贴到文本框
                setTimeout(() => handleManualPaste(), 10);
            }
        });
        
        // 快捷键支持
        manualPasteTextarea.addEventListener('keydown', (e) => {
            // Ctrl+Enter 提交
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleManualPaste();
            }
        });
    }
}

// 处理手动粘贴提交
function handleManualPaste() {
    const manualPasteTextarea = document.getElementById('manual-paste-textarea');
    
    // 确保正确获取textarea值
    const text = manualPasteTextarea instanceof HTMLTextAreaElement 
        ? manualPasteTextarea.value.trim() 
        : '';
    
    if (text) {
        saveClipboardContent(text)
            .then(() => {
                // 清空输入框
                if (manualPasteTextarea instanceof HTMLTextAreaElement) {
                    manualPasteTextarea.value = '';
                }
                showNotification('内容已同步到云端', 'success');
            })
            .catch(err => {
                showNotification('同步失败，请重试', 'error');
                console.error("手动粘贴同步失败:", err);
            });
    } else {
        showNotification('请先输入或粘贴内容', 'warning');
        if (manualPasteTextarea instanceof HTMLTextAreaElement) {
            manualPasteTextarea.focus();
        }
    }
} 