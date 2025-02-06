class NoteTaker {
    constructor(config) {
        this.noteHost = config.noteHost;
        this.noteTemp = "";
        this.mouseXPosition = 0;
        this.noteColor = config.noteColor || "black";
        this.noteBackgroundColor = config.noteBackgroundColor || "yellow";
        this.noteElementsClass = config.noteElementsClass;
        this.storageElement = config.storageElement;
        this.wipeElementId = config.wipeElementId;
        this.alterElementId = config.alterElementId || "alter";
        this.commitElementId = config.commitElementId || "commit";
        
        this.endOfSelectHandler = this.endOfSelect.bind(this);
        this.startSelectingHandler = this.startSelecting.bind(this);
    }

    init() {
        this.storageElement.value = localStorage.getItem(this.noteHost);
        if (localStorage.getItem(this.noteHost) != null && localStorage.getItem(this.noteHost) != "") {
            this.noteTemp = localStorage.getItem(this.noteHost) + "\n\r";
        }

        document.querySelectorAll('.' + this.noteElementsClass).forEach(element => {
            element.addEventListener("mousedown", this.endOfSelectHandler, false);
            element.addEventListener("mouseup", this.startSelectingHandler, false);
        });

        document.getElementById(this.wipeElementId).onclick = () => { this.eraser() };
        document.getElementById(this.alterElementId).onclick = () => { this.alter() };
        document.getElementById(this.commitElementId).onclick = () => { this.commit() };
    }

    endOfSelect(e) {
        this.mouseXPosition = e.pageX;
    }

    startSelecting(e) {
        let excerpted = false;
        const selection = window.getSelection();
        const selectedText = selection.toString();
        const startPoint = window.getSelection().getRangeAt(0).startOffset;
        const endPoint = window.getSelection().getRangeAt(0).endOffset;
        let anchorTag = selection.anchorNode.parentNode;
        let focusTag = selection.focusNode.parentNode;

        if ((e.pageX - this.mouseXPosition) < 0) {
            focusTag = selection.anchorNode.parentNode;
            anchorTag = selection.focusNode.parentNode;
        }

        if (selectedText.length === (endPoint - startPoint)) {
            excerpted = true;
            if (anchorTag.className !== "note") {
                this.excerptSelection();
            } else {
                const afterText = selectedText + `<span class='note' style='color:${this.noteColor}; background-color:${this.noteBackgroundColor}'>` + anchorTag.innerHTML.substr(endPoint) + "</span>";
                anchorTag.innerHTML = anchorTag.innerHTML.substr(0, startPoint);
                anchorTag.insertAdjacentHTML('afterend', afterText);
            }
        } else {
            if (anchorTag.className !== "note" && focusTag.className !== "note") {
                this.excerptSelection();
                excerpted = true;
            }
        }

        if (anchorTag.className === "note" && focusTag.className === 'note' && !excerpted) {
            excerpted = true;

            const afterHtml = anchorTag.innerHTML.substr(startPoint);
            const outerHtml = selectedText.substr(afterHtml.length, selectedText.length - endPoint - afterHtml.length);
            const anchorInnerhtml = anchorTag.innerHTML.substr(0, startPoint);
            const focusInnerHtml = focusTag.innerHTML.substr(endPoint);
            const focusBeforeHtml = focusTag.innerHTML.substr(0, endPoint);

            selection.deleteFromDocument();
            anchorTag.innerHTML = anchorInnerhtml;
            focusTag.innerHTML = focusInnerHtml;

            const anchorafterHtml = afterHtml + outerHtml + focusBeforeHtml;
            anchorTag.insertAdjacentHTML('afterend', anchorafterHtml);
        }

        if (anchorTag.className === "note" && !excerpted) {
            excerpted = true;

            const Innerhtml = anchorTag.innerHTML.substr(0, startPoint);
            const afterHtml = anchorTag.innerHTML.substr(startPoint);
            const outerHtml = selectedText.substr(afterHtml.length, selectedText.length);

            selection.deleteFromDocument();
            anchorTag.innerHTML = Innerhtml;
            anchorTag.insertAdjacentHTML('afterend', afterHtml + outerHtml);
        }

        if (focusTag.className === 'note' && !excerpted) {
            excerpted = true;

            const beforeHtml = focusTag.innerHTML.substr(0, endPoint);
            const outerHtml = selectedText.substr(0, selectedText.length - beforeHtml.length);

            selection.deleteFromDocument();
            focusTag.innerHTML = focusTag.innerHTML.substr(endPoint);

            outerHtml += beforeHtml;
            focusTag.insertAdjacentHTML('beforebegin', outerHtml);
        }

        if (!excerpted) {
            this.excerptSelection();
        }

        document.querySelectorAll('.note').forEach(e => {
            const f = e.innerHTML;
            if (f.length === 0) {
                e.remove();
                this.merge();
            }
        });

        selection.removeAllRanges();
        this.merge();
    }

    excerptSelection() {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        if (range && !selection.isCollapsed) {
            if (selection.anchorNode.parentNode === selection.focusNode.parentNode) {
                const span = document.createElement('span');
                span.className = 'note';
                span.style.color = this.noteColor;
                span.style.backgroundColor = this.noteBackgroundColor;
                span.textContent = selection.toString();
                selection.deleteFromDocument();
                range.insertNode(span);
            }
        }
    }

    merge() {
        const array = [];
        document.querySelectorAll(".note").forEach(noteElement => {
            if (noteElement.children.length === 0 && noteElement.textContent.replace(/ |\n/g, '') !== '') {
                array.push(noteElement.textContent);
            }
        });
        localStorage.setItem(this.noteHost, this.noteTemp + array.join("\n\r"));
        this.storageElement.value = localStorage.getItem(this.noteHost);
        this.storageElement.scrollTop = this.storageElement.scrollHeight;
    }
    
    eraser() {
        localStorage.removeItem(this.noteHost);
        this.noteTemp = "";
        this.merge();
    }

    alter() {
        console.log("i");
        document.querySelectorAll('.' + this.noteElementsClass).forEach(element => {
            element.removeEventListener("mousedown", this.endOfSelectHandler, false);
            element.removeEventListener("mouseup", this.startSelectingHandler, false);
        });
        this.noteTemp = "";
        document.querySelectorAll('.note').forEach(span => {
            const textNode = document.createTextNode(span.textContent);
            span.parentNode.insertBefore(textNode, span);
            span.parentNode.removeChild(span);
        });
    }

    commit() {
        console.log("b");
        localStorage.setItem(this.noteHost,this.storageElement.value);
        this.init();
    }
}
