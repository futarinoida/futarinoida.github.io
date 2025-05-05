function $i(e) { return document.getElementById(e) }
function $c(e) { return document.getElementsByClassName(e) }
function $t(e) { return document.getElementsByTagName(e) }
function $f(id) { return document.getElementById(id).contentWindow.document }

window.onload = function () {
    if (!localStorage.getItem('identifier')) {
        var identifier = {};
        identifier["adjust_op"] = "";
        identifier["resource_type"] = "";
        identifier["search_jump"] = "0";
        identifier["content_src"] = "";
        identifier["protocol_header"] = window.location.protocol.split(":")[0];
        localStorage.setItem('identifier', JSON.stringify(identifier));
    }

    search_op();
    $i("search").style.right = ($i("side").offsetWidth + 4) + "px";

    setInterval(function () {
        var identifier = JSON.parse(localStorage.getItem('identifier'));
        var o = identifier["adjust_op"];
        var o2 = identifier["audio_all_handler"];
        if (o != null && o !== "") {
            identifier["adjust_op"] = "";
            localStorage.setItem("identifier", JSON.stringify(identifier));
            adjustFlex(o === "+");
        }

        if (o2 !== null && o2 !== "") {
            audio_all_handler(o2);
            identifier["audio_all_handler"] = "";
            localStorage.setItem("identifier", JSON.stringify(identifier));
        }
    }, 50);

    window.addEventListener('message', function (event) {
        var msg = event.data;
        if (msg === "getPinyinData") {
            // console.log("收到 iframe 请求，发送 pinyinData");
            var pinyinData = localStorage.getItem("pinyinData");
            event.source.postMessage({ pinyinData: pinyinData }, event.origin);
        }
        setTimeout(function () { //必须延迟等待localStorage更新
            var identifier = JSON.parse(localStorage.getItem('identifier'));
            var _type = identifier["resource_type"];
            var song_path = identifier["song_path"];
            var image_path = identifier["image_path"];
            var txt_path = identifier["txt_path"];
            var video_path = identifier["video_path"];

            for (let i = 0; i < data.length; i += 4) {
                var type = data[i + 3];
                if (type === _type) {
                    if (type === "image" && image_path==data[i+2]) {
                        identifier["image_path"] = "";
                        identifier["image_path3"] = data[i+2];
                        localStorage.setItem("identifier", JSON.stringify(identifier));
                        var info = data[i + 1];
                        var imageUrl = data[i + 2].split("../")[1];
                        $i("content").srcdoc = part1 + imageUrl + part2 + info + part3;
                        $i("content").focus()
                        break;
                    }

                    if (type === "video" && video_path==data[i+2]) {
                        identifier["video_path"] = "";
                        identifier["video_path3"] = data[i+2];
                        localStorage.setItem("identifier", JSON.stringify(identifier));
                        var videoUrl = data[i + 2].split("../")[1];
                        $i("content").srcdoc = part11 + videoUrl + part12;
                        $i("content").focus()
                        break;
                    }

                    if (type === "txt" && txt_path==data[i+2]) {
                        identifier["txt_path"] = "";
                        localStorage.setItem("identifier", JSON.stringify(identifier));
                        var path = data[i + 2];
                        var t = path.split(".html")[0];
                        var last = t.split("/").length - 1;
                        if (t.split("/")[last] === msg.split(".txt")[0]) {
                            $i("content").removeAttribute("srcdoc");
                            $i("content").src = path.split("../")[1];
                            $i("content").focus()
                            break;
                        }
                    }

                    if (type === "audio" && song_path == data[i + 2]) {
                        identifier["song_path"] = "";
                        localStorage.setItem("identifier", JSON.stringify(identifier));
                        var last = song_path.split("/").length - 1;
                        var song = song_path.split("/")[last];
                        audio(song, song_path.split(song)[0]);
                        break;
                    }
                }
            }
        }, 50);
    });

    var lastSrc = "";
    var debounceTimer = null;
    var observer = new MutationObserver(function (mutationsList) {
        for (var mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                var newSrc = mutation.target.getAttribute('src');
                if (newSrc !== lastSrc) {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => { // 防抖
                        var identifier = JSON.parse(localStorage.getItem('identifier')) || {};
                        identifier["content_src"] = newSrc;
                        localStorage.setItem("identifier", JSON.stringify(identifier));
    
                        lastSrc = newSrc;
                    }, 50);
                }
            }
        }
    });
    observer.observe(document.getElementById('content'), { attributes: true });
    
    var span = document.createElement('span');
	span.innerHTML="<span accesskey='p' onclick='audio_all_handler(\"p\")'></span><span accesskey='n' onclick='audio_all_handler(\"n\")'></span></span><span accesskey='l' onclick='audio_all_handler(\"l\")'></span><span accesskey='o' onclick='audio_all_handler(\"o\")'></span>"
    span.setAttribute("style", "display:none");
    document.body.appendChild(span);
}

function adjustFlex(isExpand) {
    const contentFlex = parseInt(window.getComputedStyle($i("content")).flexGrow);
    const sideFlex = parseInt(window.getComputedStyle($i("side")).flexGrow);
    var d = 5, max = 85, min = 15;
    if (isExpand) {
        $i("content").style.flex = ((contentFlex - d) < min ? contentFlex : contentFlex - d).toString();
        $i("side").style.flex = ((sideFlex + d) > max ? sideFlex : sideFlex + d).toString();
        $i("search").style.right = ($i("side").offsetWidth + 4) + "px";
    } else {
        $i("content").style.flex = ((contentFlex + d) > max ? contentFlex : contentFlex + d).toString();
        $i("side").style.flex = ((sideFlex - d) < min ? sideFlex : sideFlex - d).toString();
        $i("search").style.right = ($i("side").offsetWidth + 4) + "px";
    }
}

