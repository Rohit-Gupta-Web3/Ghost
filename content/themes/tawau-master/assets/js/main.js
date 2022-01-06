/**
 * Main JS file for Tawau
 */

jQuery(document).ready(function($) {

    var config = {
        'share-selected-text': true,
        'load-more': true,
        'infinite-scroll': false,
        'infinite-scroll-step': 3,
        'disqus-shortname': 'hauntedthemes-demo',
        'content-api-host': '',
        'content-api-key': '',
    };

    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        checkMorph = false,
        didScroll,
        lastScrollTop = 0,
        delta = 5;

    var ghostAPI = new GhostContentAPI({
        host: config['content-api-host'],
        key: config['content-api-key'],
        version: 'v2'
    });

    setGalleryRation();

    // Execute on load
    $(window).on('load', function(event) {

        setGalleryRation();
        setMorphHeight();

        var currentPage = 1;
        var pathname = window.location.pathname;
        var $result = $('.post');
        var step = 0;

        // remove hash params from pathname
        pathname = pathname.replace(/#(.*)$/g, '').replace('/\//g', '/');

        if ($('body').hasClass('paged')) {
            currentPage = parseInt(pathname.replace(/[^0-9]/gi, ''));
        }

        // Load more posts on click
        if (config['load-more']) {

            $('#load-posts').addClass('visible');

            $('#load-posts').on('click', function(event) {
                event.preventDefault();

                if (currentPage == maxPages) {
                    $('#load-posts').addClass('hidden');
                    return;
                };

                var $this = $(this);

                // next page
                currentPage++;

                if ($('body').hasClass('paged')) {
                    pathname = '/';
                };

                // Load more
                var nextPage = pathname + 'page/' + currentPage + '/';

                if ($this.hasClass('step')) {
                    setTimeout(function() {
                       $this.removeClass('step');
                       step = 0;
                    }, 1000);
                };

                $.get(nextPage, function (content) {
                    step++;
                    var post = $(content).find('.post').addClass('hidden');
                    $('#content.loop').append( post );
                    $.each(post, function(index, val) {
                        var $this = $(this);
                        var id = $(this).attr('data-id');
                        $('#content.loop').imagesLoaded( function() {
                            $this.removeClass('hidden');
                        });
                    });
                });

            });
        };

        if (config['infinite-scroll'] && config['load-more']) {
            var checkTimer = 'on';
            if ($('#load-posts').length > 0) {
                $(window).on('scroll', function(event) {
                    var timer;
                    if (isScrolledIntoView('#load-posts') && checkTimer == 'on' && step < config['infinite-scroll-step']) {
                        $('#load-posts').click();
                        checkTimer = 'off';
                        timer = setTimeout(function() {
                            checkTimer = 'on';
                            if (step == config['infinite-scroll-step']) {
                                $('#load-posts').addClass('step');
                            };
                        }, 1000);
                    };
                });
            };
        };

    });
    
    // Add classes and attributes for Fluidbox library
    $('.post-content img').each(function(index, el) {
        if (!$(this).parent().is("a") && !$(this).hasClass('error')) {
            $( "<a href='" + $(this).attr('src') + "' class='zoom'></a>" ).insertAfter( $(this) );
            $(this).appendTo($(this).next("a"));
        };
    });

    $('.zoom').fluidbox();

    var shareHeight = $('.content-inner .social-share').height();
    $(window).on('scroll', function(event) {
        $('.zoom').fluidbox('close');

        var checkShare = 0;
        
        $('.content-inner .kg-image-wide, .content-inner .kg-image-full').each(function(index, el) {
            var scrollTop = $(window).scrollTop();
            var elementOffset = $(this).offset().top;
            var imgDistance = (elementOffset - scrollTop);
            var imgHeight = $(this).height();
            var shareDistance = shareHeight + 100;
            if (imgDistance < shareDistance && (imgDistance + imgHeight) > 100) {
                checkShare++;
            };
        });

        if (checkShare > 0) {
            $('.content-inner .social-share').addClass('fade');
        }else{
            $('.content-inner .social-share').removeClass('fade');
        };

    });

    // Initialize shareSelectedText
    if (config['share-selected-text']) {
        shareSelectedText('.content-inner .post-content', {
            sanitize: true,
            buttons: [
                'twitter',
            ],
            tooltipTimeout: 250
        });
    };

    // Position social share buttons inside a single post
    var checkIfSticky = 0;
    if (w >= 992) {
        stickIt();
        checkIfSticky = 1;
    };

    // Initialize Disqus comments
    if ($('#content').attr('data-id') && config['disqus-shortname'] != '') {

        $('.comments').append('<div id="disqus_thread"></div>')

        var url = [location.protocol, '//', location.host, location.pathname].join('');
        var disqus_config = function () {
            this.page.url = url;
            this.page.identifier = $('#content').attr('data-id');
        };

        (function() {
        var d = document, s = d.createElement('script');
        s.src = '//'+ config['disqus-shortname'] +'.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
        })();
    };

    // Search and Menu triggers
    $('.search-trigger, .nav-trigger').on('click', function(event) {
        event.preventDefault();

        var className = event.currentTarget.className;

        if ($('body').hasClass('scroll') && !$('body').hasClass('overflow-y')) {
            return;
        };

        if ($('body, html').hasClass('end-search-trigger') && $(this).hasClass('nav-trigger')) {
            $('body, html').removeClass('begin-search-trigger end-search-trigger').addClass('begin-nav-trigger end-nav-trigger');
            return;
        };

        if ($('body, html').hasClass('end-nav-trigger') && $(this).hasClass('search-trigger')) {
            $('body, html').removeClass('begin-nav-trigger end-nav-trigger').addClass('begin-search-trigger end-search-trigger');
            return;
        };

        if (!$('body').hasClass('end')) {
            if (!$('body').hasClass('begin')) {
                morphStart(className);
            };
        }else{
            morphReverse(className);
        }
    });

    var ghostSearch = new GhostSearch({
        host: config['content-api-host'],
        key: config['content-api-key'],
        input: '#search-field',
        results: '#results',
        template: function(result) {
            let url = [location.protocol, '//', location.host].join('');
            return '<li><a href="' + url + '/' + result.slug + '/">' + result.title + '</a></li>';  
        },
    });

    // Validate Subscribe input
    $('.gh-signin').on('submit', function(event) {
        var email = $('.gh-input').val();
        if (!validateEmail(email)) {
            $('.gh-input').addClass('error');
            setTimeout(function() {
                $('.gh-input').removeClass('error');
            }, 500);
            event.preventDefault();
        };
    });

    // Animation for shareSelectedText
    $('.tooltip').prependTo('.share-selected-text-inner');
    $('.share-selected-text-btn').prependTo('.tooltip-content');

    const config_tooltip = {
        in: {
            base: {
                duration: 200,
                easing: 'easeOutQuad',
                rotate: [35,0],
                opacity: {
                    value: 1,
                    easing: 'linear',
                    duration: 100
                }
            },
            content: {
                duration: 1000,
                delay: 50,
                easing: 'easeOutElastic',
                translateX: [50,0],
                rotate: [10, 0],
                opacity: {
                    value: 1,
                    easing: 'linear',
                    duration: 100
                }
            },
            trigger: {
                translateX: [
                    {value: '-30%', duration: 130, easing: 'easeInQuad'},
                    {value: ['30%','0%'], duration: 900, easing: 'easeOutElastic'}
                ],
                opacity: [
                    {value: 0, duration: 130, easing: 'easeInQuad'},
                    {value: 1, duration: 130, easing: 'easeOutQuad'}
                ],
                color: [
                    {value: '#6fbb95', duration: 1, delay: 130, easing: 'easeOutQuad'}
                ]
            }
        },
        out: {
            base: {
                duration: 200,
                delay: 100,
                easing: 'easeInQuad',
                rotate: -35,
                opacity: 0
            },
            content: {
                duration: 200,
                easing: 'easeInQuad',
                translateX: -30,
                rotate: -10,
                opacity: 0
            },
            trigger: {
                translateX: [
                    {value: '-30%', duration: 200, easing: 'easeInQuad'},
                    {value: ['30%','0%'], duration: 200, easing: 'easeOutQuad'}
                ],
                opacity: [
                    {value: 0, duration: 200, easing: 'easeInQuad'},
                    {value: 1, duration: 200, easing: 'easeOutQuad'}
                ],
                color: [
                    {value: '#666', duration: 1, delay: 200, easing: 'easeOutQuad'}
                ]
            }
        }
    };

    $('.tooltip').each(function(index, el) {
        var $this = $(this);
        var base = $(this).find('.tooltip-base')[0];
        var content = $(this).find('.tooltip-content')[0];
        $('.content-inner .post-content').bind('mouseup', function(e){
            if (window.getSelection || document.selection) {
                var sel = window.getSelection();
                $this.mouseTimeout = setTimeout(function() {
                    $this.isShown = true;
                    animateTooltip('in', base, content);
                }, 500);
            }
        });
        $('body').bind('mousedown', function(e){
            if (window.getSelection || document.selection) {
                clearTimeout($this.mouseTimeout);
                if( $this.isShown ) {
                    $this.isShown = false;
                    animateTooltip('out', base, content);
                }
            }
        });
    });

    if (typeof Object.assign != 'function') {
      Object.assign = function(target) {
        'use strict';
        if (target == null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
          var source = arguments[index];
          if (source != null) {
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
        }
        return target;
      };
    }

    // On scroll check if header should be visible or not
    $(window).on('scroll', function(event) {
        didScroll = true;
    });

    setInterval(function() {
        if (didScroll && checkMorph == false) {
            hasScrolled();
            didScroll = false;
        }
    }, 250);

    // Execute on resize
    $(window).on('resize', function () {

        w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

        if (w < 960) {
            $('.content-inner .post-content .social-share').trigger("sticky_kit:detach");
            checkIfSticky = 0;
        }else{
            if (checkIfSticky == 0) {
                stickIt();
                checkIfSticky++;
            }
        };

        setMorphHeight();

    });

    // Tawau's functions

    // Check if element is into view when scrolling
    function isScrolledIntoView(elem){
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();

        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }

    // Get first number of words from a string
    function getWords(str) {
        return str.split(/\s+/).slice(0,44).join(" ");
    }

    // Morph effect start
    function morphStart(c){
        var morphing = anime({
            targets: '#morphing .path',
            d: [
              { value: 'M 10,0 L 10,0 C 10,0 10,0 5,0 C 0,0 0,0 0,0 L 0,0 Z' },
              { value: 'M 10,0 L 10,0 C 10,0 10,5 5,5 C 0,5 0,0 0,0 L 0,0 Z' },
              { value: 'M10 0 L10 10 C10 10 10 10 5 10 C0 10 0 10 0 10 L0 0 '}
            ],
            easing: 'easeInOutQuint',
            duration: 1000,
            loop: false,
        });  

        morphing.begin = function(){
            $('body, html').addClass('overflow-y begin ' + 'begin-' + c);
        }

        morphing.complete = function(){
            $('body, html').addClass('overflow-y end ' + 'end-' + c);
            setTimeout(function() {
                $('#search-field').focus();
            }, 100);
        }

    }

    // Morph effect reverse
    function morphReverse(c){
        var morphing = anime({
            targets: '#morphing .path',
            d: [
              { value: 'M10 0 L10 10 C10 10 10 10 5 10 C0 10 0 10 0 10 L0 0' },
              { value: 'M 10,0 L 10,0 C 10,0 10,5 5,5 C 0,5 0,0 0,0 L 0,0 Z' },
              { value: 'M 10,0 L 10,0 C 10,0 10,0 5,0 C 0,0 0,0 0,0 L 0,0 Z '}
            ],
            easing: 'easeInOutQuint',
            duration: 1000,
            loop: false
        });  

        morphing.begin = function(){
            $('body, html').removeClass('overflow-y end ' + 'end-' + c);
            checkMorph = true;
        }

        morphing.complete = function(){
            $('body, html').removeClass('overflow-y begin ' + 'begin-' + c);
            checkMorph = false;
        }

    }

    // Validate email input
    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    } 

    // Set morph height
    function setMorphHeight(){
        var headerContainerHeight = $('header .header-container').outerHeight();

        $('#morphing').css({
            top: headerContainerHeight + 'px',
            height: 'calc(100vh - '+ headerContainerHeight +'px)'
        });   
    }

    // Animate tooltip for shareSelectedText
    function animateTooltip(dir, base, content){
        if ( config_tooltip[dir].base ) {
            anime.remove(base);
            var baseAnimOpts = {targets: base};
            anime(Object.assign(baseAnimOpts, config_tooltip[dir].base));
        }
        if ( config_tooltip[dir].content ) {
            anime.remove(content);
            var contentAnimOpts = {targets: content};
            anime(Object.assign(contentAnimOpts, config_tooltip[dir].content));
        }
    }

    // Initialize stick_in_parent
    function stickIt(){
        $('.content-inner .post-content .social-share').stick_in_parent({
            offset_top: 150
        });
    }

    // Show/Hide menu on scroll
    function hasScrolled() {
        var st = $(this).scrollTop();
        
        if(Math.abs(lastScrollTop - st) <= delta)
            return;

        if(st <= 0 || lastScrollTop <= 0){
            console.log('do this');
            $('body').removeClass('scroll');
        }else if (st > lastScrollTop){
            $('body').addClass('scroll');
        } else {
            if(st + $(window).height() < $(document).height()) {
                $('body').removeClass('scroll');
            }
        }
        
        lastScrollTop = st;
    }

    // Initialize Highlight.js
    $('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });

    // Set the right proportion for images inside the gallery
    function setGalleryRation(){
        $('.kg-gallery-image img').each(function(index, el) {
            var container = $(this).closest('.kg-gallery-image');
            var width = $(this)[0].naturalWidth;
            var height = $(this)[0].naturalHeight;
            var ratio = width / height;
            container.attr('style', 'flex: ' + ratio + ' 1 0%');
        });
    }

});