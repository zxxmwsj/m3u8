(function () {
    let hlsInstance = null;

    function setStatus(message) {
        const status = document.getElementById('player-status');
        if (status) {
            status.textContent = message || '';
        }
        if (message) {
            console.warn(message);
        }
    }

    function resetVideo(video) {
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }

        video.pause();
        video.removeAttribute('src');
        video.load();
    }

    function attachHls(video, url, autoplay) {
        hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: true
        });

        hlsInstance.on(Hls.Events.ERROR, function (_, data) {
            if (!data.fatal) {
                return;
            }

            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                setStatus('视频加载失败，请检查地址和跨域设置。');
                hlsInstance.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                setStatus('视频格式无法解码，正在尝试恢复。');
                hlsInstance.recoverMediaError();
            } else {
                setStatus('当前视频无法播放，请更换 M3U8 地址。');
                hlsInstance.destroy();
                hlsInstance = null;
            }
        });

        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
            setStatus('');
            if (autoplay) {
                video.play().catch(function () {
                    setStatus('视频已加载，请点击播放按钮开始播放。');
                });
            }
        });
    }

    window.setupHlsPlayer = function (videoId, url, options) {
        const video = document.getElementById(videoId);
        const settings = options || {};

        if (!video || !url) {
            setStatus('请输入有效的 M3U8 地址。');
            return null;
        }

        resetVideo(video);
        setStatus('正在加载视频…');

        if (window.Hls && Hls.isSupported()) {
            attachHls(video, url, settings.autoplay !== false);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.addEventListener('loadedmetadata', function () {
                setStatus('');
                if (settings.autoplay !== false) {
                    video.play().catch(function () {
                        setStatus('视频已加载，请点击播放按钮开始播放。');
                    });
                }
            }, { once: true });
        } else {
            setStatus('当前浏览器不支持 HLS 播放。');
        }

        return hlsInstance;
    };
})();
