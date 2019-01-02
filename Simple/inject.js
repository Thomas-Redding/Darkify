
function wildcardStringMatch(pattern, string) {
	if (pattern == "") return false;
	var patternArr = pattern.split('*');
	for (var i = 0; i < patternArr.length; ++i) {
		var index = string.indexOf(patternArr[i]);
		if (index == -1) return false;
		string = string.substr(index + patternArr[i].length);
	}
	return true;
}

let tagsToUnInvert = {
	'IMG': 1,
	'CANVAS': 1,
	'VIDEO': 1
}

function injectCSS(cssText) {
	var cssElement = document.createElement("style");
	cssElement.type = "text/css";
	cssElement.innerText = cssText;
	document.body.appendChild(cssElement);
}

function darkifyPage() {
	document.body.style.filter = 'invert(100%) hue-rotate(180deg)';
	document.body.style.backgroundColor = '#222';
	for (tag in tagsToUnInvert) {
		let elements = document.getElementsByTagName(tag);
		for (let i = 0; i < elements.length; ++i) {
			elements[i].style.filter = 'invert(100%) hue-rotate(180deg)';
		}
	}
	let elements = document.getElementsByTagName('*');
	for (let i = 0; i < elements.length; ++i) {
		if (elements[i] == window) continue;
		var style = getComputedStyle(elements[i]);
		if (style['backgroundImage'].substr(0, 4) == 'url(') {
			elements[i].style.filter = 'invert(100%) hue-rotate(180deg)';
		}
	}
	var pageUrl = window.location.href;
	if (pageUrl.indexOf("www.youtube.com") >= 0) {
		injectCSS(`
			#masthead img { filter: invert(0%) !important; }
			.ytp-preview { filter: invert(100%) hue-rotate(180deg) !important; }
			#player-theater-container { background-color: white !important; }
		`);
	} else if (pageUrl.indexOf('github.com') >= 0) {
		injectCSS(`
			header { filter: invert(100%) hue-rotate(180deg) !important; }
			header svg { filter: invert(0%) hue-rotate(0deg) !important; }
			.dropdown-menu { filter: invert(100%) hue-rotate(180deg) !important; }
			.js-header-wrapper { z-index: 100; }
		`);
	} else if (pageUrl.indexOf('wiktionary.org') >= 0) {
		injectCSS(`
			#left-navigation ul {
				invert: invert(0%) !important;
			}
		`);
	}
	document.addEventListener('DOMNodeInsertedIntoDocument', handleAddedNode, true)
}

function hidePage() {
	if (document.body) {
		observer.disconnect();
		let cover = document.createElement('div');
		cover.id = 'loremFishesPear';
		cover.style.position = 'fixed';
		cover.style.left = 0;
		cover.style.top = 0;
		cover.style.zIndex = 10000;
		cover.style.width = '100vw';
		cover.style.height = '100vh';
		cover.style.backgroundColor = '#222';
		document.body.appendChild(cover);
	}
}

function handleAddedNode(x) {
	var element = x.target;
	if (element.tagName === undefined) return;
	if (element.tagName in tagsToUnInvert) {
		element.style.filter = 'invert(100%) hue-rotate(180deg)';
	} else {
		var style = getComputedStyle(element);
		if (style['backgroundImage'].substr(0, 4) == 'url(') {
			element.style.filter = 'invert(100%) hue-rotate(180deg)';
		}
	}
}

let observer = new MutationObserver(hidePage);
observer.observe(document.documentElement, { childList: true });

var isLoaded = false;
window.addEventListener('load', () => {
	isLoaded = true;
	if (shouldInvert == 1) darkifyPage();
	document.body.removeChild(document.getElementById('loremFishesPear'));
});

// Resolves to -1 or +1 eventually.
var shouldInvert = 0;
chrome.storage.sync.get('darkify_blacklist', (result) => {
	var blacklist = result['darkify_blacklist'];
	if (blacklist === undefined) {
		chrome.storage.sync.set({'darkify_blacklist': [] }, (x) => {});
		blacklist = [];
	}
	var pageUrl = window.location.href;
	if (pageUrl.substr(pageUrl.length-5) == '.webp') return;
	if (pageUrl.substr(pageUrl.length-5) == '.mp4') return;
	if (pageUrl.substr(pageUrl.length-5) == '.png') return;
	if (pageUrl.substr(pageUrl.length-5) == '.jpg') return;
	for (var i = 0; i < blacklist.length; ++i) {
		if (wildcardStringMatch(blacklist[i], pageUrl)) return;
	}
	shouldInvert = 1;
	if (isLoaded) {
		darkifyPage();
	}
});
 