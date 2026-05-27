// Firebase SDK Imports (Using CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Firebase Configuration ---
// 가이드북을 참고하여 실제 파이어베이스 설정을 아래에 입력하세요.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let db;
let isFirebaseConnected = false;

try {
    // If you haven't set up Firebase yet, this might fail. We'll handle it gracefully.
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseConnected = true;
    console.log("Firebase initialized");
} catch (error) {
    console.warn("Firebase config is missing or invalid. Using local storage for demonstration.");
}

// --- DOM Elements ---
const postsList = document.getElementById('posts-list');
const postForm = document.getElementById('post-form');
const openModalBtn = document.getElementById('open-modal');
const modal = document.getElementById('post-modal');
const closeBtn = document.querySelector('.close-btn');

// --- Modal Logic ---
if (openModalBtn) openModalBtn.onclick = () => modal.style.display = 'block';
if (closeBtn) closeBtn.onclick = () => {
    if (modal) modal.style.display = 'none';
    const contactModal = document.getElementById('contact-modal');
    if (contactModal) contactModal.style.display = 'none';
};

window.openContactModal = () => {
    const contactModal = document.getElementById('contact-modal');
    if (contactModal) contactModal.style.display = 'block';
};

window.closeContactModal = () => {
    const contactModal = document.getElementById('contact-modal');
    if (contactModal) contactModal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target == modal) modal.style.display = 'none';
    const contactModal = document.getElementById('contact-modal');
    if (event.target == contactModal) contactModal.style.display = 'none';
};

// --- Posts CRUD Logic ---

// Load Posts
export async function loadPosts() {
    if (!postsList) return;
    postsList.innerHTML = ''; // Clear current list

    const lang = localStorage.getItem('site-lang') || 'ko';

    if (isFirebaseConnected && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        // Firebase Realtime Updates
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
            postsList.innerHTML = '';
            snapshot.forEach((doc) => {
                const post = doc.data();
                renderPost(post.title, post.content, post.createdAt?.toDate(), lang);
            });
        });
    } else {
        // Fallback to LocalStorage for demo
        const localPosts = JSON.parse(localStorage.getItem('posts') || '[]');
        if (localPosts.length === 0) {
            const noPostsMsg = lang === 'ko' ? "등록된 게시글이 없습니다. 첫 글을 작성해보세요!" : "No posts yet. Be the first to write one!";
            postsList.innerHTML = `<p class="loading">${noPostsMsg}</p>`;
        } else {
            localPosts.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(post => {
                renderPost(post.title, post.content, new Date(post.date), lang);
            });
        }
    }
}

// Render Post Card
function renderPost(title, content, date, lang) {
    const card = document.createElement('div');
    card.className = 'post-card';
    const dateStr = date ? date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US') : (lang === 'ko' ? '방금 전' : 'Just now');
    card.innerHTML = `
        <span class="date">${dateStr}</span>
        <h3>${title}</h3>
        <p>${content}</p>
    `;
    postsList.appendChild(card);
}

// Add New Post
postForm.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const lang = localStorage.getItem('site-lang') || 'ko';

    if (isFirebaseConnected && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        try {
            await addDoc(collection(db, "posts"), {
                title,
                content,
                createdAt: new Date()
            });
            modal.style.display = 'none';
            postForm.reset();
        } catch (e) {
            alert(lang === 'ko' ? "Firebase 등록 중 오류가 발생했습니다." : "Error registering with Firebase.");
        }
    } else {
        // Mocking with LocalStorage
        const localPosts = JSON.parse(localStorage.getItem('posts') || '[]');
        localPosts.push({ title, content, date: new Date().toISOString() });
        localStorage.setItem('posts', JSON.stringify(localPosts));
        modal.style.display = 'none';
        postForm.reset();
        loadPosts();
    }
};

// Initial Load for posts
loadPosts();
window.loadPosts = loadPosts; // Expose for i18n logic
