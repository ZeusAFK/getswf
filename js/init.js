window.__webroot = document.getElementById("__init__").getAttribute("src").replace('js/init.js', '');
function load_css(urls){
	$.each(urls, function(index, url, path){
		if(path == null){
			path = '';
		}
		$('<link/>', { rel: 'stylesheet', type: 'text/css', href: window.__webroot + path + url }).appendTo('head');
	});
}
function load_scripts(urls, onload, callback, path){
	if(path == null){
		path = '';
	}
	var loadScript = function(index){
		var url = window.__webroot + path + urls[index];
		var fjs = document.getElementsByTagName('script')[0];
		var js = js = document.createElement('script');
		js.src = url;
		js.onload = function(){
			index++;
			if(index < urls.length){
				onload && onload();
				loadScript(index);
			}else{
				callback && callback();
			}
		};
		fjs.parentNode.insertBefore(js, fjs);
	};
	loadScript(0);
}
function load_json(urls, callback, path){
	var loaded = 0;
	if(path == null){
		path = '';
	}

	$.each(urls, function(index, url){
		$.getJSON([window.__webroot + path + url[1]], function(json) {
			window['__' + url[0]] = json;
			if(++loaded == urls.length){
				callback && callback();
			}
		});
	});
}
if(history.pushState){
	load_scripts(['js/jquery.min.js'], null, function(){
		load_json([['data', 'data.json']], function(){
			load_scripts(['js/underscore.min.js', 'js/backbone.min.js', 'js/backbone.analytics.min.js', 'js/swig.min.js', 'js/main.js']);
		});
	});
}else{
	load_scripts(['js/vendor/jquery.min.js'], function(){}, function(){
		$('body').html("Your browser is not compatible with this application because it is too old, please upgrade your browser.");
	});
}