function search_op() {
    function showSearchHistoryByTime() {
        $i("searchHistory").innerHTML = "";
        $i("searchHistory").style.display = "block";
        const history = JSON.parse(localStorage.getItem("searchHistory")) || [];

        history.sort((a, b) => b.timestamp - a.timestamp);
        history.forEach(item => {
            const option = document.createElement("option");
            option.text = item.keyword;
            $i("searchHistory").appendChild(option);
        });

        $i("searchHistory").options.length > 10 ? $i("searchHistory").setAttribute("size", "10") : $i("searchHistory").setAttribute("size", $i("searchHistory").options.length);
    }

    function loadContent(selectedIndex) {
        var type = $i("searchResults").options[selectedIndex].dataset.type;
        var title = $i("searchResults").options[selectedIndex].dataset.title;
        var path = $i("searchResults").options[selectedIndex].dataset.path;
        if (type == "html") {
            $i("content").removeAttribute("srcdoc");
            poll_left_status(title);
            $i("side").contentWindow.postMessage(title, '*');
        } else if (type == "pdf") {
            $i("content").removeAttribute("srcdoc");
            $i("content").src = path;
            $i("side").contentWindow.postMessage("../"+path, '*');
        } else if (type == "epub") {
            $i("content").removeAttribute("srcdoc");
            var identifier = JSON.parse(localStorage.getItem('identifier'));
            if(identifier["protocol_header"] == "https"){
                $i("content").src = "https://" + document.location.hostname + "/js/bibi/?book=" + path.split("../book/")[1];
            } else {
                $i("content").src = "http://localhost/js/bibi/?book=" + path.split("../book/")[1];
            }
            $i("side").contentWindow.postMessage(path, '*');
        } else if (type == "txt") {
            $i("content").removeAttribute("srcdoc");
            $i("content").src = path;
            $i("side").contentWindow.postMessage("../"+path, '*');
        } else if (type == "image") {
            var imageUrl = path;
            var info = $i("searchResults").options[selectedIndex].dataset.info;
            $i("content").srcdoc = part1 + imageUrl + part2 + info + part3;
            $i("side").contentWindow.postMessage("../"+path, '*');
        } else if (type == "video") {
            var videoUrl = path;
            $i("content").srcdoc = part11 + videoUrl + part12;
            $i("side").contentWindow.postMessage("../"+path, '*');
        } else if (type == "audio") {
            if ($i("audio")) {
                $i("audio").parentNode.removeChild($i("audio"));
                $i("music").parentNode.removeChild($i("music"));
            }
            var identifier = JSON.parse(localStorage.getItem('identifier'));
            identifier["song_path2"] = path + title;
            localStorage.setItem("identifier", JSON.stringify(identifier));
            setTimeout(function () {
                audio(title, path);
            }, 50);
            $i("side").contentWindow.postMessage( path + title, '*');
        }
    }

    $i("searchInput").addEventListener("input", function () {
        let e = this.value.trim();
        if ("" === e) {
            updateSearchResults([]);
            showSearchHistoryByTime();
            return;
        }
        updateSearchResults(search(e));
        var identifier = JSON.parse(localStorage.getItem('identifier'));
        identifier["keyword"] = e;
        localStorage.setItem("identifier", JSON.stringify(identifier));

        $i("searchHistory").innerHTML = "";
        $i("searchHistory").style.display = "block";
        const history = JSON.parse(localStorage.getItem("searchHistory")) || [];

        const matchingHistory = history.filter(item => item.keyword.startsWith(e)).length === 0 ? history.filter(item => item.keyword.includes(e)) : history.filter(item => item.keyword.startsWith(e));

        if (matchingHistory.length === 0) {
            showSearchHistoryByTime();
        } else {
            matchingHistory.forEach(item => {
                const option = document.createElement("option");
                option.text = item.keyword;
                $i("searchHistory").appendChild(option);
            });
        }

        $i("searchHistory").options.length > 10 ? $i("searchHistory").setAttribute("size", "10") : $i("searchHistory").setAttribute("size", $i("searchHistory").options.length);
    }),

    $i("searchInput").addEventListener("focus", function () {
        $i("searchHistory").innerHTML = "";
        $i("searchHistory").style.display = "block";
        const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
        history.forEach(item => {
            const option = document.createElement("option");
            option.text = item.keyword;
            $i("searchHistory").appendChild(option);
        });

        $i("searchHistory").options.length > 10 ? $i("searchHistory").setAttribute("size", "10") : $i("searchHistory").setAttribute("size", $i("searchHistory").options.length)
    }),

    $i("searchInput").addEventListener("click", function () {
        this.select();
    }),

    $i("searchHistory").addEventListener("click", function () {
        $i("searchInput").value = this.options[this.selectedIndex].text;
        $i("searchInput").focus();
        let e = $i("searchInput").value;
        updateSearchResults(search(e));
        var identifier = JSON.parse(localStorage.getItem('identifier'));
        identifier["keyword"] = e;
        localStorage.setItem("identifier", JSON.stringify(identifier));
    }),

    $i("searchInput").addEventListener("paste", function () {
        setTimeout(search, 0)
    }),

    $i("searchInput").addEventListener("keydown", function (e) {
        let select = $i('searchResults');
        if (e.keyCode === 40 | e.keyCode === 13) { // Down arrow key
            e.preventDefault();
            select.focus();
            select.selectedIndex = 0;

            const keyword = $i("searchInput").value.trim();
            if (keyword !== "") {

                const history = JSON.parse(localStorage.getItem("searchHistory")) || [];

                const existingIndex = history.findIndex(item => item.keyword === keyword);
                if (existingIndex !== -1) {
                    history.splice(existingIndex, 1);
                }
                history.push({
                    keyword,
                    timestamp: new Date().getTime()
                });
                history.sort((a, b) => b.timestamp - a.timestamp);
                localStorage.setItem("searchHistory", JSON.stringify(history));
            }
        }
    }),

    $i("searchResults").addEventListener("keydown", function (e) {
        if (e.key === "Enter" && this.selectedIndex >= 0) {
            loadContent(this.selectedIndex);
        }
    }),

    $i("searchResults").addEventListener("click", function () {
        if (this.selectedIndex >= 0) {
            loadContent(this.selectedIndex);
        }

        const keyword = $i("searchInput").value.trim();
        if (keyword !== "") {
            const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
            const existingIndex = history.findIndex(item => item.keyword === keyword);
            if (existingIndex !== -1) {
                history.splice(existingIndex, 1);
            }
            history.push({
                keyword,
                timestamp: new Date().getTime()
            });
            history.sort((a, b) => b.timestamp - a.timestamp);
            localStorage.setItem("searchHistory", JSON.stringify(history));
        }
    }),

    $i("clear").addEventListener("click", function () {
        $i("searchInput").value = "",
            updateSearchResults([]);
        $i("searchHistory").innerHTML = "";
        $i("searchHistory").style.display = "none";
    }),

    new ResizeObserver(() => {
        $i("searchResults").style.left = 0 - $i("searchResults").offsetWidth + "px"
    }).observe($i("searchResults")), updateSearchResults([])
}

