// DOM元素
const favoritesContainer = document.getElementById('favorites-container');
const noFavoritesEl = document.getElementById('no-favorites');
const searchInput = document.getElementById('search-input');
const editModal = document.getElementById('edit-modal');
const editTitleInput = document.getElementById('edit-title');
const editContentInput = document.getElementById('edit-content');
const editItemIdInput = document.getElementById('edit-item-id');
const saveEditBtn = document.getElementById('save-edit-btn');
const deleteItemBtn = document.getElementById('delete-item-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// 全局变量
let favorites = [];
let filteredFavorites = [];

// 初始化
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        // 加载收藏内容
        await fetchFavorites();
        
        // 设置事件监听器
        setupEventListeners();
    } catch (err) {
        console.error('初始化失败:', err);
        showNotification('加载收藏内容失败，请刷新页面重试', 'error');
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 搜索输入事件
    searchInput.addEventListener('input', handleSearch);
    
    // 编辑模态框关闭按钮
    closeModalBtn.addEventListener('click', closeEditModal);
    
    // 保存编辑按钮
    saveEditBtn.addEventListener('click', saveEdit);
    
    // 删除按钮
    deleteItemBtn.addEventListener('click', deleteItem);
    
    // 点击模态框背景关闭模态框
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

// 获取收藏内容
async function fetchFavorites() {
    try {
        favoritesContainer.innerHTML = '<div class="flex justify-center items-center col-span-full py-10"><div class="loading"></div></div>';
        
        const response = await fetch('/api/clipboard/favorites');
        if (!response.ok) {
            throw new Error('获取收藏内容失败');
        }
        
        favorites = await response.json();
        filteredFavorites = [...favorites];
        
        displayFavorites(favorites);
    } catch (err) {
        console.error('获取收藏内容失败:', err);
        favoritesContainer.innerHTML = '<div class="col-span-full text-center text-red-500">获取收藏内容失败，请刷新页面重试</div>';
    }
}

// 显示收藏内容
function displayFavorites(items) {
    if (items.length === 0) {
        favoritesContainer.innerHTML = '';
        noFavoritesEl.classList.remove('hidden');
        return;
    }
    
    noFavoritesEl.classList.add('hidden');
    
    const html = items.map(item => {
        const title = item.title || '未命名';
        const shortContent = item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content;
        
        return `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300" data-id="${item.id}">
                <div class="p-5">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-semibold text-gray-800">${escapeHTML(title)}</h3>
                        <button class="edit-btn text-gray-400 hover:text-gray-600" data-id="${item.id}">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    </div>
                    <div class="content-display text-gray-600 text-sm mb-4 h-24 overflow-hidden">${escapeHTML(shortContent)}</div>
                    <div class="flex justify-between items-center text-xs text-gray-500">
                        <span>${formatDate(new Date(item.created_at))}</span>
                        <div class="flex space-x-2">
                            <button class="copy-btn text-blue-500 hover:text-blue-700" data-id="${item.id}">
                                复制
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    favoritesContainer.innerHTML = html;
    
    // 添加复制和编辑事件监听器
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const item = items.find(i => i.id === id);
            if (item) {
                copyToClipboard(item.content);
            }
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const item = items.find(i => i.id === id);
            if (item) {
                openEditModal(item);
            }
        });
    });
}

// 处理搜索
function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        filteredFavorites = [...favorites];
        displayFavorites(filteredFavorites);
        return;
    }
    
    filteredFavorites = favorites.filter(item => {
        const title = (item.title || '').toLowerCase();
        const content = item.content.toLowerCase();
        return title.includes(searchTerm) || content.includes(searchTerm);
    });
    
    displayFavorites(filteredFavorites);
}

// 打开编辑模态框
function openEditModal(item) {
    editTitleInput.value = item.title || '';
    editContentInput.value = item.content || '';
    editItemIdInput.value = item.id;
    
    editModal.classList.remove('hidden');
    editTitleInput.focus();
}

// 关闭编辑模态框
function closeEditModal() {
    editModal.classList.add('hidden');
    editTitleInput.value = '';
    editContentInput.value = '';
    editItemIdInput.value = '';
}

// 保存编辑
async function saveEdit() {
    const id = editItemIdInput.value;
    const title = editTitleInput.value.trim();
    const content = editContentInput.value.trim();
    
    if (!id) {
        showNotification('ID不能为空', 'error');
        return;
    }
    
    if (!content) {
        showNotification('内容不能为空', 'error');
        editContentInput.focus();
        return;
    }
    
    try {
        const response = await fetch(`/api/clipboard/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || '更新失败');
        }
        
        const updatedItem = await response.json();
        
        // 更新本地数据
        const index = favorites.findIndex(item => item.id === id);
        if (index !== -1) {
            favorites[index] = updatedItem;
            
            // 如果正在搜索，也更新过滤后的数据
            const filteredIndex = filteredFavorites.findIndex(item => item.id === id);
            if (filteredIndex !== -1) {
                filteredFavorites[filteredIndex] = updatedItem;
            }
            
            // 重新显示
            displayFavorites(filteredFavorites);
        }
        
        closeEditModal();
        showNotification('更新成功', 'success');
    } catch (err) {
        console.error('更新失败:', err);
        showNotification(`更新失败: ${err.message || '未知错误'}`, 'error');
    }
}

// 删除项目
async function deleteItem() {
    const id = editItemIdInput.value;
    
    if (!id) {
        showNotification('ID不能为空', 'error');
        return;
    }
    
    if (!confirm('确定要删除这个项目吗？此操作无法撤销。')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/clipboard/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || '删除失败');
        }
        
        // 更新本地数据
        favorites = favorites.filter(item => item.id !== id);
        filteredFavorites = filteredFavorites.filter(item => item.id !== id);
        
        // 重新显示
        displayFavorites(filteredFavorites);
        
        closeEditModal();
        showNotification('删除成功', 'success');
    } catch (err) {
        console.error('删除失败:', err);
        showNotification(`删除失败: ${err.message || '未知错误'}`, 'error');
    }
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
        
        showNotification('内容已复制到剪贴板', 'success');
    } catch (err) {
        console.error('复制失败:', err);
        showNotification('复制失败，请手动复制', 'error');
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

// 转义HTML内容
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
} 