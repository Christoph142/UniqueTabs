"use strict";

//retrieve and store settings (filled with default values):
var w = {
	"notify"	:	(!localStorage["notify"] 	? "0"			: localStorage["notify"]),
	"duplicate"	:	(!localStorage["duplicate"]	? "variables"	: localStorage["duplicate"])
};

var lastClosedTab = { url : null };

chrome.tabs.onUpdated.addListener( findDuplicates );

if(chrome.notifications) chrome.notifications.onClicked.addListener( function (id){
	lastClosedTab = JSON.parse(id);

	if(chrome.sessions)	chrome.sessions.restore( lastClosedTab.sessionId );
	else				chrome.tabs.create( { windowId : lastClosedTab.windowId,
											  index : lastClosedTab.index,
											  url : lastClosedTab.url,
											  active : lastClosedTab.active,
											  pinned : lastClosedTab.pinned,
											  openerTabId : lastClosedTab.openerTabId } );
	console.log("user reopened", lastClosedTab);

	chrome.notifications.clear( id, function (success){/*mandatory callback*/} );
});

function findDuplicates(tabId, change, tab)
{
	if (!tab.url || tab.url === "" || tab.url === lastClosedTab.url) return;

	chrome.tabs.query({}, function(tabs) {
		var duplicates = tabs.filter(function(t) {
			if(t.id === tabId) return false;
			else if(w.duplicate === "host"){ 	 if(t.url.split("/")[2] 			  === tab.url.split("/")[2]) 				return true;}
			else if(w.duplicate === "page"){	 if(t.url.split("#")[0].split("?")[0] === tab.url.split("#")[0].split("?")[0]) 	return true;}
			else if(w.duplicate === "variables"){if(t.url.split("#")[0] 			  === tab.url.split("#")[0]) 				return true;}
			else if(w.duplicate === "identical"){if(t.url 							  === tab.url) 								return true;}
			else return false;
		});
		if (duplicates.length) handleDuplicate(tab, duplicates);
	});
}

function handleDuplicate(tab, duplicates)
{
	if(lastClosedTab.url === tab.url) return; // prevent multiple execution
	
	lastClosedTab = tab;

	// select original tab:
	chrome.tabs.update( duplicates[0].id, { active: true, selected : true, highlighted : true } );

	// remove new duplicate:
	chrome.tabs.remove( tab.id );
	console.log("duplicate", tab, "removed");

	if(chrome.notifications && w.notify === "1") chrome.notifications.create(
		JSON.stringify(tab),
		{
			type : "basic",
			iconUrl : "icon128.png",
			title : chrome.i18n.getMessage("notification_title"),
			message : chrome.i18n.getMessage("notification_body", tab.url)
		},
		function (id){ /* creation callback */ }
	);
}

// function for options page:
function save_new_value(key, value)
{
	key = key.split("."); // split tree
	
	// save to storage cache (w):
	var saveobjectBranch = w;
	for(var i = 0; i < key.length-1; i++){ saveobjectBranch = saveobjectBranch[ key[i] ]; }
	saveobjectBranch[ key[key.length-1] ] = value;
	
	// save in localStorage:
	localStorage[ key[0] ] = w[ key[0] ];
	
	console.log("Saved", key, value, "settings now: ", w);
}