function debounce(fn, delay) {
    if (window.debounceTimer) {
        clearTimeout(window.debounceTimer);
    }
    window.debounceTimer = setTimeout(fn, delay);
}

function poll_left_status(selectedTitle) {
    debounce(() => { // 防抖
        if (window.pollIntervalId) {
            clearInterval(window.pollIntervalId);
            window.pollIntervalId = null;
        }

        var identifier = JSON.parse(localStorage.getItem('identifier')) || {};
        identifier["content_loaded"] = new Date().getTime();
        let o = identifier["content_loaded"];

        identifier["search_jump"] = "1";
        localStorage.setItem("identifier", JSON.stringify(identifier));

        window.pollIntervalId = setInterval(function () {
            var identifier = JSON.parse(localStorage.getItem('identifier')) || {};
            if (identifier["content_loaded"] !== o) {
                $i("content").contentWindow.postMessage(identifier["keyword"], '*');
                clearInterval(window.pollIntervalId);
                window.pollIntervalId = null;
            }
        }, 200);

        $i("content").src = "html/" + selectedTitle + ".html";
    }, 100);
}

function updateSearchResults(results) {
    let select = $i('searchResults');
    select.innerHTML = '';
    if (results.length === 0) {
        $i('searchResults').setAttribute("style", "display:none");
    } else {
        results.forEach(result => {
            let option = document.createElement('option');
            option.text = `${result.title} [${result.count}]`;
            option.dataset.title = `${result.title}`;
            option.dataset.path = `${result.path}`;
            option.dataset.type = `${result.type}`;
            option.dataset.info = `${result.info}`;
            if (result.type == "image") {
                option.style.color = "blue";
            }
            if (result.type == "pdf") {
                option.style.color = "tomato";
            }
            if (result.type == "epub") {
                option.style.color = "mediumturquoise";
            }
            if (result.type == "txt") {
                option.style.color = "gray";
            }
            select.add(option);
        });
        if ($i('searchResults').options.length > 10)
            $i('searchResults').setAttribute("size", "10");
        else
            $i('searchResults').setAttribute("size", $i('searchResults').options.length);
        $i('searchResults').setAttribute("style", "display:block;left:" + (0 - $i('searchResults').offsetWidth) + "px");
    }
}

function search(keyword) {
    if ("string" != typeof keyword) return [];
    keyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let results = [];
    let keywordRegex = new RegExp(keyword, 'gi');
    for (let i = 0; i < data.length; i += 4) {
        let title = data[i];
        let content = data[i + 1];
        let path = data[i + 2];
        let type = data[i + 3];
        let info = "";
        if (type == "image") {
            path = path.split("../")[1];
            info = content;
        }
        if (type == "video") {
            title = path.split("/")[path.split("/").length - 1];
            path = path.split("../")[1];
        }
        if (type == "pdf") {
            path = path.split("../")[1];
            title = path.split("/")[path.split("/").length - 1];
        }
        if (type == "txt") {
            title = path.split(".html")[0].split("/")[path.split(".html")[0].split("/").length - 1]+".txt";
            path = path.split("../")[1];
        }
        if (type == "epub") {
            title = path.split("/")[path.split("/").length - 1];
        }
        if (type == "audio") {
            title = path.split("/")[path.split("/").length - 1];
            path = path.split(title)[0];
        }
        // let count = ((type == "pdf") ? 0 : (content.match(keywordRegex) || []).length) + (title.match(keywordRegex) || []).length;
        let count = ((content.match(keywordRegex) || []).length) + (title.match(keywordRegex) || []).length;
        if (count > 0) {
            results.push({ title, count, type, path, info });
        }
    }
    results.sort((a, b) => b.count - a.count);
    return results;
}

