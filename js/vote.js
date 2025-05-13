// 初始化投票数据

// 提交投票
// 删除与单投票系统相关的旧代码
// 移除以下过时函数：
// function submitVote() { ... }
// function updateResults() { ... }

// 新增多投票系统结果更新
function updateResults() {
    const code = new URLSearchParams(window.location.search).get('code');
    const votesDB = initVotesDB();
    const currentVote = votesDB[code];
    
    if (!currentVote) {
        console.error('投票不存在');
        return;
    }

    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    const total = Object.values(currentVote.options).reduce((a, b) => a + b, 0);
    
    // 添加参与人数显示
    resultsDiv.innerHTML = `
        <div class="total-participants">
            <i class="fas fa-users"></i> 总参与人数：${total}
        </div>
        ${Object.entries(currentVote.options)
            .map(([option, count]) => `
                <div class="result-bar">
                    <div class="result-fill" style="width: ${(count/total)*100 || 0}%">
                        ${option}: ${count}票 (${Math.round((count/total)*100)}%)
                    </div>
                </div>
            `).join('')}
    `;
}

// 在updateResults函数后添加新函数
function refreshResults() {
    const code = new URLSearchParams(window.location.search).get('code');
    const votesDB = initVotesDB();
    if (votesDB[code]) {
        updateResults();
    }
}

// 修复初始化逻辑
document.addEventListener('DOMContentLoaded', () => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
        const votesDB = initVotesDB();
        if (votesDB[code]) {
            refreshResults();
        }
    }
    if (document.getElementById('voteHistory')) {
        renderHistory();
    }
});

