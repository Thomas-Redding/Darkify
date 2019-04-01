
chrome.storage.sync.get('darkify_blacklist', (result) => {
	var blacklist = result['darkify_blacklist'];
	if (blacklist === undefined) blacklist = [];
	var str = '';
	for (var i = 0; i < blacklist.length; ++i) {
		str += blacklist[i];
		str += '\n';
	}
	document.getElementById('textInput').value += str;
	document.getElementById('textInput').onkeyup = userChangedBlackList;
	chrome.extension.sendMessage({ msg: "startFunc" });
});

function userChangedBlackList() {
	var newBlacklist = document.getElementById('textInput').value;
	chrome.extension.sendMessage({ msg: "blackListUpdate=" +  newBlacklist });
}