part1 = `
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
        body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #333;
            position: relative;
            overflow: hidden;
        }
        .span-container {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: plum;
        }
        .span-container span {
            margin-bottom: 5px;
            padding:0 10px;
            cursor:pointer;
        }
        p{
            position:absolute;
            top:0;
            left:0;
        }
        img{
            z-index:1;
            max-height:100vh;
            max-width:100vw;
        }
    </style>
</head>
<body>
<img src="`, part2 = `" id="img" onmouseover="drag(this,this)">
<div class="span-container">
    <span id="c"></span>
    <span id="p">prev</span>
    <span id="i"></span>
    <span id="n">next</span>
</div>
<p>
`, part3 = `</p>
<script>
var img = document.getElementById('img');
img.style.border = img.src.endsWith('.PHOTOSPHERE.jpg') ? "2px red solid" : "none";
img.title = img.src.endsWith('.PHOTOSPHERE.jpg') ? "双击图片进入全景预览" : "";
var scale = 1.0;
var maxScale = 10.0;
var minScale = 0.5;
var scaleStep = 0.1;
img.addEventListener('wheel', function (event) {
    event.preventDefault();
    if (event.deltaY < 0) {
        scale = Math.min(scale + scaleStep, maxScale);
    } else {
        scale = Math.max(scale - scaleStep, minScale);
    }
    img.style.transform = 'scale(' + scale + ')';
});

function drag(bar, target, callback) {
	var params = {
		left: 0,
		top: 0,
		currentX: 0,
		currentY: 0,
		flag: false
	};

	function getCss(o, key) {
		return o.currentStyle ? o.currentStyle[key] : document.defaultView.getComputedStyle(o, false)[key];
	}

	if (getCss(target, "left") !== "auto") {
		params.left = getCss(target, "left");
	}
	if (getCss(target, "top") !== "auto") {
		params.top = getCss(target, "top");
	}
	bar.onmousedown = function (event) {
		params.flag = true;
		if (!event) {
			event = window.event;
			bar.onselectstart = function () {
				return false;
			}
		}
		var e = event;
		params.currentX = e.clientX;
		params.currentY = e.clientY;
	};
	document.onmouseup = function () {
		params.flag = false;
		if (getCss(target, "left") !== "auto") {
			params.left = getCss(target, "left");
		}
		if (getCss(target, "top") !== "auto") {
			params.top = getCss(target, "top");
		}
	};
	document.onmousemove = function (event) {
		var e = event ? event : window.event;

		if (params.flag) {
			var nowX = e.clientX,
				nowY = e.clientY;
			var disX = nowX - params.currentX,
				disY = nowY - params.currentY;
			target.style.left = parseInt(params.left) + disX + "px";
			target.style.top = parseInt(params.top) + disY + "px";
			target.style.position = "relative";

			if (typeof callback == "function") {
				callback((parseInt(params.left) || 0) + disX, (parseInt(params.top) || 0) + disY);
			}

			if (event.preventDefault) {
				event.preventDefault();
			}
			return false;
		}
	}
}


var identifier = JSON.parse(localStorage.getItem('identifier'));
var path = "../gallery/"+decodeURIComponent(document.getElementById("img").src).split("gallery/")[1];
var identifier = JSON.parse(localStorage.getItem('identifier'));
identifier["image_path2"]=path;
localStorage.setItem("identifier", JSON.stringify(identifier));
var imagelist = JSON.parse(localStorage.getItem('imagelist'));
var cur_im_index = imagelist.indexOf(path);
var _category = path.split(path.split("/")[path.split("/").length-1])[0].split("../gallery/")[1];
var category = _category == "" ? "未分类" : _category;

document.getElementById("p").addEventListener('click', function () {
    var identifier = JSON.parse(localStorage.getItem('identifier'));
    identifier["image_path"]=imagelist[(cur_im_index -1 + imagelist.length) % imagelist.length];
    localStorage.setItem("identifier",JSON.stringify(identifier));
    top.postMessage("1", "*");
});

document.getElementById("i").innerHTML=(cur_im_index + 1) + '/' + imagelist.length + "<input title='space = focus, enter = go' style='width:60px' id='jump' type='text' onclick='select(this)'></input>";

document.getElementById("c").innerHTML="["+category+"]";

document.getElementById("n").addEventListener('click', function () {
    var identifier = JSON.parse(localStorage.getItem('identifier'));
    identifier["image_path"]=imagelist[(cur_im_index +1) % imagelist.length];
    localStorage.setItem("identifier",JSON.stringify(identifier));
    top.postMessage("1", "*");
});

document.getElementById("jump").addEventListener("keypress",
function (e) {
    var evt = window.event || e;
    var i = evt.keyCode;
    switch (i) {
        case 13://enter
            e.preventDefault();
            var n = (isNaN(parseInt(e.target.value)) || parseInt(e.target.value) > imagelist.length || parseInt(e.target.value)<1) ? null : parseInt(e.target.value);
            var identifier = JSON.parse(localStorage.getItem('identifier'));
            identifier["image_path"]=imagelist[n-1];
            localStorage.setItem("identifier",JSON.stringify(identifier));
            top.postMessage("1", "*");
            break;
    }
}
, false);

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        event.preventDefault();
        var input = document.getElementById('jump');
        input.focus();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
        document.getElementById("p").click();
    } else if (event.key === 'ArrowRight') {
        document.getElementById("n").click();
    } 
});

img.addEventListener('dblclick', function () {
    if (img.src.endsWith('.PHOTOSPHERE.jpg')) {
        const newWindow = window.open();
        const path = "/gallery/" + decodeURIComponent(img.src).split("gallery")[1];
        newWindow.document.write(
            '<!DOCTYPE html>' +
            '<html>' +
            '<head>' +
            '<meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<title>360° media viewer - Marzipano</title>' +
            '<style>html, body { height: 100%; margin: 0; } #pano { width: 100%; height: 100%; }</style>' +
            '</head>' +
            '<body>' +
            '<div id="pano"></div>' +
            '<script>' +
            'const identifier = JSON.parse(localStorage.getItem("identifier")) || {};' +
            'const protocol = identifier.protocol_header === "https" ? "https" : "http";' +
            'const host = location.hostname || "localhost";' +
            'const jsUrl = protocol + "://" + host + "/js/marzipano.js";' +

            'const script = document.createElement("script");' +
            'script.src = jsUrl;' +
            'script.onload = function () {' +
              'var viewer = new Marzipano.Viewer(document.getElementById("pano"));' +
              'var source = Marzipano.ImageUrlSource.fromString(protocol + "://" + host + "' + path + '");' +
              'var geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);' +
              'var limiter = Marzipano.RectilinearView.limit.traditional(4096, 100 * Math.PI / 180);' +
              'var view = new Marzipano.RectilinearView(null, limiter);' +
              'var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });' +
              'scene.switchTo();' +
            '};' +
            'document.body.appendChild(script);' +
            '<\\/script>' +
            '</body>' +
            '</html>'
        );
        newWindow.document.close(); 
    } 
});

</script>
</body>
</html>
`;

