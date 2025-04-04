function $i(e) { return document.getElementById(e) }
function $c(e) { return document.getElementsByClassName(e) }
function $t(e) { return document.getElementsByTagName(e) }

_title = "";

window.onload = function(){
	init();
    if(!isMobileDevice()){
		lightbox();
		var styleElement = document.createElement('style');
		styleElement.type = 'text/css';
		styleElement.textContent = `
			pre:not(.ex) {
				word-wrap: break-word;
				white-space: break-spaces;
			}
		`;
		document.head.appendChild(styleElement);
	}

	function loadPinyinData() {
		if (localStorage.getItem("pinyinData")) {
			// console.log("从 localStorage 读取拼音数据");
			return JSON.parse(localStorage.getItem("pinyinData"));
		}
		// console.log("请求 pinyinData.js 并存入 localStorage");
		var identifier = JSON.parse(localStorage.getItem('identifier'));
		var url;
		if(identifier["protocol_header"] == "https"){
			url = "https://" + document.location.hostname + "/js/pinyinData.js";
		} else {
			url = "http://localhost/js/pinyinData.js";
		}
		return fetch(url)
			.then(response => response.text())
			.then(data => {
				// 解析 pinyinData.js 内容
				eval(data); // 运行 pinyinData.js (确保 pinyinData 变量存在)
				localStorage.setItem("pinyinData", JSON.stringify(pinyinData));
				return pinyinData;
			})
			.catch(error => {
				// console.error("加载 pinyinData.js 失败:", error);
				return null;
			});
	}

	let tooltip = document.createElement("div");
	tooltip.className = "pinyin-tooltip";
	document.body.appendChild(tooltip);

	document.addEventListener("mouseup", function(event) {
		var selection = window.getSelection().toString().trim();
		
		if (selection.length === 1 && /^[\u4e00-\u9fa5]$/.test(selection)) {
			var pinyin = getPinyin(selection);

			if (pinyin) {
				tooltip.innerText = pinyin;
				tooltip.style.left = event.pageX + "px";
				tooltip.style.top = event.pageY + "px";
				tooltip.style.display = "block";
			}
		} else {
			tooltip.style.display = "none";
		}
	});

	function getPinyin(char) {
		var x = loadPinyinData();
		var index = x.indexOf(char);
		if (index !== -1 && index + 1 < x.length) {
			return x[index + 1];
		}
		return null;
	}
}

function init() {
	format();
	
	var identifier = JSON.parse(localStorage.getItem('identifier'));
	if (identifier["resource_type"] !== "txt") {
		code();
		toc();
	}
	
    var isLocal = (identifier["protocol_header"] == "https") ? false : true;
	if (isLocal && identifier["resource_type"] === "html") {
		document.getElementById("s_nav").insertAdjacentHTML("afterend", "<span style='float: left;'><a href='ida://1#" + document.title + "'>edit</a></span>");
	}

	var o = document.createElement('div');
	o.setAttribute("id", "gotop");
	o.innerHTML = "<span>^</span>";
	document.body.appendChild(o);
	o.addEventListener("click", function(){
		window.scrollTo({top: 0})
	})

	identifier["content_loaded"]=new Date().getTime();
	localStorage.setItem("identifier",JSON.stringify(identifier));

	window.addEventListener('message', function(event) {search(event.data);});

	setTimeout(function () {
		var identifier = JSON.parse(localStorage.getItem('identifier'));
		
		if (!localStorage.getItem('positions')) {
			localStorage.setItem('positions', JSON.stringify({}));
		} else {
			var pageTitle = document.title;
			var positions = JSON.parse(localStorage.getItem('positions'));
			var scrollPosition = positions[pageTitle];
			if (scrollPosition !== undefined && identifier["search_jump"] != "1") {
				window.scrollTo(0, parseInt(scrollPosition));
			}
		}

		window.addEventListener('scroll', function (e) {
			var pageTitle = document.title;
			var scrollPosition = window.pageYOffset;
			var positions = JSON.parse(localStorage.getItem('positions'));
			positions[pageTitle] = scrollPosition;
			localStorage.setItem('positions', JSON.stringify(positions));

			if ($i("gotop")) {
				document.body.scrollTop > 500 || document.documentElement.scrollTop > 500 ? $i("gotop").style.display = "block" : $i("gotop").style.display = "none"
			}
		
			if(getClosestH()!=null && toc_flag){
				var aTags = $i("toc-list").querySelectorAll("a");
				for(let i = 0;i<aTags.length;i++){
					if(aTags[i].getAttribute("data") == getClosestH().id)
						aTags[i].classList.add("toc_locate");
					else
						aTags[i].classList.remove("toc_locate");
				}
			}
		}, false);
	}, 100);

	var span = document.createElement('span');
	span.innerHTML="<span accesskey='p' onclick='audio_all_handler(\"p\")'></span><span accesskey='n' onclick='audio_all_handler(\"n\")'></span></span><span accesskey='l' onclick='audio_all_handler(\"l\")'></span><span accesskey='o' onclick='audio_all_handler(\"o\")'></span>"
	span.setAttribute("style", "display:none");
	document.body.appendChild(span);
}

