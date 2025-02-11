window.onload = function(){
	let links = document.querySelectorAll('#html a, #program a');
	for (let i = 0; i < links.length; i++) {
		links[i].addEventListener("click",function(){
			var identifier = JSON.parse(localStorage.getItem('identifier'));
			var x = identifier["search_jump"];
			if(x == "1"){
				identifier["search_jump"]="0";
			}
			identifier["resource_type"]="html";
			localStorage.setItem("identifier",JSON.stringify(identifier));
		});

		const date = parse_date(links[i].dataset.stamp);
		const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' };
		links[i].setAttribute("title", date.toLocaleDateString('en-US', options));
	}

	function updateRecentLinks() {
		let now = new Date();
		let cut_off_point = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        let allUlElements = document.querySelectorAll("ul");
        allUlElements.forEach(ul => {
            let links = ul.querySelectorAll("a");
            let totalLinks = links.length;
            let recentCount = 0;

            links.forEach(link => {
				if (link.hasAttribute("data-stamp")) {
					const date = parse_date(link.dataset.stamp);
					if (date >= cut_off_point) {
						link.classList.add("recent");
						recentCount++;
					} else {
						link.classList.remove("recent");
					}
				}
            });

            let categorySpan = ul.previousElementSibling;
            if (categorySpan && categorySpan.classList.contains("category")) {
                if (recentCount > 0) {
                    let opacity = 0.2 + (recentCount / totalLinks) * 0.8; // 0.2 ~ 1.0
                    categorySpan.style.backgroundColor = `rgba(255, 100, 100, ${opacity})`;
                    categorySpan.setAttribute("data-count", `[${recentCount}/${totalLinks}]`);
                } else {
                    categorySpan.style.backgroundColor = "";
                    categorySpan.setAttribute("data-count", `[${totalLinks}]`);
				}
            }
		});
	}
	updateRecentLinks();
	setInterval(updateRecentLinks, 60 * 1000);

	document.querySelectorAll('a').forEach(function(element) {
		element.addEventListener('click', function(e) {
			document.querySelectorAll('li').forEach(l => l.classList.remove('current'));
			this.parentElement.classList.add('current');
		});
	});

	document.querySelectorAll('#book a').forEach(function(element) {
		let fileType = element.innerText.split('.').pop().toLowerCase();
		if (fileType === "pdf") {
			element.href = element.dataset.path;
		} else if(fileType === "txt") {
			element.addEventListener('click', function(e) {
				var identifier = JSON.parse(localStorage.getItem('identifier')) || {};
				identifier["resource_type"] = "txt";
				identifier["txt_path"] = e.target.dataset.path;
				localStorage.setItem("identifier", JSON.stringify(identifier));
				top.postMessage(e.target.innerText, "*");
			});
		} else if(fileType === "epub") {
			element.addEventListener('click', function(e) {
				var identifier = JSON.parse(localStorage.getItem('identifier'));
				if(identifier["protocol_header"] == "https"){
					element.href = "https://" + document.location.hostname + "/js/bibi/?book=" + e.target.dataset.path.split("../book/")[1];
				} else {
					element.href = "http://localhost/js/bibi/?book=" + e.target.dataset.path.split("../book/")[1];
				}
			});
		}
	});

	document.querySelectorAll('#gallery a').forEach(function(element) {
		element.addEventListener('click', function(e) {
			var identifier = JSON.parse(localStorage.getItem('identifier'));
			identifier["resource_type"]="image";
			identifier["image_path"]=e.target.dataset.path;
			localStorage.setItem("identifier",JSON.stringify(identifier));

			var group = Array.from(element.parentElement.parentElement.children)
				.filter(child => child.tagName === 'LI')
				.map(li => li.querySelector('a'))
				.filter(a => a !== null);
			localStorage.setItem("imagelist", JSON.stringify(group.map(a => a.dataset.path)));

			top.postMessage(e.target.innerText, "*");
		});
	});

	document.querySelectorAll('#audio a').forEach(function(element) {
		element.addEventListener('click', function(e) {
			var identifier = JSON.parse(localStorage.getItem('identifier'));
			identifier["resource_type"]="audio";
			identifier["song_path"]=e.target.dataset.path;
			localStorage.setItem("identifier",JSON.stringify(identifier));
			var group = Array.from(element.parentElement.parentElement.children)
				.filter(child => child.tagName === 'LI')
				.map(li => li.querySelector('a'))
			localStorage.setItem("playlist", JSON.stringify(group.map(a => a.textContent)));
			top.postMessage(e.target.innerText, "*");
		});
	});

	document.querySelectorAll('#video a').forEach(function(element) {
		element.addEventListener('click', function(e) {
			var identifier = JSON.parse(localStorage.getItem('identifier'));
			identifier["resource_type"]="video";
			identifier["video_path"]=e.target.dataset.path;
			localStorage.setItem("identifier",JSON.stringify(identifier));

			var group = Array.from(element.parentElement.parentElement.children)
				.filter(child => child.tagName === 'LI')
				.map(li => li.querySelector('a'))
				.filter(a => a !== null);
			localStorage.setItem("videolist", JSON.stringify(group.map(a => a.dataset.path)));

			top.postMessage(e.target.innerText, "*");
		});
	});
	
	document.querySelectorAll('#gallery li,#audio li,#video li').forEach(function(element) {
		element.addEventListener('dblclick', function() {
			copyToClipboard(element.textContent);
		});
	});

	document.querySelectorAll('#html li,#program li').forEach(function(element) {
		element.addEventListener('dblclick', function() {
			copyToClipboard(element.textContent+".html");
		});
	});

	document.querySelectorAll('#book li').forEach(function(element) {
		let fileType = element.innerText.split('.').pop().toLowerCase();
		if (fileType === "pdf" || fileType === "epub" ) {
			element.addEventListener('dblclick', function() {
				copyToClipboard(element.textContent);
			});
		} else if(fileType === "txt") {
			element.addEventListener('dblclick', function() {
            copyToClipboard(element.textContent.trim().replace(/\.txt$/i, ".html"));
			});
		}
	});

	document.querySelectorAll('#gallery li,#book li,#audio li,#video li,#html li').forEach(function(element) {
		element.setAttribute("title","双击复制文件名");
	});

	document.getElementById("a").addEventListener("click",function(){
		var identifier = JSON.parse(localStorage.getItem('identifier'));
		identifier["adjust_op"]="+";
		localStorage.setItem("identifier",JSON.stringify(identifier));
	});
	document.getElementById("b").addEventListener("click",function(){
		var identifier = JSON.parse(localStorage.getItem('identifier'));
		identifier["adjust_op"]="-";
		localStorage.setItem("identifier",JSON.stringify(identifier));
	});
	
	var o = document.createElement('div');
	o.setAttribute("id", "gotop");
	o.addEventListener("click", function(){
		document.documentElement.scrollTo({top: 0})
	})
	document.body.appendChild(o);

    var span = document.createElement('span');
	span.innerHTML="<span accesskey='p' onclick='audio_all_handler(\"p\")'></span><span accesskey='n' onclick='audio_all_handler(\"n\")'></span></span><span accesskey='l' onclick='audio_all_handler(\"l\")'></span><span accesskey='o' onclick='audio_all_handler(\"o\")'></span>"
	span.setAttribute("style", "display:none");
	document.body.appendChild(span);

	window.addEventListener('scroll', function (e) {
		document.body.scrollTop > 500 || document.documentElement.scrollTop > 500 ? document.getElementById("gotop").style.display = "block" : document.getElementById("gotop").style.display = "none";
	}, false);

    window.addEventListener('message', function(event) {
		document.querySelectorAll('#audio a,#gallery a,#video a').forEach(function(element) {
			if(element.dataset.path === event.data){
				document.querySelectorAll('li').forEach(l => l.classList.remove('current'));
				element.parentElement.classList.add('current');
			}
		});
		document.querySelectorAll('#html a, #program a').forEach(function(element) {
			if(element.innerText === event.data){
				document.querySelectorAll('li').forEach(l => l.classList.remove('current'));
				element.parentElement.classList.add('current');
				var identifier = JSON.parse(localStorage.getItem('identifier'));
				identifier["resource_type"]="html";
				localStorage.setItem("identifier",JSON.stringify(identifier));
			}
		});
		document.querySelectorAll('#book a').forEach(function(element) {
			let fileType = element.innerText.split('.').pop().toLowerCase();
			if (fileType === "pdf") {
				if(event.data === element.dataset.path){
					document.querySelectorAll('li').forEach(l => l.classList.remove('current'));
					element.parentElement.classList.add('current');
				}
			} else if(fileType === "txt" || fileType === "epub") {
				if(element.dataset.path === event.data){
					document.querySelectorAll('li').forEach(l => l.classList.remove('current'));
					element.parentElement.classList.add('current');
				}
			}
		});
    });
	
	setInterval(function () {
        var identifier = JSON.parse(localStorage.getItem('identifier'));
        var o = identifier["song_path2"];
		var o2 = identifier["image_path2"];
		var o3 = identifier["image_path3"];
		var o4 = identifier["video_path2"];
		var o5 = identifier["video_path3"];
		if (o !=null && o !== "") {
			document.querySelectorAll('#audio a').forEach(function(element) {
				if(element.dataset.path == o){
					var group = Array.from(element.parentElement.parentElement.children)
						.filter(child => child.tagName === 'LI')
						.map(li => li.querySelector('a'))
						.filter(a => a !== null);
					localStorage.setItem("playlist", JSON.stringify(group.map(a => a.textContent)));
				}
			});
			identifier["song_path2"]="";
			localStorage.setItem("identifier",JSON.stringify(identifier));
        }
		if (o2 !=null && o2 !== "") {
			document.querySelectorAll('#gallery a').forEach(function(element) {
				if(element.dataset.path == o2){
					var group = Array.from(element.parentElement.parentElement.children)
						.filter(child => child.tagName === 'LI')
						.map(li => li.querySelector('a'))
						.filter(a => a !== null);
					localStorage.setItem("imagelist", JSON.stringify(group.map(a => a.dataset.path)));
				}
			});
			identifier["image_path2"]="";
			localStorage.setItem("identifier",JSON.stringify(identifier));
        }
		if (o3 !=null && o3 !== "") {
			document.querySelectorAll('#gallery a').forEach(function(element) {
				if(element.dataset.path == o3){
					document.querySelectorAll('li').forEach(l => l.classList.remove('current'));
					element.parentElement.classList.add('current');
				}
			});
			identifier["image_path3"]="";
			localStorage.setItem("identifier",JSON.stringify(identifier));
        }
		if (o4 !=null && o4 !== "") {
			document.querySelectorAll('#video a').forEach(function(element) {
				if(element.dataset.path == o4){
					var group = Array.from(element.parentElement.parentElement.children)
						.filter(child => child.tagName === 'LI')
						.map(li => li.querySelector('a'))
						.filter(a => a !== null);
					localStorage.setItem("videolist", JSON.stringify(group.map(a => a.dataset.path)));
				}
			});
			identifier["video_path2"]="";
			localStorage.setItem("identifier",JSON.stringify(identifier));
        }
		if (o5 !=null && o5 !== "") {
			document.querySelectorAll('#video a').forEach(function(element) {
				if(element.dataset.path == o5){
					document.querySelectorAll('li').forEach(l => l.classList.remove('current'));
					element.parentElement.classList.add('current');
				}
			});
			identifier["video_path3"]="";
			localStorage.setItem("identifier",JSON.stringify(identifier));
        }
	}, 30);

	const tspan = document.createElement('span');
	tspan.setAttribute("style","color: red; cursor: default; position: absolute; top: 0; left: 110px")
	document.body.appendChild(tspan);
	function updateDateTime() {
		const now = new Date();
		const year = now.getFullYear();
		const month = (now.getMonth() + 1).toString().padStart(2, '0');
		const day = now.getDate().toString().padStart(2, '0');
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		tspan.innerText = `${year}-${month}-${day} ${hours}:${minutes}`;
	}
	updateDateTime();
	setInterval(updateDateTime, 60000);
}