part11 = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
        body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #000;
        }
        video {
            max-width: 100%;
            max-height: 100%;
        }
        .span-container {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: plum;
        }
        .span-container span {
            margin-bottom: 5px;
            padding:0 10px;
            cursor:pointer;
        }
    </style>
</head>
<body>
<video id="video" controls loop>
<source id="source" src="`, part12 = `" type="video/mp4">
Your browser does not support the video tag.
</video>
<div class="span-container" title="z:前 c:后 x:全屏 空格:播放/停止 a:退3秒 d:进3秒 w:音量加 d:音量减">
    <span id="c"></span>
    <span id="p">prev</span>
    <span id="i"></span>
    <span id="n">next</span>
</div>
<script>
var identifier = JSON.parse(localStorage.getItem('identifier'));
var path = "../video/"+decodeURIComponent(document.getElementById("source").src).split("video/")[1];
var identifier = JSON.parse(localStorage.getItem('identifier'));
identifier["video_path2"]=path;
localStorage.setItem("identifier", JSON.stringify(identifier));
var videolist = JSON.parse(localStorage.getItem('videolist'));
var cur_vi_index = videolist.indexOf(path);
var _category = path.split(path.split("/")[path.split("/").length-1])[0].split("../video/")[1];
var category = _category == "" ? "未分类" : _category;

document.getElementById("p").addEventListener('click', function () {
    var identifier = JSON.parse(localStorage.getItem('identifier'));
    identifier["video_path"]=videolist[(cur_vi_index -1 + videolist.length) % videolist.length];
    localStorage.setItem("identifier",JSON.stringify(identifier));
    top.postMessage("1", "*");
});

document.getElementById("i").innerHTML=(cur_vi_index + 1) + '/' + videolist.length + "<input style='width:60px' id='jump' type='text' onclick='select(this)'></input>";

document.getElementById("c").innerHTML="["+category+"]";

document.getElementById("n").addEventListener('click', function () {
    var identifier = JSON.parse(localStorage.getItem('identifier'));
    identifier["video_path"]=videolist[(cur_vi_index +1) % videolist.length];
    localStorage.setItem("identifier",JSON.stringify(identifier));
    top.postMessage("1", "*");
});

document.getElementById("jump").addEventListener("keypress",
function (e) {
    var evt = window.event || e;
    var i = evt.keyCode;
    switch (i) {
        case 13://enter
            e.preventDefault();
            var n = (isNaN(parseInt(e.target.value)) || parseInt(e.target.value) > videolist.length || parseInt(e.target.value)<1) ? null : parseInt(e.target.value);
            var identifier = JSON.parse(localStorage.getItem('identifier'));
            identifier["video_path"]=videolist[n-1];
            localStorage.setItem("identifier",JSON.stringify(identifier));
            top.postMessage("1", "*");
            break;
    }
}
, false);

document.getElementById("video").volume = 0.2;

