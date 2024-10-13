// Kiểm tra xem service worker có hỗ trợ trong trình duyệt hay không
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Đăng ký service worker
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });

        // Kiểm tra trạng thái kết nối và thông báo cho người dùng
        window.addEventListener('online', () => {
            console.log('Bạn đã kết nối lại với Internet.');
        });

        window.addEventListener('offline', () => {
            console.log('Bạn đã mất kết nối Internet. Một số tính năng có thể không khả dụng.');
        });
    });
}

// Chức năng lưu trữ video vào IndexedDB
function saveVideoToIndexedDB(videoUrl) {
    const request = indexedDB.open('myVideoDB', 1);

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('videos', { keyPath: 'url' });
    };

    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction('videos', 'readwrite');
        const store = transaction.objectStore('videos');

        // Lưu video vào IndexedDB
        store.put({ url: videoUrl });
    };

    request.onerror = (event) => {
        console.log('Lỗi khi mở IndexedDB:', event.target.error);
    };
}

// Lấy video từ IndexedDB
function getVideoFromIndexedDB(videoUrl, callback) {
    const request = indexedDB.open('myVideoDB', 1);

    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction('videos', 'readonly');
        const store = transaction.objectStore('videos');

        const getRequest = store.get(videoUrl);
        getRequest.onsuccess = (event) => {
            callback(event.target.result);
        };

        getRequest.onerror = (event) => {
            console.log('Lỗi khi lấy video từ IndexedDB:', event.target.error);
        };
    };

    request.onerror = (event) => {
        console.log('Lỗi khi mở IndexedDB:', event.target.error);
    };
}

// Thay thế nguồn video bằng video từ IndexedDB nếu có
function loadVideo(videoUrl) {
    getVideoFromIndexedDB(videoUrl, (video) => {
        const videoPlayer = document.getElementById('videoPlayer');
        const videoSource = document.getElementById('videoSource');

        if (video) {
            videoSource.src = video.url; // Nếu có video trong IndexedDB
        } else {
            videoSource.src = videoUrl; // Nếu không có video trong IndexedDB
            saveVideoToIndexedDB(videoUrl); // Lưu video vào IndexedDB
        }

        videoPlayer.load();
        videoPlayer.play();
    });
}

// Tự động tải video đầu tiên khi tải trang
window.addEventListener('load', () => {
    loadVideo('video1.mp4');
});

// Chuyển video tự động sau khi kết thúc
const videoPlayer = document.getElementById('videoPlayer');
const videos = ['video1.mp4', 'video2.mp4'];
let currentVideo = 0;

videoPlayer.addEventListener('ended', function() {
    currentVideo = (currentVideo + 1) % videos.length;
    loadVideo(videos[currentVideo]); // Tải video tiếp theo
});

