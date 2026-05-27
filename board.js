

let posts = [];
let currentPostId = null;
let currentFilter = "";

// --- Define Global Functions First so UI works even if DB fails ---
window.openWriteModal = function() { 
    const modal = document.getElementById('write-modal');
    if (modal) modal.style.display = 'flex'; 
};
window.closeWriteModal = function() { 
    const modal = document.getElementById('write-modal');
    if (modal) modal.style.display = 'none'; 
};
window.closePostDetail = function() { 
    const modal = document.getElementById('post-detail');
    if (modal) modal.style.display = 'none'; 
    currentPostId = null;
};
window.openContactModal = function() { 
    const modal = document.getElementById('contact-modal');
    if (modal) modal.style.display = 'flex'; 
};
window.closeContactModal = function() { 
    const modal = document.getElementById('contact-modal');
    if (modal) modal.style.display = 'none'; 
};
window.onclick = function(event) {
    if (event.target.className === 'post-detail-modal') {
        window.closePostDetail();
        window.closeWriteModal();
        window.closeContactModal();
    }
};

window.openPostDetail = function(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    currentPostId = id;
    document.getElementById('modal-title').innerText = post.title;
    document.getElementById('modal-author').innerText = post.author;
    document.getElementById('modal-date').innerText = post.date;
    document.getElementById('post-body-content').innerText = post.content;
    
    window.renderComments(post.comments);
    document.getElementById('post-detail').style.display = 'flex';
};

window.renderComments = function(comments) {
    const list = document.getElementById('comment-list');
    const count = document.getElementById('comment-count');
    if (!list || !count) return;
    list.innerHTML = "";
    count.innerText = `댓글 ${comments ? comments.length : 0}`;
    
    if (comments) {
        comments.forEach(c => {
            const div = document.createElement('div');
            div.className = "comment-item";
            div.innerHTML = `
                <div class="comment-header"><span>${c.author}</span><span>${c.date}</span></div>
                <div class="comment-body">${c.text}</div>
            `;
            list.appendChild(div);
        });
    }
};

window.searchPosts = function() {
    const filter = document.getElementById('searchInput').value;
    renderPosts(filter);
};

window.submitComment = async function() {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text || !currentPostId) return;
    
    const newComment = {
        author: "익명 테스터",
        date: new Date().toLocaleString(),
        text: text
    };
    
    try {
        const postRef = window.db.collection("posts").doc(currentPostId);
        input.value = ""; // 입력창 미리 초기화하여 중복 방지
        await postRef.update({
            comments: firebase.firestore.FieldValue.arrayUnion(newComment)
        });
    } catch (e) {
        alert("댓글 작성 중 오류가 발생했습니다. 파이어베이스 연동을 확인해주세요.");
        console.error("Firebase Comment Error:", e);
    }
};

window.saveNewPost = async function() {
    const title = document.getElementById('post-title-input').value.trim();
    const author = document.getElementById('post-author-input').value.trim();
    const content = document.getElementById('post-content-input').value.trim();
    
    if (!title || !author || !content) {
        alert("모든 필드를 입력해주세요.");
        return;
    }
    
    const newPost = {
        title,
        author,
        content,
        category: "Q&A",
        comments: [],
        createdAt: new Date()
    };
    
    try {
        // 창을 먼저 닫고 입력창을 초기화하여 중복 클릭 방지 및 빠른 피드백 제공
        window.closeWriteModal();
        
        document.getElementById('post-title-input').value = "";
        document.getElementById('post-author-input').value = "";
        document.getElementById('post-content-input').value = "";
        
        await window.db.collection("posts").add(newPost);
        alert("게시글이 성공적으로 등록되었습니다.");
    } catch (e) {
        alert("게시글 등록 중 오류가 발생했습니다. 파이어베이스 권한이나 설정을 확인해주세요.");
        console.error("Firebase Add Post Error:", e);
    }
};

// Read from Firestore (Realtime)
try {
    const q = window.db.collection("posts").orderBy("createdAt", "desc");
    q.onSnapshot((snapshot) => {
        posts = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                title: data.title,
                author: data.author || "익명 작성자",
                date: data.createdAt ? data.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString(),
                content: data.content,
                category: data.category || "Q&A",
                comments: data.comments || []
            });
        });
        renderPosts(currentFilter);
        // If a post is currently open, update its comments
        if (currentPostId) {
            const currentPost = posts.find(p => p.id === currentPostId);
            if (currentPost) {
                window.renderComments(currentPost.comments);
            } else {
                window.closePostDetail(); // Post was deleted
            }
        }
    }, (error) => {
        console.error("Firebase onSnapshot error:", error);
    });
} catch (error) {
    console.error("Firebase init error:", error);
}

function renderPosts(filter = "") {
    currentFilter = filter;
    const tbody = document.getElementById('board-body');
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const filteredPosts = posts.filter(p => 
        p.title.toLowerCase().includes(filter.toLowerCase()) ||
        p.author.toLowerCase().includes(filter.toLowerCase()) ||
        p.content.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (filteredPosts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 3rem; color: #888;">게시글이 없습니다.</td></tr>`;
        return;
    }
    
    filteredPosts.forEach((post, index) => {
        const tr = document.createElement('tr');
        const tagClass = post.category === 'Notice' ? 'tag-tech' : 'tag-qna';
        // Display index for UI purposes since Firestore IDs are strings
        const displayId = posts.length - index; 
        tr.innerHTML = `
            <td>${displayId}</td>
            <td><span class="post-tag ${tagClass}">${post.category}</span> ${post.title}</td>
            <td>${post.author}</td>
            <td>${post.date}</td>
        `;
        tr.onclick = () => window.openPostDetail(post.id);
        tbody.appendChild(tr);
    });
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            window.searchPosts();
        }
    });
}