document.addEventListener('keydown', function(event) {
    var video = document.getElementById('video');

    if (event.key === 'z') {
        document.getElementById("p").click();
    } else if (event.key === 'c') {
        document.getElementById("n").click();
    } else if (event.key === 'ArrowRight' || event.key === 'd') {
        video.currentTime += 3;
    } else if (event.key === 'ArrowLeft' || event.key === 'a') {
        video.currentTime -= 3;
    } else if (event.key === 'ArrowUp' || event.key === 'w') {
        video.volume = Math.min(1, video.volume + 0.1);
    } else if (event.key === 'ArrowDown' || event.key === 's') {
        video.volume = Math.max(0, video.volume - 0.1);
    } else if (event.code === 'Space') {
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    } else if (event.key === 'x') {
        if (document.fullscreenElement !== video) {
            video.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
});

</script>
</body>
</html>`;

function audio(_song, _level, ...etc) {
    audioInitialized = true;
    if (!$i("audio_css")) {
        var style = document.createElement('style');
        style.setAttribute("id", "audio_css");
        style.textContent =
            `
.current{
    background-color: #98fda5;
}
#audio {
    width: 350px;
}
.active {
    font-weight: bold;
    color: red;
}
.active2 {
    border: black 1px solid;
    background-color: rgb(0, 255, 64);
}
#audio li:hover {
    cursor: pointer;
    background: #98fda5;
}
#audio li {
    list-style: decimal;
}
.audio-progress {
    float: left;
    width: 15px;
    height: 100vh;
    background-color: #96c0f7;
    cursor: pointer;
}
.audio-progress-bar {
    bottom: 0px;
    width: 100%;
    background-color: pink;
    height: 23.9913%;
}
.audio_div{
    margin-left: 30px;
}
/* 隐藏默认进度条 */
audio::-webkit-media-controls-timeline {
    display: none;
}
audio::-moz-media-controls-timeline {
    display: none;
}
audio::-ms-media-controls-timeline {
    display: none;
}
audio::media-controls-timeline {
    display: none;
}
audio {
    padding: 50px;
    display: block;
    width: 200px;
}
.playlist {
    overflow-y: scroll;
    margin-top: 20px;
    max-height: 60vh;
}
.header {
    background: black;
    color: white;
}
.fav{
    color: red;
}
`;
        document.head.appendChild(style);
    }

    if ($i("audio")) {
        $i("audio").parentNode.removeChild($i("audio"))
    }

    var flag = false;
    if (etc.length > 0) {
        flag = true;
    }

    var songs;
    var currentSongIndex;
    var isShuffle;
    if (!flag) {
        songs = JSON.parse(localStorage.getItem("playlist"));
        currentSongIndex = songs.indexOf(_song);
    } else {
        isShuffle = true;
    }

    var isSingleLoop = false;
    var isListLoop = false;

    var audioPlayer = document.createElement("audio");
    audioPlayer.setAttribute("id", "_audio");
    audioPlayer.controls = true;
    audioPlayer.volume = 0.3;

    var div = document.createElement("div");
    div.classList.add("audio_div");

    var header = document.createElement("div");
    header.classList.add("header");
    if (!flag) {
        header.innerHTML = _level.split("audio/")[1].length == 0 ? "未分类/" : _level.split("audio/")[1];
    }

    var playlistElement = document.createElement("ul");
    playlistElement.classList.add("playlist");
    playlistElement.setAttribute("id", "_playlist");

    var playerContainer = document.createElement("div");
    playerContainer.setAttribute("id", "audio");
    if (flag) {
        playerContainer.setAttribute("style", "display:none");
    }

    var favList = document.createElement('button');
    favList.innerHTML = "Favorite Songs";
    favList.addEventListener("click", () => {
        songs = JSON.parse(localStorage.getItem("favList"));
        if (songs.length > 0) {
            $i("_playlist").innerHTML = '';
            $i("_audio").src = ''
            currentSongIndex = 0;
            $c("header")[0].innerHTML = 'Favorite Songs'
            songs.forEach((song, index) => {
                var listItem = document.createElement("li");
                listItem.textContent = song.split("/")[song.split("/").length - 1];
                listItem.setAttribute("data-path", song);
                listItem.setAttribute("title", song.split(song.split("/")[song.split("/").length - 1])[0].split("audio/")[1]);
                listItem.addEventListener("click", () => {
                    currentSongIndex = index;
                    playSong(song);
                });
                $i("_playlist").appendChild(listItem);
            });
            $i("_playlist").getElementsByTagName("li")[0].click();
        }
    });

    var all = document.createElement('button');
    all.innerHTML = "All";
    all.addEventListener("click", () => {
        var all = [];
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] === "audio") {
                all.push(data[i - 1]);
            }
        }
        if (all.length > 0) {
            songs = all;
            $i("_playlist").innerHTML = '';
            $i("_audio").src = ''
            currentSongIndex = 0;
            $c("header")[0].innerHTML = 'All'
            songs.forEach((song, index) => {
                var listItem = document.createElement("li");
                listItem.textContent = song.split("/")[song.split("/").length - 1];
                listItem.setAttribute("data-path", song);
                listItem.setAttribute("title", song.split(song.split("/")[song.split("/").length - 1])[0].split("audio/")[1]);
                listItem.addEventListener("click", () => {
                    currentSongIndex = index;
                    $i("shuffleButton").classList.toggle("active2", isShuffle);
                    playSong(song);
                });
                $i("_playlist").appendChild(listItem);
            });
            $i("_playlist").getElementsByTagName("li")[flag ? Math.floor(Math.random() * songs.length) : 0].click();
        }
    });

    var fav = document.createElement('button');
    fav.addEventListener("click", _fav);
    fav.innerHTML = "+Fav-";
    fav.setAttribute("id", "fav");

    var close = document.createElement('button');
    close.innerHTML = "destroy";
    close.addEventListener("click", () => {
        $i("music").parentNode.removeChild($i("music"));
        $i("audio").parentNode.removeChild($i("audio"));
    });
    close.setAttribute("style", "width:300px");

    var shuffleButton = document.createElement("button");
    shuffleButton.setAttribute("id", "shuffleButton");
    shuffleButton.textContent = "Shuffle";
    shuffleButton.addEventListener("click", () => {
        isShuffle = !isShuffle;
        if (isShuffle) {
            isListLoop = false;
            isSingleLoop = false;
            listLoopButton.classList.remove("active2");
            singleLoopButton.classList.remove("active2");
        }
        shuffleButton.classList.toggle("active2", isShuffle);
    });

    var singleLoopButton = document.createElement("button");
    singleLoopButton.textContent = "Single Loop";
    singleLoopButton.addEventListener("click", () => {
        isSingleLoop = !isSingleLoop;
        isListLoop = false;
        if (isSingleLoop) {
            isShuffle = false;
            shuffleButton.classList.remove("active2");
        }
        singleLoopButton.classList.toggle("active2", isSingleLoop);
        listLoopButton.classList.remove("active2");
    });

    var listLoopButton = document.createElement("button");
    listLoopButton.textContent = "List Loop";
    listLoopButton.addEventListener("click", () => {
        isListLoop = !isListLoop;
        isSingleLoop = false;
        if (isListLoop) {
            isShuffle = false;
            shuffleButton.classList.remove("active2");
        }
        listLoopButton.classList.toggle("active2", isListLoop);
        singleLoopButton.classList.remove("active2");
    });

    var prevButton = document.createElement("button");
    prevButton.textContent = "Prev";
    prevButton.addEventListener("click", () => {
        if (isShuffle) {
            currentSongIndex = Math.floor(Math.random() * songs.length);
        } else {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        }
        playSong($i("_playlist").getElementsByTagName("li")[currentSongIndex].dataset.path);
    });

    var nextButton = document.createElement("button");
    nextButton.setAttribute("id", "audio_next");
    nextButton.textContent = "Next";
    nextButton.addEventListener("click", () => {
        if (isShuffle) {
            currentSongIndex = Math.floor(Math.random() * songs.length);
        } else {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
        }
        playSong($i("_playlist").getElementsByTagName("li")[currentSongIndex].dataset.path);
    });

    var progressContainer = document.createElement("div");
    progressContainer.classList.add("audio-progress");
    progressContainer.innerHTML = "<div class='audio-progress-bar' id='progressBar'></div>"
    progressContainer.addEventListener("click", (e) => {
        var clickY = e.clientY - progressContainer.getBoundingClientRect().top;
        var percent = clickY / progressContainer.clientHeight;
        audioPlayer.currentTime = percent * audioPlayer.duration;
    });

    var close = document.createElement('button');
    close.innerHTML = "destroy";
    close.addEventListener("click", () => {
        $i("music").parentNode.removeChild($i("music"));
        $i("audio").parentNode.removeChild($i("audio"));
        audioInitialized = false;
    });
    close.setAttribute("style", "width:300px");
    
    div.appendChild(header);
    div.appendChild(playlistElement);
    var br = document.createElement('br');
    div.appendChild(br);
    div.appendChild(prevButton);
    div.appendChild(nextButton);
    var br = document.createElement('br');
    div.appendChild(br);
    div.appendChild(favList);
    div.appendChild(all);
    var br = document.createElement('br');
    div.appendChild(br);
    div.appendChild(shuffleButton);
    div.appendChild(singleLoopButton);
    div.appendChild(listLoopButton);
    var br = document.createElement('br');
    div.appendChild(br);
    div.appendChild(fav);

    var identifier = JSON.parse(localStorage.getItem('identifier'));
    var isLocal = (identifier["protocol_header"] == "https") ? false : true;
    if(isLocal) {
        var export_btn = document.createElement('button');
        export_btn.innerHTML = "Exp";
        export_btn.addEventListener("click", () => {
            let favData = localStorage.getItem("favList");
            if (!favData) {
                alert("未找到favList！");
                return;
            }
            try {
                let fileList = JSON.parse(favData);
                let m3uContent = "#EXTM3U\n";
                fileList.forEach(fileUrl => {
                    let localPath = fileUrl.replace("file:///E:/Dropbox/life/", "/storage/emulated/0/Download/");
                    m3uContent += localPath + "\n";
                });
    
                // 生成 Blob 并创建下载链接
                let blob = new Blob([m3uContent], { type: "audio/x-mpegurl" });
                let a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "favList.m3u8"; // 下载文件, 拖进dropbox, 手机dropbox保存到设备, AIMP导入播放列表
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (e) {
                alert("数据格式错误：" + e.message);
            }
        });
        div.appendChild(export_btn);
        
        function handleFile(input) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                const text = event.target.result;
                processM3U8(text);
            };
            reader.readAsText(file);
        }

        function processM3U8(m3uContent) {
            let lines = m3uContent.split("\n");
            let fileList = [];
            lines.forEach(line => {
                line = line.trim();
                if (line && !line.startsWith("#")) {
                    let originalPath = line.replace("/storage/emulated/0/Download/", "file:///E:/Dropbox/life/");
                    fileList.push(originalPath);
                }
            });
            localStorage.setItem("favList", JSON.stringify(fileList));
        }

        var fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".m3u8";
        fileInput.style.display = "none";
        fileInput.addEventListener("change", function() {
            handleFile(this);
        });
        document.body.appendChild(fileInput);

        var import_btn = document.createElement('button');
        import_btn.innerHTML = "Imp";
        import_btn.addEventListener("click", () => {
            fileInput.click();
        });
        div.appendChild(import_btn);
    }

    div.appendChild(audioPlayer);
    div.appendChild(close);
    playerContainer.appendChild(progressContainer);
    playerContainer.appendChild(div);
    document.body.appendChild(playerContainer);

    if (!flag) {
        songs.forEach((song, index) => {
            var listItem = document.createElement("li");
            listItem.textContent = song;
            listItem.addEventListener("click", () => {
                currentSongIndex = index;
                playSong();
            });
            playlistElement.appendChild(listItem);
        });
        backfill();
    }

    var buttonElement = document.createElement('button');
    buttonElement.setAttribute("id", "music");
    buttonElement.innerHTML = "o = show/hide; p = play/pause; l = like; n = next sh_music";
    buttonElement.setAttribute("onclick", "javascript:if(document.getElementById('audio').style.display != 'none'){document.getElementById('audio').style.display='none'}else{document.getElementById('audio').style.display='block'}");
    buttonElement.setAttribute("style", "position:fixed;bottom:25px;right:5px;");
    document.body.appendChild(buttonElement);

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                const items = JSON.parse(localStorage.getItem("favList")) || [];
                if (items.includes(decodeURIComponent($i("_audio").src))) {
                    $i("fav").classList.add("active");
                } else {
                    $i("fav").classList.remove("active");
                }
                $i("fav").removeEventListener("click", _fav);
                $i("fav").addEventListener("click", _fav);
                backfill();
            }
        }
    });
    observer.observe(audioPlayer, { attributes: true });

    flag ? all.click() : playSong();

    function playSong(p) {
        audioPlayer.removeEventListener("timeupdate", onTimeupdate);
        audioPlayer.removeEventListener("ended", onSongEnded);
        audioPlayer.src = p == null ? _level + songs[currentSongIndex] : p;
        audioPlayer.play();
        highlightCurrentSong();
        backfill();
        var originalDisplay = $i("audio").style.display;
        $i("audio").style.display = "block"; //必要,none时scrollIntoView无效
        $i("_playlist").getElementsByClassName("current")[0].scrollIntoView({ block: 'center' });
        $i("audio").style.display = originalDisplay;
        audioPlayer.addEventListener("timeupdate", onTimeupdate);
        audioPlayer.addEventListener("ended", onSongEnded);
    }

    function onSongEnded() {
        if (isSingleLoop) {
            audioPlayer.play();
        } else if (isListLoop) {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playSong($i("_playlist").getElementsByTagName("li")[currentSongIndex].dataset.path);
        } else if (isShuffle) {
            currentSongIndex = Math.floor(Math.random() * songs.length);
            playSong($i("_playlist").getElementsByTagName("li")[currentSongIndex].dataset.path);
        }

        var originalDisplay = $i("audio").style.display;
        $i("audio").style.display = "block";
        $i("_playlist").getElementsByClassName("current")[0].scrollIntoView({ block: 'center' });
        $i("audio").style.display = originalDisplay;
    }

    function onTimeupdate() {
        if ($i("progressBar")) { //避免绑定了事件的元素被移除时报错
            var percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            $i("progressBar").style.height = percent + "%";
        }

    }

    function highlightCurrentSong() {
        var listItems = playlistElement.querySelectorAll("li");
        listItems.forEach((item, index) => {
            item.classList.toggle("current", index === currentSongIndex);
        });
    }

    function _fav() {
        const items = JSON.parse(localStorage.getItem("favList")) || [];
        const currentSrc = decodeURIComponent($i("_audio").src);
        if (items.includes(currentSrc)) {
            const updatedItems = items.filter(item => item !== currentSrc);
            localStorage.setItem("favList", JSON.stringify(updatedItems));
            $i("fav").classList.remove("active");
        } else {
            items.push(currentSrc);
            localStorage.setItem("favList", JSON.stringify(items));
            $i("fav").classList.add("active");
        }
        backfill();
    }

    function backfill() {
        const items = JSON.parse(localStorage.getItem("favList")) || [];
        var items2 = Array.from(items).map(e => e.split("/")[e.split("/").length - 1]);
        const listItems = Array.from($i("_playlist").querySelectorAll("li"));
        listItems.forEach((item) => {
            if (items2.includes(item.innerHTML)) {
                item.classList.add("fav");
            } else {
                item.classList.remove("fav");
            }
        });
    }
}

audioInitialized = false;
function audio_all() {
    let clickCount = 0;
    return function (key) {
        if (key == "n" && audioInitialized) {
            $i("audio_next").click();
        } else if (key == "l" && audioInitialized) {
            $i("fav").click();
        } else if (key == "o" && audioInitialized) {
            $i("music").click();
        } else if (key == "p") {
            clickCount++;
            var audioElement = $i('_audio');
            if (clickCount === 1 || !audioInitialized) {
                audioInitialized = true;
                audio(0, 0, 1);
            } else if (clickCount % 2 === 0) {
                audioElement.pause();
            } else {
                audioElement.play();
            }
        }
    };
}
var audio_all_handler = audio_all();

setInterval(function(){
    var alertSizeB = 1024*1024*4;
    var totalSize = 0;
    for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage.getItem(key).length;
        }
    }
    var totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    document.getElementById("searchInput").setAttribute("title", totalSizeMB + " MB");
    if (totalSize > alertSizeB) {
        alert('localStorage 超过容量限制!');
    }
}, 5000);