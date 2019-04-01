
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
  var css = '';
  css += 'html { background-color: black; filter: invert(100%) hue-rotate(180deg); }';
  for (tag in tagsToUnInvert) {
    css += tag + ' { filter: invert(100%) hue-rotate(180deg); }';
  }
  if (window.location.host == 'docs.google.com') {
    css += '#docs-editor-container { filter: invert(100%) hue-rotate(180deg); }';
  } else if (window.location.host == 'www.youtube.com') {
    css += '#movie_player { background-color: white !important; }';
  }
  injectCSS(css);
}

/********** Simple Logic **********/
/*
 * All the code below this point has two functions:
 *   1) It hides the page with a div before it loads to prevent "flashing".
 *   2) It decides whether to call darkifyPage() based on the white/blacklist.
 */

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

let observer = new MutationObserver(hidePage);
observer.observe(document.documentElement, { childList: true });

var isLoaded = false;
window.addEventListener('load', () => {
  isLoaded = true;
  if (shouldInvert == 1) darkifyPage();
  document.body.removeChild(document.getElementById('loremFishesPear'));
});

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

// `shouldInvert` resolves to -1 or +1 eventually.
var shouldInvert = 0;
chrome.storage.sync.get('darkify_blacklist', (result) => {
	var blacklist = result['darkify_blacklist'];
	if (blacklist === undefined) {
		chrome.storage.sync.set({'darkify_blacklist': [] }, (x) => {});
		blacklist = [];
	}
	var pageUrl = window.location.href;
  if (pageUrl.substr(pageUrl.length-4) == '.gif') return;
  if (pageUrl.substr(pageUrl.length-5) == '.jpeg') return;
  if (pageUrl.substr(pageUrl.length-4) == '.jpg') return;
	if (pageUrl.substr(pageUrl.length-4) == '.mp4') return;
	if (pageUrl.substr(pageUrl.length-4) == '.png') return;
  if (pageUrl.substr(pageUrl.length-5) == '.webm') return;
  if (pageUrl.substr(pageUrl.length-5) == '.webp') return;
	for (var i = 0; i < blacklist.length; ++i) {
		if (wildcardStringMatch(blacklist[i], pageUrl)) return;
	}
	shouldInvert = 1;
	if (isLoaded) {
		darkifyPage();
	}
});
