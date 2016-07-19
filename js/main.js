$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
    options.async = true;
});
(function(){
	var _waitUntilExists = {
		pending_functions : [],
		loop_and_call : function()
		{
			if(!_waitUntilExists.pending_functions.length){return}
			for(var i=0;i<_waitUntilExists.pending_functions.length;i++)
			{	
				var obj = _waitUntilExists.pending_functions[i];
				var resolution = document.getElementById(obj.id);
				if(obj.id == document){
					resolution = document.body;
				}
				if(resolution){
					var _f = obj.f;
					_waitUntilExists.pending_functions.splice(i, 1);
					if(obj.c == "itself"){obj.c = resolution;}
					_f.call(obj.c);						
					i--;	
				}
			}
		},
		global_interval : setInterval(function(){_waitUntilExists.loop_and_call();},5)
	};
	if(document.addEventListener){
		document.addEventListener("DOMNodeInserted", _waitUntilExists.loop_and_call, false);
		clearInterval(_waitUntilExists.global_interval);
	}
	window.waitUntilExists = function(id,the_function,context){
		context = context || window;
		if(typeof id == "function"){context = the_function;the_function = id;id=document}
		_waitUntilExists.pending_functions.push({f:the_function,id:id,c:context});
	};
	waitUntilExists.stop = function(id,f){
		for(var i=0;i<_waitUntilExists.pending_functions.length;i++){
			if(_waitUntilExists.pending_functions[i].id==id && (typeof f == "undefined" || _waitUntilExists.pending_functions[i].f == f))
			{
				_waitUntilExists.pending_functions.splice(i, 1);
			}
		}
	};
	waitUntilExists.stopAll = function(){
		_waitUntilExists.pending_functions = []
	};
})();
tpl = {
	loadedTemplates: [],
	loadTemplates: function(template, callback, module){
		var template_file = window.__webroot + template + '.html';
		if($.inArray(template, this.loadedTemplates) >= 0){
			callback();
		}else{
			$.get(template_file, { "v": window.__data.configuration.version, "r": window.__data.configuration.revision }, function(data){
				tpl.loadedTemplates.push(template);
				$(document.body).append(
					$('<script />').attr('type', 'text/x-template').attr('id', template).text(escape(data))
				);
				callback();
			}).fail(function(){
				if(template != 'templates/' + window.__data.configuration.template + '/404'){
					require_template('templates/' + window.__data.configuration.template + '/404', function(){
						var template_404 = swig.compile(tpl.get('templates/' + window.__data.configuration.template + '/404'));
						$('#_swf_content').html(template_404({ window: window, module : module, message: 'Template file not found: ' + template_file }));
					}, module);
				}else{
					$('#_swf_content').html('Could not load the specified module and a 404 template not found: ' + module + '<br/>Template file not found: ' + template_file);
				}
			});
		}
	},
	get: function(name){
		return unescape($(document.getElementById(name)).html());
	}
};
var appReady = $.Deferred();
var AppRouter = Backbone.Router.extend({
	initialize: function() {
		initialize();
	},
	routes: {
		':module/*path' : 'module',
		'*path'			: 'default'
	},
	default: function(params) {
		$.when(appReady).done(function(){
			load_module(params);
		});
	},
	module: function(module, params){
		$.when(appReady).done(function(){
			load_module(module, params);
		});
	}
});
function require_template(template, callback, module){
	var rand = Math.floor(Math.random() * 10000);
	window.templateLoaded[rand] = $.Deferred();
	$.when(window.templateLoaded[rand]).done(callback);

	tpl.loadTemplates(template, function(){
		window.templateLoaded[rand].resolve(true);
	}, module);
}
function load_module(module, params, container){
	if(module == null){
		module = 'home'; 
	}else{
		Backbone.history.navigate(module, { trigger: true });
	}
	if(container == null){
		container = '_swf_content';
	}
	
	if(module != 'home'){
		$('#_swf_banner').empty();
	}

	if(window.__data.module_alias.list.hasOwnProperty(module)){
		module = window.__data.module_alias.list[module];
	}

	var template_file = 'modules/mod_' + module + '/template';
	require_template(template_file, function(){
		var template = swig.compile(tpl.get(template_file));
		$('#' + container).html(template({ module: module, template: 'modules/mod_' + module + '/', data: window.__data }));

		if($('#_swf_menu_' + module).length){
			$('._swf_menu_item').removeClass(window.__data.menu.active);
			$('#_swf_menu_' + module).addClass(window.__data.menu.active);
		}else{
			waitUntilExists('_swf_menu_' + module, function(){
				$('._swf_menu_item').removeClass(window.__data.menu.active);
				$('#_swf_menu_' + module).addClass(window.__data.menu.active);
			}, 'itself');
		}
	}, module);
}
function load_template_section(section, container, callback){
	require_template('templates/' + window.__data.configuration.template + '/' + section, function(){
		var template = swig.compile(tpl.get('templates/' + window.__data.configuration.template + '/' + section));
		$('#' + container).html(template({ template: 'templates/' + window.__data.configuration.template + '/', data: window.__data }));
		callback && callback();
	}, section);
}
function initialize(){
	window.templateLoaded = [];
	load_json([['lang', 'langs/' + window.__data.configuration.language + '.json']], function(){
		var template_file = 'templates/' + window.__data.configuration.template + '/template';
		require_template(template_file, function(){
			var template = swig.compile(tpl.get(template_file));
			$('body').html(template({ template: 'templates/' + window.__data.configuration.template + '/', data: window.__data }));
			appReady.resolve(true);
		}, 'main');
	});
}
$(document).on("click", "a:not([data-bypass])", function(evt){
	var href = { prop: $(this).prop("href"), attr: $(this).attr("href") };
	var root = location.protocol + "//" + location.host + window.__data.configuration.path;

	if(href.prop && href.prop.slice(0, root.length) === root && href.attr != '#'){
		evt.preventDefault();
		Backbone.history.navigate(href.attr, { trigger: true });
	}
});
app = new AppRouter();
Backbone.history.start({ pushState: true, root: window.__data.configuration.path });
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-38205311-3', 'auto');
ga('send', 'pageview');