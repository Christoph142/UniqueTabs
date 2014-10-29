window.addEventListener("DOMContentLoaded", restoreprefs, false);
window.addEventListener("DOMContentLoaded", localize, false);
window.addEventListener("DOMContentLoaded", add_page_handling, false);

var bg = null;
var storage = null;
var ready = false;

chrome.runtime.getBackgroundPage( function (b){
	bg = b;
	storage = b.w;

	if(!ready) 	ready = true;
	else 		restoreprefs();
});

window.addEventListener("change", function(e) // save preferences:
{
	if(e.target.id === "url" || e.target.id === "ext" || e.target.id === "dir") return; // saved via "Add"-button
	
	if(e.target.id.indexOf("defaultPath") !== -1){
		if(e.target.id === "defaultPathBrowser")	var p = bg.correct_path_format(e.target.value, "absolute");
		else 										var p = bg.correct_path_format(e.target.value, "relative");

		if(p !== false) 	e.target.value = p;
		else{ 				restoreprefs(); return; }
	}
	
	if(e.target.type === "checkbox") bg.save_new_value(e.target.id, e.target.checked ? "1" : "0");
	else if(e.target.type === "radio" && e.target.name === "notify")
	{
		var radio = document.getElementsByName("notify");
		if(radio[0].checked) chrome.permissions.request({ permissions: ["notifications"] }, function(granted){
			console.log(granted);
			if(granted) bg.save_new_value("notify", "1");
			else 		radio[1].checked = true;
		});
		else{
			bg.save_new_value("notify", "0");
			chrome.permissions.remove({ permissions: ["notifications"] });
		}
	}
	else if(e.target.type === "radio")
	{
		var radio = document.getElementsByName(e.target.name);
		for(var i = 0; i < radio.length; i++)
		{
			if(radio[i].checked){ bg.save_new_value(radio[i].name, radio[i].value); break; }
		}
	}
	else bg.save_new_value(e.target.id, e.target.value);
},false);

chrome.runtime.onMessage.addListener( restoreprefs );
function restoreprefs()
{
	if(!ready){ ready = true; return; }

	// get inputs:
	var inputs = document.getElementsByTagName("input");	
	for(var i = 0; i < inputs.length; i++){
		if( !storage[inputs[i].id] && !storage[inputs[i].name] && inputs[i].id.split(".")[0] !== "contextMenu") continue;
		
		if( inputs[i].type === "checkbox" ){
			if(inputs[i].id.split(".")[0] === "contextMenu") inputs[i].checked = (storage["contextMenu"][ inputs[i].id.split(".")[1] ] === "1" ? true : false);
			else 											 inputs[i].checked = (storage[inputs[i].id] === "0" ? false : true);
		}
		else if ( inputs[i].type === "radio" ){	if( inputs[i].value === storage[inputs[i].name] ) inputs[i].checked = true; }
		else									inputs[i].value = storage[inputs[i].id];
	}
}

function add_page_handling()
{
	// prevent shifting of page caused by scrollbars:
	scrollbarHandler.registerCenteredElement(document.getElementById('tool-container'));
}

function localize()
{
	var strings = document.getElementsByClassName("i18n");
	for(var i = 0; i < strings.length; i++)
	{
		if (strings[i].nodeName === "INPUT") 	strings[i].placeholder = chrome.i18n.getMessage(strings[i].dataset.i18n);
		else 									strings[i].innerHTML = chrome.i18n.getMessage(strings[i].dataset.i18n) + strings[i].innerHTML;
	}
}