NDAL = {
	options: {
		delay: 0,
		streams: true,
		streamBG: false,
		timer: true,
		showLutes: true,
		bg: 'cawmunity',
		lutes: 'default'
	},
	init: function() {
		this.initOptions();

		window.addEventListener('hashchange', function() {
			window.location.reload();
		});

		if(this.options.racers) {
			this.racer1 = this.options.racers[0].toLowerCase();
			this.racer2 = this.options.racers[1].toLowerCase();
			this.racer1points = 0;
			this.racer2points = 0;
			this.initRacers();
		} else if(this.options.singleRacer) {
			this.initSingleRacer();
			return;
		}

		if(this.options.streamBG) {
			$('body').addClass('stream-bg');
		}

		this.initCSS();

		if(EventSource) {
			var es = new EventSource("http://necrommunity.ovh:8080/sse");
			es.onmessage = this.serverMessage.bind(this);
			this.showError = true;
			es.onerror = function() {
				if(this.showError) $('.loading').html('could not connect to server<br>please try adding racers manually to the URL');
			}.bind(this);
		}
	},
	initOptions: function() {
		var hash = window.location.hash.substr(1);
		if(hash) {
			var options = hash.split('|');
			if(options[0]) {
				var racers = options[0].split('/');
				if(racers.length == 2 ) {
					this.options.racers = racers;
				} else {
					this.options.singleRacer = racers[0].toLowerCase();
				}
			}
			if(options[1]) {
				this.options.delay = parseInt(options[1], 10);
			}
			if(options[2]) {
				var opt = options[2].split('');
				if(opt[0]) {
					this.options.streams = (opt[0] === '1');
				}
				if(opt[1]) {
					this.options.streamBG = (opt[1] === '1');
				}
				if(opt[2]) {
					this.options.timer = (opt[2] === '1');
				}
				if(opt[3]) {
					this.options.showLutes = (opt[3] === '1');
				}
			}
			if(options[3]) {
				this.options.bg = options[3];
			}
			if(options[4]) {
				this.options.lutes = options[4];	
			}
		}
	},
	initRacers: function() {
		$('.left-racer-name').html(this.racer1);
		$('.right-racer-name').html(this.racer2);
		if(this.options.streams) {
			if(navigator.mimeTypes['application/x-shockwave-flash']) {
				jwplayer.key="sE55hjyvUkJRzT/MepMYgSd3uVh7nSALNszoXg==";
				jwplayer('racer-left-player').setup({
					file: "rtmp://rtmp.condorleague.tv/"+this.racer1+"/live",
					autostart: true,
					title: this.racer1+" RTMP",
					height: "100%",
					width: "100%"
				});
				jwplayer('racer-right-player').setup({
					file: "rtmp://rtmp.condorleague.tv/"+this.racer2+"/live",
					autostart: true,
					title: this.racer2+" RTMP",
					height: "100%",
					width: "100%"
				});
			} else {
				if(/android/i.test(navigator.userAgent)) {
					$('#racer-left-player').html('Flash not found, <a href="intent://rtmp.condorleague.tv/'+this.racer1+'/live/#Intent;scheme=rtmp;package=org.videolan.vlc;end">Open in Android VLC</a>');
					$('#racer-right-player').html('Flash not found, <a href="intent://rtmp.condorleague.tv/'+this.racer2+'/live/#Intent;scheme=rtmp;package=org.videolan.vlc;end">Open in Android VLC</a>');
				} else if(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
					$('#racer-left-player').html('Flash not found, <a href="vlc-x-callback://x-callback-url/stream?url=rtmp://rtmp.condorleague.tv/'+this.racer1+'/live">Open in iOS VLC</a>');
					$('#racer-right-player').html('Flash not found, <a href="vlc-x-callback://x-callback-url/stream?url=rtmp://rtmp.condorleague.tv/'+this.racer2+'/live">Open in iOS VLC</a>');
				} else {
					$('#racer-left-player').html('Flash not found, Sorry');
					$('#racer-right-player').html('Flash not found, Sorry');
				}			
			}
		}
		$('.loading').hide();
		$('.layout').show();
	},
	initSingleRacer: function() {
		$('.loading').html('<h2>'+this.options.singleRacer+'</h2><div id="player"></div>');
		if(navigator.mimeTypes['application/x-shockwave-flash']) {
			jwplayer.key="sE55hjyvUkJRzT/MepMYgSd3uVh7nSALNszoXg==";
			jwplayer('player').setup({
				file: "rtmp://rtmp.condorleague.tv/"+this.options.singleRacer+"/live",
				autostart: true,
				title: this.options.singleRacer+" RTMP",
				aspectratio: "16:9",
				width: "100%"
			});
		} else {
			if(/android/i.test(navigator.userAgent)) {
				$('#player').html('Flash not found, <a href="intent://rtmp.condorleague.tv/'+this.options.singleRacer+'/live/#Intent;scheme=rtmp;package=org.videolan.vlc;end">Open in Android VLC</a>');
			} else if(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
				$('#player').html('Flash not found, <a href="vlc-x-callback://x-callback-url/stream?url=rtmp://rtmp.condorleague.tv/'+this.options.singleRacer+'/live">Open in iOS VLC</a>');
			} else {
				$('#player').html('Flash not found, Sorry');
			}			
		}
	},
	initCSS: function() {
		var sheet = document.getElementById('maincss').sheet;
		for (var i = 1; i < 8; i++) {
			sheet.insertRule('.ll'+i+' { background-image: url(../img/lutes/'+this.options.lutes+'/lute-left-'+i+'.png);}', sheet.cssRules.length);
			sheet.insertRule('.lr'+i+' { background-image: url(../img/lutes/'+this.options.lutes+'/lute-right-'+i+'.png);}', sheet.cssRules.length);
		}
		sheet.insertRule('.background {	background-image: url(../img/backgrounds/'+this.options.bg+'.png);}', sheet.cssRules.length);
	},
	isMessageForThisRace: function(data) {
		return (this.racer1 == data.racers[0].toLowerCase() && this.racer2 == data.racers[1].toLowerCase()) || (this.racer1 == data.racers[1].toLowerCase() && this.racer2 == data.racers[0].toLowerCase());
	},
	serverMessage: function(event) {
		this.showError = false;
		var message = JSON.parse(event.data);
		switch(message.type) {
			case 'norace':
				$('.loading').html('No race going on right now.<br>Please <a href="http://wcstats.condorleague.tv/" target="_blank">check the schedule for the next race.</a>');
				break;
			case 'init':
				var data = message.data;
				if(!this.racer1) {
					if(data.multi) {
						var multi = 'Multiple races going on, click on one:<br><br><br>',
							options = window.location.hash.match(/\|.*/) || '';
						for (var i = 0; i < data.races.length; i++) {
							var race = data.races[i];
							multi += race.racers[0].toLowerCase() + ' ' + (race.score[0]||0) + ' - ' + (race.score[1]||0) + ' ' + race.racers[1].toLowerCase() +
									' <a href="#'+race.racers[0].toLowerCase()+'/'+race.racers[1].toLowerCase()+options+'">watch</a><br><br>';
						}
						$('.loading').html(multi);
						break;
					}
					this.racer1 = data.racers[0].toLowerCase();
					this.racer2 = data.racers[1].toLowerCase();
					this.initRacers();
				}
				if(data.multi) {
					for (var i = 0; i < data.races.length; i++) {
						if(this.isMessageForThisRace(data.races[i])) {
							data = data.races[i];
							break;
						}
					}
				}
				if(this.isMessageForThisRace(data)) {
					this.racer1points = 0;
					this.racer2points = 0;
					for(var j = 0; j < 2; j++) {
						for(var i = 0; i < data.score[j]; i++) {
							this.addLute(data.racers[j].toLowerCase());
						}
					}
					if(data.timer) {
						this.timer.start(parseInt(data.timer, 10) - delay);
					} else {
						this.timer.setup();
					}
				}
				break;
			case 'start':
				var data = message.data;
				if(this.isMessageForThisRace(data)) {
					window.setTimeout(function(){
						this.timer.start();
					}.bind(this), this.options.delay);					
				}
				break;
			case 'end':
				var data = message.data;
				if(this.isMessageForThisRace(data)) {
					window.setTimeout(function(){
						this.timer.stop();
						this.addLute(data.winner.toLowerCase());
					}.bind(this), this.options.delay);
				}
				break;
		}
	},
	addLute: function(racer) {
		var position = racer == this.racer1 ? 'l' : 'r',
			points = racer == this.racer1 ? ++this.racer1points : ++this.racer2points;
		if(!this.options.showLutes) return;
		$('.lutes').append('<div class="lute l'+position+points+'"/>')
	},
	timer: {
		setup: function() {
			if(!NDAL.options.timer) return;
			$('.timer').removeClass('running').html('<span>0</span><span>0</span>:<span>0</span><span>0</span>.<span>0</span><span>0</span>');
		},
		start: function(time) {
			if(!NDAL.options.timer) return;
			time = time || 0;
			this.startTime = Date.now() - time;
			$('.timer').addClass('running');
			var timeFn = function() {
				if(this.startTime) {
					var total = Math.floor((Date.now() - this.startTime)/10),
						min = Math.floor(total / 6000),
						sec = Math.floor((total-(min*6000)) / 100),
						ms = total-(min*6000)-(sec*100);
					if(min<10) min = '0'+min;
					if(sec<10) sec = '0'+sec;
					if(ms<10) ms = '0'+ms;
					min = '<span>'+(''+min).split('').join('</span><span>')+'</span>';
					sec = '<span>'+(''+sec).split('').join('</span><span>')+'</span>';
					ms = '<span>'+(''+ms).split('').join('</span><span>')+'</span>';
					$('.timer').html(min+':'+sec+'.'+ms);
					window.requestAnimationFrame(timeFn.bind(this));
				}
			}.bind(this);

			this.raf = window.requestAnimationFrame(timeFn);
		},
		stop: function() {
			if(!NDAL.options.timer) return;
			$('.timer').removeClass('running');
			this.startTime = false;
			window.cancelAnimationFrame(this.raf);
		}
	}

};

NDAL.init();