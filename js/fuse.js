if (window.fuseIntervalId) {
    clearInterval(window.fuseIntervalId);
    window.fuseIntervalId = null;
}

window.fuseIntervalId = setInterval(function () {
    if (localStorage.getItem('_level') !== null) {
        var _level = localStorage.getItem('_level');

        var head = document.head;
        var metaElement = document.createElement('meta');
        metaElement.setAttribute('charset', 'UTF-8');
        head.appendChild(metaElement);
        var titleElement = document.createElement('title');
        
        var identifier = JSON.parse(localStorage.getItem('identifier'));
        var sth = identifier["content_src"];
        titleElement.innerHTML=sth.split(".html")[0].split("/")[identifier["content_src"].split(".html")[0].split("/").length-1];
        head.appendChild(titleElement);
        
        var preElement = document.createElement('pre');
        preElement.setAttribute("class","noteElements")
        preElement.textContent = document.body.innerHTML;
        document.body.innerHTML = '';
        var spanElement = document.createElement('span');
        spanElement.setAttribute("id","anchor");
        spanElement.innerHTML = '20240101000000-txt';
        document.body.appendChild(spanElement);
        document.body.appendChild(preElement);
        
        var divElement = document.createElement('div');
        divElement.setAttribute("id","storageElement");
        divElement.setAttribute("style","position:fixed;bottom:100px;right:20px;background:#888;display:none");
        divElement.innerHTML="<textarea style='height:600px;width:250px'></textarea><br><button id='wipe'>wipe</button><button id='alter'>alter</button><button id='commit'>commit</button>";
        document.body.appendChild(divElement);
        
        var buttonElement = document.createElement('button');
        buttonElement.setAttribute("id", "sh");
        buttonElement.innerHTML = "txt_notes";
        buttonElement.setAttribute("onclick", "javascript:if(document.getElementById('storageElement').style.display != 'none'){document.getElementById('storageElement').style.display='none'}else{document.getElementById('storageElement').style.display='block'}");
        buttonElement.setAttribute("style", "position:fixed;bottom:100px;right:40px;");
        document.body.appendChild(buttonElement);

        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = _level+'css/content.css';
        document.head.appendChild(link);

        var script = document.createElement('script');
        script.src = _level+'js/content.js';
        document.head.appendChild(script);
        script.onload = function(e) {
            var t = document.getElementById('t');
            t.parentNode.removeChild(t);
            var x = document.getElementById("s"+_level.length/3);
            x.parentNode.removeChild(x);
            init()
        };

        var script2 = document.createElement('script');
        script2.src = _level+'js/note.js';
        document.head.appendChild(script2);
        script2.onload = function() {
            const config = {
                noteHost: "note_"+titleElement.innerHTML,
                noteColor: 'black',
                noteBackgroundColor: 'chartreuse',
                noteElementsClass: 'noteElements',
                storageElement: document.getElementById("storageElement").getElementsByTagName('textarea')[0],
                wipeElementId: 'wipe'
            };
            const noteTaker = new NoteTaker(config);
            noteTaker.init();
        };

        localStorage.removeItem('_level');
        clearInterval(window.fuseIntervalId);
        window.fuseIntervalId = null;
    }
}, 100);