function search(keyword) {
	keyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	let element = document.body;
	let content = element.innerText;
	let regex = new RegExp(keyword, 'gi');
	let matches = content.match(regex);

	if (!matches) {
		console.log('No matches found for keyword ' + keyword);
		return;
	}

	let totalMatches = matches.length;
	let currentIndex = 0;

	function updateIndexDisplay() {
		let indexDisplay = document.getElementById('indexDisplay');
		if (!indexDisplay) {
			indexDisplay = document.createElement('button');
			indexDisplay.id = 'indexDisplay';
			$i("s_nav").appendChild(indexDisplay);

			let destroyButton = document.createElement('button');
			destroyButton.innerText = 'destroy';
			destroyButton.setAttribute("id","destroy");
			destroyButton.onclick = function () {
				var e = document.querySelectorAll(".match-highlight");
				e && e.forEach(function (e) {
					var t = document.createTextNode(e.textContent);
					e.parentNode.insertBefore(t, e); 
					e.parentNode.removeChild(e);
				});
				
				var identifier = JSON.parse(localStorage.getItem('identifier'));
				identifier["search_jump"]="0";
				localStorage.setItem("identifier",JSON.stringify(identifier));
				code();
	
				var x = $i("s_nav");
				x.parentNode.removeChild(x);
			};
			$i("s_nav").appendChild(destroyButton);
		}
		indexDisplay.innerText = ' ' + (currentIndex + 1) + ' / ' + totalMatches;

		let matches = element.querySelectorAll('span.match-highlight');
		matches.forEach((match, index) => {
			match.style.backgroundColor = index === currentIndex ? 'red' : 'yellow';
		});

		if (matches.length > 0) {
			var pageTitle = document.title;
			if(pageTitle !== "观阅记录"){
				matches[currentIndex].scrollIntoView({ block: 'center' });
				var scrollPosition = window.pageYOffset;
				var positions = JSON.parse(localStorage.getItem('positions'));
				positions[pageTitle] = scrollPosition;
				localStorage.setItem('positions', JSON.stringify(positions));
			}
		}
	}

	function getTextNodes(element) {
		let walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
		let textNodes = [];
		while (walker.nextNode()) {
			textNodes.push(walker.currentNode);
		}
		return textNodes;
	}

	function highlightMatches() {
		let textNodes = getTextNodes(element);
		let matchIndex = 0;

		textNodes.forEach(function (node) {
			let matches = node.nodeValue.match(regex);
			if (matches) {
				let fragment = document.createDocumentFragment();
				let lastIndex = 0;

				matches.forEach(function (match) {
					let index = node.nodeValue.indexOf(match, lastIndex);
					let before = document.createTextNode(node.nodeValue.substring(lastIndex, index));
					fragment.appendChild(before);

					let span = document.createElement('span');
					span.className = 'match-highlight';
					span.style.backgroundColor = 'yellow';
					span.appendChild(document.createTextNode(match));
					fragment.appendChild(span);

					lastIndex = index + match.length;
				});

				let after = document.createTextNode(node.nodeValue.substring(lastIndex));
				fragment.appendChild(after);
				node.parentNode.replaceChild(fragment, node);

				matchIndex += matches.length;
			}
		});
	}

	function createNavigationButtons() {
		let prevButton = document.createElement('button');
		prevButton.innerText = 'prev';
		prevButton.onclick = function () {
			currentIndex = (currentIndex - 1 + totalMatches) % totalMatches;
			updateIndexDisplay();
		};

		let nextButton = document.createElement('button');
		nextButton.innerText = 'next';
		nextButton.onclick = function () {
			currentIndex = (currentIndex + 1) % totalMatches;
			updateIndexDisplay();
		};

		$i("s_nav").appendChild(prevButton);
		$i("s_nav").appendChild(nextButton);
	}

	highlightMatches();
	createNavigationButtons();
	updateIndexDisplay();
}

