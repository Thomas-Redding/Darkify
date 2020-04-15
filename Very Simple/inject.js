
let tagsToUnInvert = {
  'IMG': 1,
  'CANVAS': 1,
  'VIDEO': 1
}

function injectCSS(cssText) {
  let cssElement = document.createElement("style");
  cssElement.type = "text/css";
  cssElement.innerText = cssText;
  document.body.appendChild(cssElement);
}

function darkifyPage() {
  let css = '';
  css += 'html { background-color: black; filter: invert(100%) hue-rotate(180deg); }';
  for (tag in tagsToUnInvert) {
    css += tag + ' { filter: invert(100%) hue-rotate(180deg); }';
  }
  if (window.location.href.indexOf('docs.google.com/spreadsheets') > -1) {
    css += '#waffle-grid-container { filter: invert(100%) hue-rotate(180deg); }';
  } else if (window.location.host == 'www.youtube.com') {
    css += '#movie_player { background-color: white !important; }';
  }
  injectCSS(css);
}

/********** Simple Logic **********/
/*
 * All the code below this point has three functions:
 *   1) It hides the page with a div before it loads to prevent "flashing".
 *   2) It decides whether to call darkifyPage() based on the white/blacklist.
 *   3) It uninverts some nodes (iFrames and nodes with background images)
 */

function coverPage() {
  if (document.body) {
    coverObserver.disconnect();
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

function uncoverePage() {
  document.body.removeChild(document.getElementById('loremFishesPear'));
}

// We use this observer to try and show the cover as quickly as
// possible.
let coverObserver = new MutationObserver(() => {
  coverPage();
});
coverObserver.observe(document.documentElement, { childList: true });

// We use this observer to uninvert iFrames and nodes with
// background images.
let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    for (let node of mutation.addedNodes) {
      recursivelyApplyToDom(uninvert_smartly, node);
    }
  })
});

let isLoaded = false;
window.addEventListener('load', () => {
  isLoaded = true;
  if (shouldInvert === 1) {
    // Inject css tag to dark-mode the page.
    darkifyPage();
    // Un-invert some nodes.
    recursivelyApplyToDom(uninvert_smartly);
    // Set up observer to un-invert some nodes as they're created.
    observer.observe(document.body, { childList: true });
  }
  // When (actually before) the page loaded we covered it with a
  // div to prevent the "flashbang" effect where a page is
  // temporarily pure white.  We need to delete this div now (so
  // the user can see the page).
  uncoverePage();
});

function wildcardStringMatch(pattern, string) {
  if (pattern == "") {
    return false;
  }
  let patternArr = pattern.split('*');
  for (let i = 0; i < patternArr.length; ++i) {
    let index = string.indexOf(patternArr[i]);
    if (index === -1) {
      return false;
    }
    string = string.substr(index + patternArr[i].length);
  }
  return true;
}

// Recursively apply 'fn' to 'node' and all of its children.
function recursivelyApplyToDom(fn, node) {
  if (node === undefined) {
    node = document.body;
  }
  fn(node);
  for (let child of node.children) {
    recursivelyApplyToDom(fn, child);
  }
}

// Uninvert divs that have a background image, or that are iFrames.
function uninvert_smartly(node) {
  let style;
  try {
    style = window.getComputedStyle(node)
  } catch {}
  let x = false;
  x |= style.getPropertyValue('background-image').includes('url');
  x |= style.getPropertyValue('background').includes('url');
  x |= node.nodeName === 'IFRAME';
  if (x) {
    node.style.filter = 'invert(100%)';
  }
}

function endsWithAny(string, suffixes) {
  for (let suffix of suffixes) {
    if (string.endsWith(suffix)) {
      return true;
    }
  }
  return false;
}

// `shouldInvert` resolves to -1 or +1 eventually.
let shouldInvert = 0;
chrome.storage.sync.get('darkify_blacklist', (result) => {
  let blacklist = result['darkify_blacklist'];
  if (blacklist === undefined) {
    let prepopulatedBlacklist = [
      'https://www.netflix.com/*',
      'https://www.reddit.com/*',
      'https://photos.google.com',
    ];
    chrome.storage.sync.set({'darkify_blacklist': prepopulatedBlacklist }, (x) => {});
    blacklist = [];
  }
  let pageUrl = window.location.href;
  if (endsWithAny(pageUrl.toLowerCase(), ['.gif', '.jpeg', 'jpg', 'mp4', '.png', '.webm', '.webp'])) {
    return;
  }
  for (let i = 0; i < blacklist.length; ++i) {
    if (wildcardStringMatch(blacklist[i], pageUrl)) return;
  }
  shouldInvert = 1;
  if (isLoaded) {
    darkifyPage();
  }
});
