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
		chrome.notifications.clear( "UniqueTabs", function (success){/*mandatory callback*/} );
	});
}


function abbreviatedUrl(tab)
{
	return tab.url.length > 40 ? tab.url.match(/^.{20}|.{20}$/g).join(" [...] ") : tab.url;
}

function findDuplicates(tabId, change, tab)
{
	if (!tab.url || tab.url === "" || tab.url === lastClosedURL) return;

	chrome.tabs.query({}, function(tabs) {
		var duplicates = tabs.filter(function(t) {
			return t.url === tab.url && t.id !== tabId;
		});
		if (duplicates.length) handleDuplicate(tab, duplicates);
	});
}

function handleDuplicate(tab, duplicates)
{
	if(lastClosedURL === tab.url) return; // prevent multiple execution
	
	console.log("URL: tab:", tab.url, "lastClosed:", lastClosedURL);
	lastClosedURL = tab.url;

	// select original tab:
	chrome.tabs.update( duplicates[0].id, { active: true, selected : true, highlighted : true } );

	// remove new duplicate:
	chrome.tabs.remove( tab.id );
	console.log("duplicate", tab, "removed");

	if(chrome.notifications) chrome.notifications.create(
		"UniqueTabs",
		{
			type : "basic",
			iconUrl : "icon128.png",
			title : chrome.i18n.getMessage("notification_title", [ abbreviatedUrl(tab) ]),
			message : chrome.i18n.getMessage("notification_body")
		},
		function (id){ /* creation callback */ }
	);
}