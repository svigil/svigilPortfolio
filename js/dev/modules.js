/* global jQuery, Tiles, google */

var appInitialized;

(function ($) {
	'use strict';

	// Module name: Tiles
	// Dependencies: jquery.hoverIntent.js, velocity.js, velocity.ui.js
	// Docs: 
	// https://github.com/briancherne/jquery-hoverIntent
	// https://github.com/julianshapiro/velocity
	window.Tiles =(function(){
		var pub = {}, // Public methods
			s = { // Selectors
				img: $('.js-main-image'),
				tiles: $('.js-tile'),
				mainPage: $('#main-page'),
				app: $('.js-app'),
				sections: $('.js-section')
			};

		pub.init = function () {
			setMainImage();

			s.mainPage.addClass('active');
			pub.showTiles();
			bindMainHover();
			bindAnimation();

			Sections.init();
			Sections.bindResize();
		};

		// Private methods
		// Bind tiles behavior on mouseenter and mouseleave
		function bindMainHover () {
			s.mainPage.hoverIntent({
				over: function () {
					pub.mend();
				},
				out: function () {
					pub.explode();
				},
				timeout: 250
			});
		}

		// Set the background image of the tiles
		function setMainImage () {
			var url = $('.js-main-image').eq(0).attr('src');

			if(url){
				s.tiles.css('background-image','url('+ url +')');
			}
		}

		// Animation events
		function bindAnimation () {
			s.app.on('animation.finished', function () {
				s.app.removeClass('animating');
			});
		}

		// Unbind the Hover events when the main page is closed
		function unbindMainHover () {
			s.mainPage.unbind('mouseenter.hoverIntent mouseleave.hoverIntent');
		}

		// Check if main page is open
		function isMainPageActive () {
			return s.mainPage.hasClass('active') ? true : false;
		}

		// Explode the page after 500ms
		function explodeOnTimeOut () {
			setTimeout(function () {
				s.tiles.addClass('explode');

				if(s.mainPage.is(':hover')){
					pub.mend();
				}
			}, 500);
		}

		// Shuffle the order the tiles will be flip
		function shuffle (o) {
            for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
        }

        // Flip the tiles forward or backward
		function flip (direction, callback) {
			var shuffledTiles = shuffle(s.tiles);

			if(direction === 'forward'){
				shuffledTiles.each(function(i){
					var tile = $(this);
					setTimeout(function() {
						s.app.addClass('animating');
						tile.addClass('rotate-forward');
						if(i === shuffledTiles.length-1){
							setTimeout(function () {
								callback();
							}, 800);
						}
					}, 50*i);
				});
			}else{
				shuffledTiles.each(function(i){
					var tile = $(this);
					setTimeout(function() {
						tile.removeClass('rotate-forward');
						if(i === shuffledTiles.length-1){
							setTimeout(function () {
								s.app.trigger('animation.finished');
							}, 800);
						}
					}, 50*i);
				});
			}
		}

		// Animate the elements on the page once the page is open
		function showPage (target, secondary) {
			target.addClass('active');
			
			var delay = 150;

			// Animate Content
			$('.active.section .js-animated-content').velocity('transition.slideDownIn',{
				stagger: delay
			});

			$('.active.section .js-animated-video').velocity('transition.fadeIn');


			// Animate navigation
			if(secondary !== true){
				$('.js-section-nav').css('visibility','visible');
				$('.js-section-nav .section-nav-elem').velocity('transition.slideLeftIn', {
					stagger: delay
				});
			}
			
			// Animate scroll-bar
			setTimeout(function () {
				$('.active.section .js-scroll-bar').velocity({
					'translateX': '40px',
					'opacity': 1
				},{
					easing: 'easeOutExpo',
					duration: 750,
					complete: function () {
						s.app.trigger('animation.finished');
					}
				});
			}, delay*3);

		}

		// Animate the elements backward once the page is closed
		function hidePage (callback, secondary) {
			var selectors = '.active.section .js-animated-content, .active.section .js-animated-video, .active.section .js-scroll-bar';

			s.app.addClass('animating');

			Video.pauseAll();

			if(secondary !== true){ selectors += ', .js-section-nav .section-nav-elem'; }

			$(selectors).velocity('reverse', {
				complete: function () {
					if(secondary !== true){ $('.js-section-nav').css('visibility','hidden'); }

					$('.js-section.active').removeClass('active');
					callback();
				},
				duration: 250
			});

		}

        // Public methods
        // Bind the internal links
		pub.bindGoToTiles = function () {
			$('.js-goto').unbind().click(function(e) {
				e.preventDefault();
			    pub.open($(this).data('target'));
			});
		};

		pub.bindGoToScroll = function () {
			$('.js-goto').unbind().click(function(e) {
				e.preventDefault();
			    $("html, body").animate({ scrollTop: $($(this).data('target')).offset().top + 'px' });
			});
		};
        
        // Open the page with the given ID
        pub.open = function (target) {
        	var $target = $(target);
        	
        	if($target.length && !s.app.hasClass('animating') && !$target.hasClass('active')){
        		
        		if($target.attr('id') === 'main-page'){ // Target: main page
        			hidePage(function () {
        				flip('backward');
        				s.mainPage.addClass('active');
        				bindMainHover();
        				explodeOnTimeOut();
        			});
        		}else if(isMainPageActive()){ // Source: main page; Target: secondary page 
        			s.mainPage.removeClass('active');
        			pub.mend();
        			unbindMainHover();
        			flip('forward', function () {
	        			showPage($(target));
        			});
        		}else{ // Source: secondary page; Target: secondary page
        			hidePage(function () {
	        			showPage($(target), true);
        			}, true);
        		}
        	}

        	Menu.close();

        };


        // Open next page
        pub.openNext = function () {
        	var length = s.sections.length;
        	var current = s.sections.filter('.active').index() - 1;
        	var next = current + 1;

        	if(s.sections.filter('.active').length){
	        	pub.open('#' + s.sections.eq((next >= length) ? 0 : next).attr('id'));
        	}else{
        		pub.open('#' + s.sections.eq(0).attr('id'));
        	}
        };

        // Open previous page
        pub.openPrev = function () {
        	var length = s.sections.length;
        	var current = s.sections.filter('.active').index() - 1;
        	var last = length - 1;
        	var prev = current - 1;

        	if(s.sections.filter('.active').length){
	        	pub.open('#' + s.sections.eq((prev < 0) ? last : prev).attr('id'));
        	} else {
        		pub.open('#' + s.sections.eq(0).attr('id'));
        	}
        };

        // Re-initialize the scroll
        pub.reinitScroll = function (section) {
			if($(section).length){
				$(section).find('.js-scroll-area').sly('reload');
			}
		};

        // Mend the main page
		pub.mend = function () {
			s.tiles.removeClass('explode');
		};

		// Explode the main page
		pub.explode = function () {
			s.tiles.addClass('explode');
		};

		// Fade the tiles on page load
		pub.showTiles = function () {

			s.tiles.addClass('loaded');

			$('.js-menu-trigger').addClass('loaded');

			explodeOnTimeOut();

		};

		return pub;
		
	})();

	// Module name: Sections
	// Dependencies: jquery.sly.js
	// Docs: https://github.com/darsain/sly
	var Sections = (function(){
		var breakpoint = 1200,
			s = {
				sections: $('.js-section:not(.video-section)')
			};

		// Initialize the navigation arrows
		var initNavigation = function () {
			var next = $('.js-next'),
				prev = $('.js-prev');

			next.click(function(e) {
				e.preventDefault();
				Tiles.openNext();
			});

			prev.click(function (e) {
				e.preventDefault();
				Tiles.openPrev();
			});
		};

		// Bind keyboard navigation
		var initKeyNavigation = function  () {
			$('body').keydown(function (e) {
				if($(window).outerWidth() > 1200){
					if(e.keyCode == 37) { // left
						Tiles.openPrev();
					} else if(e.keyCode == 38) { // top
						Tiles.open('#main-page');
					} else if(e.keyCode == 39) { // right
						Tiles.openNext();
					} 
				}
			});
		};

		// Bind internal page custom scroll
		var initScroll = function () {
			var sections = s.sections.find('.js-scroll-area');

			sections.each(function() {
				var section = $(this);
				var scroll = section.parent().find('.js-scroll-bar');

				section.sly({
					speed: 300,
					easing: 'easeOutExpo',
					scrollBar: scroll,
					dragHandle: 1,
					scrollBy: 120,
					mouseDragging: 0,
					interactive: '#google-map div, #google-map img',
					touchDragging: 1,
					releaseSwing:  1,
					dynamicHandle: 1,
					clickBar: 1,
					elasticBounds: 0
				});

			});
		};

		return {

			// Initialize all the sections
			init: function () {
				var windowW = $(window).outerWidth();

				$('window').scrollTop(0);

				if(breakpoint < windowW){
					initScroll();
					initNavigation();
					initKeyNavigation();
					Tiles.bindGoToTiles();


					appInitialized = true;

				}else{
			  		Tiles.bindGoToScroll();
					
					appInitialized = false;
				}
			},

			// Destroy all the sections
			destroy: function () {
				var sections = s.sections.find('.js-scroll-area');

				sections.each(function() {
					var section = $(this);

					section.sly(false);
				});
			},

			// Destroy the app if the window is smaller than the breakpoint
			// Reinitialize the app if the window is bigger than the breakpoint
			bindResize: function () {

				var resizeTimer;

				$(window).on('resize', function() {
				  clearTimeout(resizeTimer);
				  resizeTimer = setTimeout(function() {

				  	var windowW = $(window).outerWidth();

				  	if(breakpoint < windowW && !appInitialized){
				  		Sections.init();
						Tiles.bindGoToTiles();
				  		appInitialized = true;
				  	}else if(breakpoint > windowW && appInitialized){
				  		Sections.destroy();
				  		Tiles.bindGoToScroll();
				  		appInitialized = false;
				  	}

				  	if(typeof $('.js-scroll-area').sly === 'function'){
					  	$('.js-scroll-area').sly('reload');
				  	}


				  }, 250);
				});
			}
		};
	})();

	// Name: Skills
	// Dependencies: no dependencies
	(function(){
		$('.js-skill-item').each(function() {
			var skill = $(this),
				bar = skill.find('.js-skill-progress'),
				progress = skill.data('progress');

			bar.css('width', progress + '%');

		});
	})();

	// Name: Experience Slider
	// Dependencies: owl.carousel.js, jquery.equalHeight.js
	// Docs:
	// https://github.com/smashingboxes/OwlCarousel2
	// https://github.com/Sam152/Javascript-Equal-Height-Responsive-Rows
	var ExperienceSlider = (function(){
		return {
			init: function () {
				var slider = $('.js-experience-slider'),
					items = slider.find('.experience-list-item');

				slider.owlCarousel({
				    loop:true,
				    margin:30,
				    nav:true,
				    navText:[
				    	'<span class="js-prev-experience experience-nav exp-prev"><i class="fa fa-long-arrow-left"></i></span>',
				    	'<span class="js-next-experience experience-nav exp-next"><i class="fa fa-long-arrow-right"></i></span>'
				    ],
				    responsive:{
				        0:{
				            items:1
				        },
				        700:{
				            items:2
				        },
				        1200:{
				            items:2
				        },
				        1400:{
				        	items:3
				        }
				    }
				});

				items.responsiveEqualHeightGrid();
			}
		};
	})();

	// Name: Portfolio
	// Dependencies: lightbox.js
	// Docs: https://github.com/lokesh/lightbox2/
	var Portfolio = (function(){
		return {
			initSquarePreviews: function () {
				var previews = $('.js-portfolio-preview');

				previews.each(function() {
					var preview = $(this),
						w = preview.outerWidth(),
						h = preview.outerHeight();

					if(w > h){
						preview.addClass('preview-larger');
					}else{
						preview.addClass('preview-higher');
					}

				});
			},

			init: function () {
				this.initSquarePreviews();
			}
		};
	})();

	// Name: Accordion
	// Dependencies: no dependencies
	var Accordion = (function(){
		return {
			init: function () {
				var accordions = $('.js-accordion');

				accordions.each(function() {
					var accordion = $(this);
					var title = accordion.find('.accordion-title');

					title.click(function (event) {
						event.preventDefault();

						var title = $(this);
						var scope = title.closest('.accordion-item');
						var content = $('.accordion-content', scope);

						if(content.hasClass('active')){
							title.removeClass('active');
							content.stop().slideUp(function () {
								Tiles.reinitScroll('#' + accordion.closest('.js-section').attr('id'));
							}).removeClass('active');
						}else{
							title.addClass('active');
							content.stop().slideDown(function () {
								Tiles.reinitScroll('#' + accordion.closest('.js-section').attr('id'));
							}).addClass('active');
						}
					});
				});
			}
		};
	})();

	// Name: Menu
	// Dependencies: no dependencies
	var Menu = (function(){
		var menu = $('.js-menu'),
			trigger = menu.find('.js-menu-trigger'),
			cover = menu.find('.js-cover');

		return {
			init: function () {

				var self = this;

				trigger.click(function (e) {
					e.stopPropagation();
					self.open();
				});

				cover.click(function (e) {
					e.stopPropagation();
					self.close();
				});
			},

			open: function () {
				menu.addClass('active');
			},

			close: function () {
				menu.removeClass('active');
			}
		};
	})();

	// Name: Map
	// Dependencies: no dependencies
	var Map = (function(){
		var mapId = 'google-map',
			mapStyle = [
			    {
			        "featureType": "landscape",
			        "stylers": [
			            {
			                "saturation": -100
			            },
			            {
			                "lightness": 65
			            },
			            {
			                "visibility": "on"
			            }
			        ]
			    },
			    {
			        "featureType": "poi",
			        "stylers": [
			            {
			                "saturation": -100
			            },
			            {
			                "lightness": 51
			            },
			            {
			                "visibility": "simplified"
			            }
			        ]
			    },
			    {
			        "featureType": "road.highway",
			        "stylers": [
			            {
			                "saturation": -100
			            },
			            {
			                "visibility": "simplified"
			            }
			        ]
			    },
			    {
			        "featureType": "road.arterial",
			        "stylers": [
			            {
			                "saturation": -100
			            },
			            {
			                "lightness": 30
			            },
			            {
			                "visibility": "on"
			            }
			        ]
			    },
			    {
			        "featureType": "road.local",
			        "stylers": [
			            {
			                "saturation": -100
			            },
			            {
			                "lightness": 40
			            },
			            {
			                "visibility": "on"
			            }
			        ]
			    },
			    {
			        "featureType": "transit",
			        "stylers": [
			            {
			                "saturation": -100
			            },
			            {
			                "visibility": "simplified"
			            }
			        ]
			    },
			    {
			        "featureType": "administrative.province",
			        "stylers": [
			            {
			                "visibility": "off"
			            }
			        ]
			    },
			    {
			        "featureType": "water",
			        "elementType": "labels",
			        "stylers": [
			            {
			                "visibility": "on"
			            },
			            {
			                "lightness": -25
			            },
			            {
			                "saturation": -100
			            }
			        ]
			    },
			    {
			        "featureType": "water",
			        "elementType": "geometry",
			        "stylers": [
			            {
			                "hue": "#ffff00"
			            },
			            {
			                "lightness": -25
			            },
			            {
			                "saturation": -97
			            }
			        ]
			    }
			];

		return {
			init: function () {
				if($('#'+mapId).length){
					var	mapBlock = document.getElementById(mapId);
					var myLatlng = new google.maps.LatLng($(mapBlock).data('lon'), $(mapBlock).data('lat'));
					
					var	mapOptions = {
				      	zoom: 15,
						center: myLatlng,
				      	mapTypeId: google.maps.MapTypeId.ROADMAP,
				      	styles: mapStyle,
				      	scrollwheel: false
					};

					var	map = new google.maps.Map(mapBlock, mapOptions);

					var image = {
						url: 'img/pin.png'
					};

					var marker = new google.maps.Marker({
						position: myLatlng,
						icon: image
					});

					marker.setMap(map);
				}
			}
		};
	})();

	// Name: Circle Progress
	// Dependencies: jquery.circle-progress.js
	// Docs: https://github.com/kottenator/jquery-circle-progress
	var CircleProgress = (function(){
		var circles = $('.js-circle');

		return {
			init: function () {
				circles.each(function() {
					var circle = $(this),
						value = circle.data('value');

					if (value){
						circle.circleProgress({
							value: value,
							size: 125,
							thickness: 6,
							lineCap: 'round',
							startAngle: -Math.PI/2,
							fill: {
								'color': '#bec0cb'
							}
						});
					}
				});
			}
		};
	})();

	// Name: Testimonials
	// Dependencies: jquery.equalHeight.js
	// Docs: https://github.com/Sam152/Javascript-Equal-Height-Responsive-Rows
	var Testimonials = (function(){
		var testims = $('.js-testimonial');
		
		return {
			init: function () {
				testims.responsiveEqualHeightGrid();
			}
		};
	})();

	// Name: Video
	// Dependencies: jquery.fitvids.js, jquery.vimeo.api.js
	// Docs: 
	// https://github.com/davatron5000/FitVids.js
	// https://github.com/jrue/Vimeo-jQuery-API
	var Video = (function(){
		var videos = $('.js-video');

		return {
			init: function () {
				$('body').fitVids();
			},

			pauseAll: function () {

				if (videos.length) {
					videos.vimeo('pause');
				}
			}
		};
	})();


	// Name: Preloader
	// Dependencies: queryloader2.js
	// Docs: https://github.com/Gaya/queryloader2
	$("body").queryLoader2({
		backgroundColor: "#ececed",
		barColor: '#f56e4e',
		barHeight: 2,
		minimumTime: 800,
		percentage: true,
		fadeOutTime: 250,
		onComplete: function () {
			ExperienceSlider.init();
			Accordion.init();
			Menu.init();
			Portfolio.init();
			Map.init();
			CircleProgress.init();
			Testimonials.init();
			Video.init();
			Tiles.init();
		}
	});


})(jQuery);