function toggle(category) {
	var element = document.getElementById(category);
	var ct = getPreviousSibling(element);
	if (element.classList.contains('hidden')) {
		element.classList.remove('hidden');
		ct.classList.remove('inactive');
		ct.classList.add('active');
	} else {
		element.classList.add('hidden');
		ct.classList.remove('active');
		ct.classList.add('inactive');
	}
}

function le(o,element){
	var s;
	switch(o.split("/").length - 1){
		case 1:s="未分类"; break;
		case 2:s= element.parentElement.previousElementSibling.innerHTML;break;
		case 3:s= element.parentElement.parentElement.previousElementSibling.innerHTML;break;
	}
	return s
}

function getPreviousSibling(element) {
	var sibling = element.previousSibling;
	while (sibling && sibling.nodeType !== 1) {
		sibling = sibling.previousSibling;
	}
	return sibling;
}

function parse_date(datePart) {
	const year = datePart.substring(0, 4);
	const month = parseInt(datePart.substring(4, 6)) - 1; // 月份从0开始计数
	const day = datePart.substring(6, 8);
	const hours = datePart.substring(8, 10);
	const minutes = datePart.substring(10, 12);
	const seconds = datePart.substring(12, 14);
	return new Date(year, month, day, hours, minutes, seconds);
}

function copyToClipboard(text) {
	var tempTextarea = document.createElement('textarea'); // 创建一个临时的 textarea 元素
	tempTextarea.style.position = 'fixed'; // 避免影响页面布局
	tempTextarea.style.opacity = '0'; // 隐藏临时元素
	tempTextarea.value = text;
	document.body.appendChild(tempTextarea); // 将临时元素添加到文档中
	tempTextarea.select(); // 选中临时元素的文本内容
	tempTextarea.setSelectionRange(0, 99999); // 对移动设备的兼容处理
	document.execCommand('copy'); // 执行复制命令
	document.body.removeChild(tempTextarea); // 移除临时元素
}

function audio_all_handler(m) {
	var identifier = JSON.parse(localStorage.getItem('identifier'));
	identifier["audio_all_handler"]=m;
	localStorage.setItem("identifier",JSON.stringify(identifier));
}