function format() {
	var preTag = document.querySelector('pre');

	var identifier = JSON.parse(localStorage.getItem('identifier'));

	if (preTag && identifier["resource_type"] !== "txt") {
		var childNodes = preTag.childNodes;
		for (var i = 0; i < childNodes.length; i++) {
			if (childNodes[i].nodeType === Node.TEXT_NODE) {
				var e = document.createElement("div");
				e.setAttribute("class", "target");
				e.innerHTML = childNodes[i].nodeValue;
				childNodes[i].parentNode.replaceChild(e, childNodes[i]);
			}
		}
	}

	var d_targets = $c("target");
	var d_reg0 = /(https?:\/\/[^\s]+)/gm;
	var d_str0 = "<a href='$1' target='_blank'>$1</a>";
	var d_reg1 = /(^[^\s].*$)/gm;
	var d_str1 = "<span class='lv0'>$1</span>";
	var d_reg2 = /^\s{4}([^\s].*$)/gm;
	var d_str2 = "<span class='lv0 lv4'>$1</span>";
	var d_reg3 = /^\s{8}([^\s].*$)/gm;
	var d_str3 = "<span class='lv0 lv8'>$1</span>";
	var d_reg4 = /^\s{12}([^\s].*$)/gm;
	var d_str4 = "<span class='lv0 lv12'>$1</span>";
	var d_reg5 = /^\s{13,}([^\s].*$)/gm;
	var d_str5 = "<span class='lv0 lv12'>$1</span>";
	var d_reg6 = /(\d{14}\.(jpg|png|webp|gif))/g;
	var d_str6 = "<img src='../img/$1' title='$1'>";
	for (var i = 0; i < d_targets.length; i++) {
		var innerHTML = d_targets[i].innerHTML;
		innerHTML = innerHTML.replaceAll(d_reg0, d_str0);
		innerHTML = innerHTML.replaceAll(d_reg1, d_str1);
		innerHTML = innerHTML.replaceAll(d_reg2, d_str2);
		innerHTML = innerHTML.replaceAll(d_reg3, d_str3);
		innerHTML = innerHTML.replaceAll(d_reg4, d_str4);
		innerHTML = innerHTML.replaceAll(d_reg5, d_str5);
		innerHTML = innerHTML.replaceAll(d_reg6, d_str6);
		d_targets[i].innerHTML = innerHTML;
	}

	var anchor = document.querySelector("#anchor");
	if (anchor && anchor.textContent.split("-").pop().trim() === "日记") {
		document.querySelectorAll("span").forEach(span => {
			var text = span.textContent.trim();
			if (/^\d{2}$/.test(text)) {
				var h1 = document.createElement("h1");
				h1.textContent = text;
				span.parentNode.replaceChild(h1, span);
			}
		});
	}

	var targets = $t("code");
	for (var i = 0; i < targets.length; i++) {
		targets[i].innerHTML = targets[i].innerHTML.replaceAll(/^\n/gm, "");
	}
	//删除父元素保留子元素
	const wrapper = document.querySelectorAll(".target");
	for (let i = 0; i < wrapper.length; i++) {
		wrapper[i].outerHTML = wrapper[i].innerHTML;
	}

	const paragraphs = document.querySelectorAll('p');
	paragraphs.forEach(paragraph => {
		const lines = paragraph.textContent.trim().split('\n');
		const table = document.createElement('table');
		table.setAttribute("id","tb");
		const tbody = document.createElement('tbody');
		table.appendChild(tbody);
		lines.forEach(line => {
			const cells = line.split(/[：:]/).map(cell => cell.trim());
			const tr = document.createElement('tr');
			cells.forEach(cellContent => {
				const td = document.createElement('td');
				td.textContent = cellContent;
				tr.appendChild(td);
			});
			tbody.appendChild(tr);
		});
		paragraph.replaceWith(table);
	});

	var parts = $i('anchor').innerHTML.split("-");
	var bar = document.createElement("div");
	bar.id = "bar";
	bar.innerHTML = "<span id='s_nav'></span><span id='stamp' title='"+format_date(parts[0])+"'>" + parts[1] + " > " + document.title + "</span><div style='top:0;left:0'><div id='processBar' style='height: 3px; background: violet; width: 0%;'></div></div>";
	document.body.appendChild(bar);

	window.addEventListener('scroll', function (e) {
		var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
		var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
		var bh = document.body.scrollHeight - document.body.clientHeight
		var height = (dh == 0) ? bh : dh;
		var scrolled = (winScroll / height) * 100;
		$i("processBar").style.width = scrolled + "%";
	}, false);

	$i("stamp").ondblclick=function(){
		var identifier = JSON.parse(localStorage.getItem('identifier'));
		identifier["search_jump"]="0";
		localStorage.setItem("identifier",JSON.stringify(identifier));
		document.location.reload()
	}
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function code() {
	var codeElements = document.querySelectorAll('code');
	var identifier = JSON.parse(localStorage.getItem('identifier'));

	if (codeElements.length > 0){
		var styleElement = document.createElement('style');
		styleElement.type = 'text/css';
		if (isMobileDevice()) {
			styleElement.textContent = `
				code {
					font-size: 0.9rem;
					line-height: 1.25rem;
				}
			`;
		} else {
			styleElement.textContent = `
				code {
					font-size: 1.8rem;
					line-height: 2.5rem;
				}
				code::before {
					content: var(--line-numbers);
					position: absolute;
					top: 10px;
					bottom: 10px;
					left: 0;
					text-align: right;
					background-color: #333;
					color: #777;
					outline: #333 solid 100px;
					clip: rect(-100px 2em 9999px 0);
					overflow: hidden;
				}
			`;
		}
		document.head.appendChild(styleElement);
	}

	if (codeElements.length > 0 && identifier["search_jump"] !="1") {
		var script = document.createElement('script');
		script.src = '../js/prism/prism.js';
		document.head.appendChild(script);

		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = '../js/prism/prism.css';
		document.head.appendChild(link);

		script.onload = function () {
			document.querySelectorAll("code").forEach(function(e) {
				var t;
				1 < e.attributes.length ? "null" != (t = e.attributes[0].name) && (e.innerHTML = Prism.highlight(e.textContent, Prism.languages[t], t)) : e.innerHTML = Prism.highlight(e.textContent, Prism.languages.java, "java")
			})
		};

		var resizeObserver = new ResizeObserver(function (entries) {
			for (var entry of entries) {
				if (window.getComputedStyle(entry.target).resize === 'both') {
					var e = entry.target;
					var lineHeight = parseFloat(window.getComputedStyle(e).lineHeight);
					var contentHeight = e.scrollHeight;
					var lineCount = Math.ceil(contentHeight / lineHeight);
					var lines = [];
					for (var i = 1; i <= lineCount; i++) {
						lines.push(i.toString().padStart(2, '0'));
					}
					var lineNumberContent = lines.join('.\\A ') + '.\\A';
					e.style.setProperty('--line-numbers', '"' + lineNumberContent + '"');
				}
			}
		});

		codeElements.forEach(function (codeElement) {
			var lineHeight = parseFloat(window.getComputedStyle(codeElement).lineHeight);
			var contentHeight = codeElement.scrollHeight;
			var lineCount = Math.ceil(contentHeight / lineHeight);
			var lines = [];
			for (var i = 1; i <= lineCount; i++) {
				lines.push(i.toString().padStart(2, '0'));
			}
			var lineNumberContent = lines.join('.\\A ') + '.\\A';
			codeElement.style.setProperty('--line-numbers', '"' + lineNumberContent + '"');
			codeElement.addEventListener('dblclick', function () {
				if (this.contentEditable === 'true') {
					this.contentEditable = 'false';
				} else {
					this.contentEditable = 'true';
				}
				this.classList.toggle('hidden');
			});
			resizeObserver.observe(codeElement);
		});
	}
}

toc_flag=false;
function toc() {
	const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
	if (headings.length > 2) {
		toc_flag=true;
		let tocHTML = "<td><ul id='toc-list'>";
		let stack = [];
		let counters = [0, 0, 0, 0, 0, 0];

		headings.forEach(function (heading) {
			let id = heading.innerText.replace(/\s+/g, "_").toLowerCase();
			let count = 1;
			while (document.getElementById(id)) {
				id = heading.innerText.replace(/\s+/g, "_").toLowerCase() + "_" + count++;
			}
			heading.id = id;

			const level = parseInt(heading.tagName[1]);
			for (let i = level; i < counters.length; i++) {
				counters[i] = 0;
			}
			counters[level - 1]++;

			let numberString = counters.slice(0, level).join(".");
			while (level <= stack.length) {
				tocHTML += "</ul></li>";
				stack.pop();
			}

			tocHTML += "<li><a href='#" + heading.id + "' data='"+heading.id+"'><span class='toc_a_no'>" + numberString + "</span>&nbsp; " + heading.innerText + "</a>";
			tocHTML += "<ul>";
			stack.push(level);
		});

		while (stack.length > 0) {
			tocHTML += "</ul></li>";
			stack.pop();
		}

		const tocDiv = document.createElement("table");
		tocDiv.id = "toc";
		tocDiv.innerHTML = tocHTML + "</ul></td><td id='toc-toggle' class='toc-toggle'>目录</td>";
		document.body.appendChild(tocDiv);

		$i("toc-toggle").addEventListener("click", function () {
			const tocList = $i("toc-list");
			tocList.classList.toggle("hidden");
		});
	}
}

function lightbox() {
	var images = document.querySelectorAll('img');
	if (images.length > 0) {

		var s = document.createElement('style');
		s.textContent = `
        .lightbox {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, .8);
            text-align: center;
            z-index: 100
        }

        .lightbox img {
            max-height: 90%
        }

        .lightbox-nav {
            font-family: cursive;
            font-size: 1.6rem;
            transform: translate(50%, 0);
            position: absolute;
            bottom: 1rem;
            right: 50%;
            color: #696969;
            z-index: 101
        }

        .lightbox-nav span {
            margin: 0 1.6rem;
            cursor: pointer
        }
		`;
		document.head.appendChild(s);

		var currentIndex = 0;
		var scale = 1.0;
		var maxScale = 10.0;
		var minScale = 0.5;
		var scaleStep = 0.1;

		function closeLightbox() {
			var lightbox = document.querySelector('.lightbox');
			lightbox.parentNode.removeChild(lightbox);
			scale = 1.0;
			l_lightbox_status = false;
		}

		function prevImage() {
			scale = 1.0;
			currentIndex = (currentIndex - 1 + images.length) % images.length;
			updateImage();
		}

		function nextImage() {
			scale = 1.0;
			currentIndex = (currentIndex + 1) % images.length;
			updateImage();
		}

		function updateImage() {
			var lightboxImg = document.querySelector('.lightbox-img');
			lightboxImg.src = images[currentIndex].src;
			lightboxImg.style.left = "0px";
			lightboxImg.style.top = "0px";
			var info = document.querySelector('.lightbox-info');
			info.innerHTML = (currentIndex + 1) + '/' + images.length;
			lightboxImg.style.transform = 'scale(' + scale + ')';
		}

		function openLightbox(index,count) {
			currentIndex = index;

			var lightbox = document.createElement('div');
			lightbox.classList.add('lightbox');
			lightbox.style.display = 'flex';
			lightbox.style.alignItems = 'center';
			lightbox.style.justifyContent = 'center';
			document.body.appendChild(lightbox);

			var nav = document.createElement('span');
			nav.classList.add('lightbox-nav');
			nav.classList.add('noselect');
			lightbox.appendChild(nav);

            if(count != 1){
                console.log(count);
                var prevBtn = document.createElement('span');
                prevBtn.innerHTML = 'prev';
                prevBtn.addEventListener('click', function () {
                    prevImage();
                });
                nav.appendChild(prevBtn);
    
                var info = document.createElement('span');
                info.classList.add('lightbox-info');
                info.innerHTML = (currentIndex + 1) + '/' + images.length;
                nav.appendChild(info);
    
                var nextBtn = document.createElement('span');
                nextBtn.innerHTML = 'next';
                nextBtn.addEventListener('click', function () {
                    nextImage();
                });
                nav.appendChild(nextBtn);
            }

            var closeBtn = document.createElement('span');
            closeBtn.innerHTML = 'close';
            closeBtn.addEventListener('click', function () {
                closeLightbox();
            });
            nav.appendChild(closeBtn);

			var lightboxImg = document.createElement('img');
			lightboxImg.src = images[index].src;
			lightboxImg.alt = 'Image';
			lightboxImg.classList.add('lightbox-img');
			lightboxImg.setAttribute("onmouseover", "lightbox_drag(this,this)");
			lightboxImg.addEventListener('dblclick', closeLightbox);
			lightboxImg.style.transform = 'scale(' + scale + ')';
			lightboxImg.addEventListener('wheel', function (event) {
				event.preventDefault();
				if (event.deltaY < 0) {
					scale = Math.min(scale + scaleStep, maxScale);
				} else {
					scale = Math.max(scale - scaleStep, minScale);
				}
				lightboxImg.style.transform = 'scale(' + scale + ')';
			});

			lightbox.appendChild(lightboxImg);

			lightbox.style.display = 'flex';
		}

		images.forEach(function (img, index) {
			img.addEventListener('click', function () {
				openLightbox(index,images.length);
				l_lightbox_status = true;
				l_originalScrollPosition = { x: window.scrollX, y: window.scrollY };
			});
		});

        
        document.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowLeft') {
                prevImage();
            } else if (event.key === 'ArrowRight') {
                nextImage();
            } else if (event.key === 'Escape') {
                closeLightbox();
            }
        });
	}
}

function lightbox_drag(bar, target, callback) {
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

function format_date(datePart) {
	const year = datePart.substring(0, 4);
	const month = parseInt(datePart.substring(4, 6)) - 1; // 月份从0开始计数
	const day = datePart.substring(6, 8);
	const hours = datePart.substring(8, 10);
	const minutes = datePart.substring(10, 12);
	const seconds = datePart.substring(12, 14);
	const date = new Date(year, month, day, hours, minutes, seconds);
	const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' };
	return date.toLocaleDateString('en-US', options);
}

function getClosestH() {
	const hElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  
	let minDistance = Number.MAX_VALUE;
	let closestH = null;
  
	hElements.forEach((hElement) => {
	  const distanceToTop = hElement.getBoundingClientRect().top;
  
	  if (distanceToTop >= 0 && distanceToTop < minDistance) {
		minDistance = distanceToTop;
		closestH = hElement;
	  }
	});
  
	return closestH;
}

function audio_all_handler(m) {
	var identifier = JSON.parse(localStorage.getItem('identifier'));
	identifier["audio_all_handler"]=m;
	localStorage.setItem("identifier",JSON.stringify(identifier));
}