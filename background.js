
var blacklist = [];
var blackListHasChanges = false;

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.msg.substr(0, 16) == "blackListUpdate=") {
    	blackListHasChanges = true;
    	blacklist = request.msg.substr(16).split('\n');
    }
  }
);

setInterval(() => {
	if (blackListHasChanges) {
		console.log('save', blacklist);
		blackListHasChanges = false;
		chrome.storage.sync.set({'darkify_blacklist': blacklist }, (x) => {});
	}
}, 1000);
