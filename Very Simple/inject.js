

let USE_TRANSPARENT_INVERSION_HEURISTIC = true;
let PAGE_BRIGHTNESS = 0.7;

// Inject a <style> tag with the given CSS string.
function injectCSS(cssText) {
  let cssElement = document.createElement("style");
  cssElement.type = "text/css";
  cssElement.innerText = cssText;
  document.body.appendChild(cssElement);
}

// Inject a style sheet that adds CSS that naively inverting a page and then
// uninverts <img>, <canvas>, and <video> elements.
function darkifyPage() {
  let css = '';
  css += 'html { background-color: black; filter: invert(100%) hue-rotate(180deg) brightness(' + PAGE_BRIGHTNESS + '); }';
  if (!USE_TRANSPARENT_INVERSION_HEURISTIC) {
    css += 'IMG { filter: invert(100%) hue-rotate(180deg); }';
  }
  css += 'CANVAS { filter: invert(100%) hue-rotate(180deg); }';
  css += 'VIDEO { filter: invert(100%) hue-rotate(180deg); }';
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

// Cover the page in a dark <div> to prevent white flashing during page
// navigation.
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

// Remove the <div> added by `coverPage()`.
function uncoverPage() {
  document.body.removeChild(document.getElementById('loremFishesPear'));
}

// We use this observer to try and show the cover the <div> referenced by
// `coverPage()` and `uncoverPage()` as quickly as possible.
let coverObserver = new MutationObserver(() => {
  coverPage();
});
coverObserver.observe(document.documentElement, { childList: true });

// We use this observer to uninvert iFrames and nodes with background images.
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
  uncoverPage();
});

// Check whether `string` fits the given `pattern`.
// For instance the string "dafaewFOOBARfeawfe" fits the pattern "*foobar*".
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

// Recursively apply `fn` to `node` and all of its children. If no `node` is
// given, apply to all nodes.
function recursivelyApplyToDom(fn, node) {
  if (node === undefined) {
    node = document.body;
  }
  fn(node);
  for (let child of node.children) {
    recursivelyApplyToDom(fn, child);
  }
}

// Uninvert <div> elements that have a background image, or that are iFrames.
function uninvert_smartly(node) {
  if (node.nodeName === 'IFRAME') {
    node.style.filter = 'invert(100%) hue-rotate(180deg)';
    return;
  }

  let style;
  try {
    style = window.getComputedStyle(node)
  } catch {}

  if (USE_TRANSPARENT_INVERSION_HEURISTIC) {
    if (node.nodeName) {
      maybeInvertImage(node, node.src);
    } else {
      let backgroundImageSource = null;
      if (style.getPropertyValue('background-image').includes('url')) {
        backgroundImageSource = style.getPropertyValue('background-image');
      } else if (style.getPropertyValue('background').includes('url')) {
        backgroundImageSource = style.getPropertyValue('background');
      }
      if (backgroundImageSource != null) {
        let urlStart = backgroundImageSource.indexOf("\"") + 1;
        let urlEnd = backgroundImageSource.lastIndexOf("\"") - 1;
        backgroundImageSource = backgroundImageSource.substr(urlStart, urlEnd - urlStart + 1)
        maybeInvertImage(node, backgroundImageSource);
      }
    }
  } else {
    let hasBackgroundImageSource = false;
    hasBackgroundImageSource |= style.getPropertyValue('background-image').includes('url');
    hasBackgroundImageSource |= style.getPropertyValue('background').includes('url');
    if (hasBackgroundImageSource) {
      // Only invert sufficiently large images.  Small ones are probably icons.
      let rect = node.getBoundingClientRect();
      let body = document.body.getBoundingClientRect();
      if (rect.width * 16 > body.width) {
        node.style.filter = 'invert(100%) hue-rotate(180deg)';
      }
    }
  }
}

// Only call if `USE_TRANSPARENT_INVERSION_HEURISTIC` is true.
function maybeInvertImage(element, url) {
  imageTransparentAtURL(url, (url, isTransparent) => {
    if (isTransparent === true) {
      element.style.filter = '';
    } else if (isTransparent === false) {
      element.style.filter = 'invert(100%) hue-rotate(180deg)';
    } else {
      // There was a cross-origin issue, so we can't determine if the image is transparent.
      // Therefore, we use the heuristic that small images shouldn't be uninverted.
      let rect = element.getBoundingClientRect();
      if (Math.min(rect.width, rect.height) < 32) {
        element.style.filter = '';
      }
    }
  });
}

// Calls `callback(url, result)` either synchronously or asynchronously.
// `result` may take one of three values:
//   * true - the image has at least one translucent pixel
//   * false - the image has only opaque pixels
//   * undefined - an error occured (probably cross origin in nature)
function imageTransparentAtURL(url, callback) {
  if (!imageTransparentAtURL._cache) {
    imageTransparentAtURL._cache = {};
  }
  if (url in imageTransparentAtURL._cache) {
    return callback(url, imageTransparentAtURL._cache[url]);
  }
  let image = new Image();
  image.crossOrigin = "Anonymous";
  image.onload = () => {
    if (url in imageTransparentAtURL._cache) {
      return callback(url, imageTransparentAtURL._cache[url]);
    }
    let isTransparent = isImageTransparent(image);
    imageTransparentAtURL._cache[url] = isTransparent;
    callback(url, isTransparent);
  }
  image.src = url
}

// A synchronous version of `imageTransparentAtURL` for when the image is
// already loaded.
function isImageTransparent(image) {
  if (!isImageTransparent._canvas) {
    isImageTransparent._canvas = document.createElement("canvas");
    isImageTransparent._context = isImageTransparent._canvas.getContext("2d");
  }
  isImageTransparent._canvas.width = image.width;
  isImageTransparent._canvas.height = image.height;
  isImageTransparent._context.drawImage(image, 0, 0);
  let data;
  try {
    data = isImageTransparent._context.getImageData(0, 0, isImageTransparent._canvas.width, isImageTransparent._canvas.height).data;
  } catch {
    // Probably a cross origin error.
    return undefined;
  }
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

// Checks if any of the given suffixes ends the given string.
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
