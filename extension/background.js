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
			return t.url === tab.url && t.id !== tabId;
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

	if(chrome.notifications) chrome.notifications.create(
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