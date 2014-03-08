var lastClosedURL = null;

chrome.tabs.onUpdated.addListener( findDuplicates );

if(chrome.notifications)
{
	chrome.notifications.onClicked.addListener( function (id){
		if(id !== "UniqueTabs") return;

		/*if(chrome.sessions)	chrome.sessions.restore( sessionId );
		else 				*/
		chrome.tabs.create( { url : lastClosedURL } );
		console.log("user reopened duplicate of ", lastClosedURL);

		chrome.notifications.clear( id, function (success){/*mandatory callback*/} );
	});

	chrome.runtime.onSuspend.addListener(function(){
		chrome.notifications.clear( "UniqueTabs" );
	});
}


function abbreviatedUrl(tab)
{
	return tab.url.length > 40 ? tab.url.match(/^.{20}|.{20}$/g).join(" [...] ") : tab.url;
}

function findDuplicates(tabId, change, tab)
{
	if (!tab.url || tab.url === "" || tab.url === lastClosedURL) return;

	chrome.tabs.getAllInWindow(tab.windowId, function(tabs) {
		var duplicates = tabs.filter(function(t) {
			return t.url === tab.url && t.id !== tabId;
		});
		if (duplicates.length) handleDuplicate(tab, duplicates);
	});
}

function handleDuplicate(tab, duplicates)
{
	console.log("URL: tab:", tab.url, "lastClosed:", lastClosedURL);
	lastClosedURL = tab.url;

	// select original tab:
	chrome.tabs.highlight( { windowId : tab.windowId, tabs : duplicates[0].id } , function(){/* mandatory callback */});
	chrome.tabs.update( duplicates[0].id, { active: true, selected : true, highlighted : true } );

	// remove new duplicate:
	chrome.tabs.remove( tab.id );
	console.log("duplicate", tab, "removed");

	if(chrome.notifications) chrome.notifications.create(
		"UniqueTabs",
		{
			type : "basic",
			iconUrl : "icon48.png",
			title : "Duplicate " + (duplicates.length === 1 ? "tab" : "tabs") + " found for " + abbreviatedUrl(tab),
			message : "The duplicate tab just got closed and the original one got reactivated for you.\n\n(Press Ctrl+Shift+T or click this notification to reopen it)",
			isClickable : true
		},
		function (id){ /* creation callback */ }
	);
}