// 新增刷新功能
function refreshResults() {
    const refreshBtn = document.querySelector('.refresh-btn');
    // 添加元素存在性检查
    if (!refreshBtn) return;

    updateResults();
    refreshBtn.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> 刷新中...`;
    
    setTimeout(() => {
        refreshBtn.innerHTML = `<i class="fas fa-sync-alt"></i> 刷新结果`;
    }, 1000);
}

// 初始化时显示结果
document.addEventListener('DOMContentLoaded', () => {
    // 确保DOM完全加载后再执行
    if (document.getElementById('results')) {
        refreshResults();
    }
    if (document.getElementById('voteHistory')) {
        renderHistory();
    }
});

// 生成6位随机码
function generateCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// 显示创建面板
// Existing correct declaration (no changes needed)
function showCreatePanel() {
    document.querySelectorAll('.mode-select, .join-panel').forEach(el => el.classList.add('hidden'));
    document.querySelector('.create-panel').classList.remove('hidden');
}

// 显示加入面板
function showJoinPanel() {
    document.querySelectorAll('.mode-select, .create-panel').forEach(el => el.classList.add('hidden'));
    document.querySelector('.join-panel').classList.remove('hidden');
}

// 创建新投票
function initVotesDB() {
    return JSON.parse(localStorage.getItem('votesDB') || '{}');
}

function saveVotesDB(data) {
    localStorage.setItem('votesDB', JSON.stringify(data));
}

// 修改后的createVote函数
// 新增选项管理功能
let optionCounter = 1;

// 修改选项添加功能
function addOptionField(event) {
    if (!event) return;
    
    const btn = event.target.closest('button');
    if (!btn) return;

    const container = document.getElementById('optionsContainer');
    const currentRow = btn.closest('.option-row');
    
    const newRow = document.createElement('div');
    newRow.className = 'option-row';
    newRow.innerHTML = `
        <input type="text" class="option-input" placeholder="输入选项内容">
        <div class="button-group">
            <button class="remove-option-btn" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times-circle"></i>
            </button>
            <button class="add-option-btn" onclick="addOptionField(event)">
                <i class="fas fa-plus-circle"></i>
            </button>
        </div>
    `;
    
    // 移除当前行的加号按钮
    currentRow.querySelector('.button-group').lastElementChild.remove();
    container.appendChild(newRow);
    setupOptionButtons(); // 新增按钮状态初始化
}

// 修改createVote函数，添加创建者标识
function createVote() {
    const votesDB = initVotesDB();
    const title = document.getElementById('voteTitle').value;
    const options = Array.from(document.querySelectorAll('.option-input'))
        .map(input => input.value.trim())
        .filter(text => text !== '');
    
    if (!title || title.trim().length < 3 || options.length < 2) {
        alert('请填写有效标题（至少3字符）并添加至少两个选项');
        return;
    }

    const creatorId = localStorage.getItem('userIdentifier') || generateUserIdentifier();
    const code = generateCode();  // First declaration (keep this)
    
    const voteData = {
        title: title,
        options: options.reduce((acc, cur) => { acc[cur] = 0; return acc; }, {}),
        created: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        creator: creatorId,
        votedUsers: []
    };
    
    // 从URL参数中获取并同步投票数据 (rename duplicate variable)
    const urlParams = new URLSearchParams(window.location.search);
    const urlCode = urlParams.get('code');  // Renamed to avoid conflict
    const encodedData = urlParams.get('data');
    
    if (encodedData) {
        try {
            const importedVoteData = JSON.parse(decodeURIComponent(encodedData));  // Renamed to avoid conflict
            const importedVotesDB = initVotesDB();  // Renamed to avoid conflict
            importedVotesDB[urlCode] = importedVoteData; 
            saveVotesDB(importedVotesDB);
        } catch (err) {
            console.error('投票数据解析失败:', err);
            alert('无效的分享链接，请检查后重试');
        }
    }

    votesDB[code] = voteData;  // Use original 'code' variable here
    saveVotesDB(votesDB);

    // 提示用户分享完整链接
    const shareUrl = `${window.location.origin}/vote.html?code=${code}`;  // Add missing shareUrl definition
    alert(`投票创建成功！\n请分享以下链接给他人参与：\n${shareUrl}`);
}

// 修复renderHistory函数中的变量引用
function renderHistory() {
    const currentUser = localStorage.getItem('userIdentifier');
    const votesDB = initVotesDB(); // 新增DB初始化
    
    // 新增：获取历史记录容器并检查存在性
    const historyDiv = document.getElementById('voteHistory');
    if (!historyDiv) return; // 避免在无容器页面报错
    
    const items = Object.entries(votesDB)
        .sort((a, b) => new Date(b[1].lastActive) - new Date(a[1].lastActive))
        .map(([code, data]) => `
            <div class="history-item">
                <div>
                    <strong>${data.title}</strong><br>
                    <small>创建时间：${new Date(data.created).toLocaleString()}</small>
                </div>
                <div>
                    ${data.creator === currentUser ? `
                    <button class="delete-btn" onclick="deleteVote('${code}')">
                        <i class="fas fa-trash-alt"></i> 删除
                    </button>
                    ` : ''}
                    <button class="copy-btn" onclick="copyCode('${code}')">
                        <i class="fas fa-copy"></i> 复制
                    </button>
                </div>
            </div>
        `).join('');
    
    historyDiv.innerHTML = items || '<div class="no-history">暂无历史记录</div>';
}

// 修改加入投票函数
function joinVote(event) {
    event.preventDefault();
    const code = document.getElementById('voteCode').value.trim().toUpperCase();
    const votesDB = initVotesDB();
    
    if (code.length !== 6) {
        alert('请输入6位有效投票码');
        return;
    }
    
    // 优先检查本地是否已有数据（兼容直接输入码的情况）
    if (votesDB[code]) {
        window.location.href = `vote.html?code=${code}`;
    } else {
        // 提示用户需要通过分享链接访问
        alert('请通过创建者提供的完整链接参与投票');
    }
}

// 更新历史记录模板中的事件绑定
function submitVote() {
    const code = new URLSearchParams(window.location.search).get('code');
    const votesDB = initVotesDB();
    const currentVote = votesDB[code];
    const userId = localStorage.getItem('userIdentifier') || generateUserIdentifier();
    
    if (!currentVote) return;
    if (currentVote.votedUsers.includes(userId)) {
        alert('您已经投过票了！');
        return;
    }

    const selected = document.querySelector('input[name="vote"]:checked');
    if (!selected) {
        alert('请先选择一个选项！');
        return;
    }

    // 更新投票数据
    currentVote.options[selected.value]++;
    currentVote.votedUsers.push(userId);
    currentVote.lastActive = new Date().toISOString();
    
    saveVotesDB(votesDB);
    
    // 新增：记录已投票状态（关键修复）
    localStorage.setItem(`voted_${code}`, 'true');
    
    // 主动触发结果更新（实时显示关键）
    updateResults();
    
    // 禁用界面
    localStorage.setItem('userIdentifier', userId);
    document.querySelectorAll('input[type="radio"]').forEach(radio => radio.disabled = true);
    document.querySelector('.submit-btn').disabled = true;
    document.querySelector('.submit-btn').textContent = '已投票';
}

// 修改删除按钮事件处理逻辑
function setupOptionButtons() {
    document.querySelectorAll('.remove-option-btn').forEach(btn => {
        btn.onclick = function() {
            const row = this.closest('.option-row');
            row.remove();
            
            // 删除后重新校验按钮状态
            const allRows = document.querySelectorAll('.option-row');
            allRows.forEach((row, index) => {
                const addBtn = row.querySelector('.add-option-btn');
                if (addBtn) {
                    addBtn.style.display = index === allRows.length - 1 ? 'block' : 'none';
                }
            });
        };
    });
}

// 修改选项添加函数
// 修改后的选项添加函数
function addOptionField(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const btn = event.target.closest('button.add-option-btn');
    if (!btn) return;

    const container = document.getElementById('optionsContainer');
    const currentRow = btn.closest('.option-row');
    
    const newRow = document.createElement('div');
    newRow.className = 'option-row';
    newRow.innerHTML = `
        <input type="text" class="option-input" placeholder="输入选项内容">
        <div class="button-group">
            <button class="remove-option-btn">
                <i class="fas fa-times-circle"></i>
            </button>
            <button class="add-option-btn">
                <i class="fas fa-plus-circle"></i>
            </button>
        </div>
    `;

    container.insertBefore(newRow, currentRow.nextSibling);
    
    // 绑定新行按钮事件
    newRow.querySelector('.add-option-btn').addEventListener('click', addOptionField);
    newRow.querySelector('.remove-option-btn').addEventListener('click', function() {
        this.closest('.option-row').remove();
        updateAddButtons();
    });

    // 更新当前行按钮状态
    currentRow.querySelector('.add-option-btn').style.display = 'none';
    updateAddButtons();
}

function updateAddButtons() {
    const allRows = document.querySelectorAll('.option-row');
    allRows.forEach((row, index) => {
        const addBtn = row.querySelector('.add-option-btn');
        const removeBtn = row.querySelector('.remove-option-btn');
        
        if (addBtn) {
            addBtn.style.display = index === allRows.length - 1 ? 'block' : 'none';
        }
        if (removeBtn) {
            removeBtn.style.display = allRows.length > 1 ? 'block' : 'none';
        }
    });
}

// 在初始化时绑定第一个添加按钮
document.addEventListener('DOMContentLoaded', () => {
    const initialAddBtn = document.querySelector('.add-option-btn');
    if (initialAddBtn) {
        initialAddBtn.addEventListener('click', addOptionField);
    }
});

// 新增用户标识生成函数
function generateUserIdentifier() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

function showMain() {
    // Show main mode select and hide other panels
    document.querySelectorAll('.mode-select').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.create-panel, .join-panel').forEach(el => el.classList.add('hidden'));
}

// Add missing copyCode function
function copyCode(code) {
    const shareUrl = `${window.location.origin}/vote.html?code=${code}`;
    // Create temporary input to copy text
    const tempInput = document.createElement('input');
    tempInput.value = shareUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert('投票链接已复制到剪贴板！');
}

// Add missing deleteVote function
function deleteVote(code) {
    const votesDB = initVotesDB();
    if (votesDB[code]) {
        delete votesDB[code];
        saveVotesDB(votesDB);
        renderHistory(); // Refresh history after deletion
        alert('投票已成功删除');
    } else {
        alert('投票不存在或已删除');
    }
}
