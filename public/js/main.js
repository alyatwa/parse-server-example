$(document).ready(function () {
    i18next.use(window.i18nextXHRBackend).use(window.i18nextLocalStorageCache).init({
        lng: Cookies.get('language'),
        //debug: true,
        initImmediate: true,
        enabled: true,
        preload: ['en', 'ar'],
        expirationTime: 1000,
        backend: {
            loadPath: '../public/i18n/{{lng}}.json'
        },
        fallbackLng: 'ar',
    }, function (err, t) {

        jqueryI18next.init(i18next, $);
        //$("body").localize();
    });

    i18next.on('initialized', function (options) {
        jqueryI18next.init(i18next, $);
        $("body").localize();
        $('html head').find('title').localize()
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('../public/firebase-messaging-sw.js').then(function (registration) {
                scope: '.'
                // Registration was successful
                //console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, function (err) {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }

    window.addEventListener('appinstalled', (evt) => {
        console.log('a2hs', 'installed');
        ga('send', {
            hitType: 'event',
            eventCategory: 'WebApp',
            eventAction: 'webappinstalled',
            eventLabel: 'Screen Home Installed'
        });
    });
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        console.log('display-mode is standalone');
        ga('send', {
            hitType: 'event',
            eventCategory: 'WebApp',
            eventAction: 'webapp',
            eventLabel: 'Screen Home'
        });
    }


    Parse.$ = jQuery;
    Parse.initialize("myAppId","myclientKey"); // Your App Name
    Parse.serverURL = 'https://moklma.herokuapp.com/parse'; // Your Server URL
  (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    window.fbAsyncInit = function () {
        Parse.FacebookUtils.init({ // this line replaces FB.init({
            appId: '209443563012425', // Facebook App ID
            cookie: true,  // enable cookies to allow Parse to access the session
            xfbml: true,  // initialize Facebook social plugins on the page
            version: 'v2.3' // point to the latest Facebook Graph API version
        });
    }

    const messaging = firebase.messaging();
    messaging.usePublicVapidKey("BJTINaA-v1ZsbgThLpRD075t3MO6NXKKNkuGV5DS-ue1CV_DD9vQtvUuLSUT-r0FXNFAL5j4HGHFeX4ts1jL8zU");

    messaging.getToken().then(function (currentToken) {

        if ((currentToken != Cookies.get('token')) && Parse.User.current()) {
            Cookies.set('token', currentToken);
            console.log('Success token FCM');
            sendTokenToServer(currentToken);
            //updateUIForPushEnabled(currentToken);
        } else {
            // Show permission request.
            //console.log(currentToken, 'No Instance ');
            // Show permission UI.
            //updateUIForPushPermissionRequired();
            //setTokenSentToServer(false);
        }
    }).catch(function (err) {
        console.log('An error occurred while retrieving token. ', err);
        //showToken('Error retrieving Instance ID token. ', err);
        //setTokenSentToServer(false);
    });

    function sendTokenToServer(currentToken) {
        var currentUser = Parse.User.current();
        if (currentUser) {
            currentUser.set('FCM', currentToken);
            currentUser.save(null, {
                success: function (user) {
                    console.log('user token: ' + user);

                }
            });
        }
    }

    messaging.onTokenRefresh(function () {
        messaging.getToken().then(function (refreshedToken) {
            console.log('Token refreshed.');
            Cookies.set('token', refreshedToken);
            sendTokenToServer(refreshedToken);
            // ...
        }).catch(function (err) {
            console.log('Unable to retrieve refreshed token ', err);
            // showToken('Unable to retrieve refreshed token ', err);
        });
    });
    messaging.onMessage(function (payload) {
        console.log('Message received. ', payload);
        // ...
    });
    Handlebars.registerHelper('greaterThan', function (v1, v2, options) {
        'use strict';
        if (v1 > v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    });
    //http://ip-api.com/json
    if (!Cookies.getJSON('user')) {
        $.ajax({
            type: "GET",
            async: false,
            url: "https://json.geoiplookup.io",
            success: function (e) {
                var countryName = e.country_name;
                var countryCode = e.country_code;
                var language;
                if (countryCode == 'EG' || countryCode == 'SA') {
                    language = 'ar';
                } else {
                    language = 'en';
                }
                Cookies.set('language', language, {
                    expires: 365
                });
                Cookies.set('user', {
                    ip: e.ip,
                    country: countryName,
                    countryCode: countryCode,
                    success: true
                }, {
                    expires: 365
                });
            },
            error: function (e) {
                Cookies.set('language', 'ar', {
                    expires: 365
                });
                Cookies.set('user', {
                    success: false
                }, {
                    expires: 365
                });
            }
        });
    } else {
        // console.log('already defiend'); 
    }

    //console.log(Cookies.get('language'));

    var deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        console.log(e);
        
        e.preventDefault();
        deferredPrompt = e;
    });


    var MicApp = new(Backbone.View.extend({
        Models: {},
        Views: {},
        nodes: {},
        fn: {},

        template: Handlebars.compile($('#master-tpl').html()),

        render: function () {
            this.$el.html(this.template());
        },

        start: function () {
            this.render();
            this.$container = $('.test');
            this.$nav = $('#navbar');
            this.$conty = $('.home');
            this.$navhead = $('.nav-head');
            var router = new this.Router;
            router.start();
        }
    }))({
        el: $('.home'),

    });

    MicApp.Views.Welcome = Backbone.View.extend({
        template: Handlebars.compile($('#welcome-tpl').html()),
        initialize: function (params) {
            jqueryI18next.init(i18next, $);
            i18next.init(i18next, $);
            $("body").localize();
        },
        events: {
            'click .copy-link': 'copy',
            'click .app-card': 'install'
        },
        install: function (params) {
            console.log(deferredPrompt);
            if (typeof deferredPrompt == "undefined") {
               return; 
            }
            // Show the prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice
                .then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the A2HS prompt');
                        ga('send', {
                            hitType: 'event',
                            eventCategory: 'WebApp',
                            eventAction: 'acceptwebapp',
                            eventLabel: 'User accepted the A2HS prompt'
                        });
                    } else {
                        ga('send', {
                            hitType: 'event',
                            eventCategory: 'WebApp',
                            eventAction: 'dismisswebapp',
                            eventLabel: 'User dismissed the A2HS prompt'
                        });
                        console.log('User dismissed the A2HS prompt');
                    }
                    deferredPrompt = null;
                });
        },
        copy: function () {
            var username = this.collection.username;
            var link = window.location.protocol+'//'+window.location.hostname + '/' + username;
            var copiedLink = window.location.protocol +'//'+ window.location.hostname + '/' + username;
            navigator.clipboard.writeText(copiedLink).then(function () {
                $('.toast').css({
                    'display': 'block'
                });
                $('.toast').animate({
                    opacity: '1'
                }, "slow", () => {
                    setTimeout(function () {
                        $('.toast').animate({
                            opacity: '0'
                        }, () => {
                            $('.toast').css({
                                'display': 'none'
                            });
                            document.location="/"+username;
                        });
                    }, 500);
                });
            });

        },
        render: function () {
            var collection = {
                webapp: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
                username: this.collection.username,
                url: '/' + this.collection.username,
                urltxt: document.location.host + '/' + this.collection.username,
                msgcount: Parse.User.current().get('new'),
                lang: (Cookies.get('language') == 'en') ? true : false,
                imgurl: this.collection.url
            };
            this.$el.html(this.template(collection));
            return this;
        }
    });

    MicApp.Views.Load = Backbone.View.extend({
        initialize: function () {
            this.template = Handlebars.compile($('#load-tpl').html());
            jqueryI18next.init(i18next, $);
            $(document).localize();
        },
        render: function () {
            this.$el.html(this.template());
            return this;
        }
    });
    // for sending record in page 
    MicApp.Views.User = Backbone.View.extend({
        initialize: function (data) {
            this.template = Handlebars.compile($('#user-tpl').html());
            i18next.init(i18next, $);
            $(document).localize();
        },
        events: {
            'click .main-nav': 'signup'
        },
        signup: function (e) {
            showmodel(e);
        },
        render: function () {
            var collection = {
                userlogin: (Parse.User.current()) ? true : false,
                lang: (Cookies.get('language') == 'en') ? true : false,
                username: this.collection.username,
                imgurl: this.collection.img,
                id: this.collection.id
            };
            $(document).localize();
            this.$el.html(this.template(collection));
            return this;
        }

    });
    // records page
    MicApp.Views.Records = Backbone.View.extend({
        initialize: function (data) {
            this.template = Handlebars.compile($('#records-tpl').html());
            i18next.init(i18next, $);
            $(document).localize();
        },

        events: {
            'click .copy': 'share',
            'click .download': 'download',
            'click .copy-img': 'copy',
            'click .report-spam': 'spam',
            'click .prev-btn': 'prev',
            'click .next-btn': 'next'
        },
        spam: function (e) {
            var id = $(e.currentTarget).attr("data-id");
            $('.loading-' + id).removeClass('display-false');
            Parse.Cloud.run('addSpam', {
                    'receiverID': Parse.User.current().id,
                    'receiver': Parse.User.current().get("username"),
                    'recordId': id
            }).then(function (e) {
                $('.loading-' + id).addClass('display-false');
                console.log('result', e);
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'Spam',
                    eventAction: 'sendspam',
                    eventLabel: 'spam msg'
                });
            });
            
        },
        prev: function (e) {
            if (this.collection.page == 1) {
                return;
            }
            nexte('-');
        },
        next: function (e) {
            if (this.collection.page == $('.records-count').attr('data-maxpage')) {
                console.log('plus disb', this.collection.page);
                return;
            }
            nexte('+');
        },
        copy: function (e) {
            var id = $(e.currentTarget).attr("data-id");
            var link = document.location.origin + '/msg/' + id;
            navigator.clipboard.writeText(link).then(function () {
                console.log('Async: Copying to clipboard was successful!');
            }, function (err) {
                console.error('Async: Could not copy text: ', err);
            });
        },
        download: function (e) {
            var url = $(e.currentTarget).attr("data-url");
            window.open(url, '_blank');
        },
        share: function (e) {
            var ID = $(e.currentTarget).attr("data-id");

            $('.loading-' + ID).removeClass('display-false');
            var record = new Parse.Query(MicApp.Models.Record);
            record.equalTo("objectId", ID).first({
                success: function (record) {

                    var acl = new Parse.ACL(Parse.User.current());
                    console.log(record.getACL().getPublicReadAccess());
                    if (record.getACL().getPublicReadAccess()) {
                        acl.setPublicReadAccess(false);
                        record.setACL(acl);
                        record.save();
                        $('.loading-' + ID).addClass('display-false');
                        $(e.currentTarget).attr("data-public", false);
                        $('.copy-' + ID).text(i18next.t('record.copy'));
                        $('.shared-link-' + ID).removeClass('display-true');
                        $('.shared-link-' + ID).addClass('display-false');
                    } else {
                        acl.setPublicReadAccess(true);
                        record.setACL(acl);
                        record.save();
                        $('.loading-' + ID).addClass('display-false');
                        $(e.currentTarget).attr("data-public", true);
                        $('.copy-' + ID).text(i18next.t('record.private'));
                        $('.shared-link-' + ID).removeClass('display-false');
                        $('.shared-link-' + ID).addClass('display-true');
                    }

                },
                error: function (e) {
                    console.log('share ...', e);

                }
            });
        },
        render: function () {
            var disnext, disprev;
            if (this.collection.page == 1) {
                disprev = "disabled"
            } else {
                disprev = ""
            }
            if (this.collection.page == $('.records-count').attr('data-maxpage')) {
                disnext = "disabled"
                // console.log('set disable btn');
            } else {
                disnext = ""
            }
            var collection = {
                dis: disnext,
                disprev: disprev,
                records: this.collection.content,
                totalrecords: this.collection.totalrecords
            };
            this.$el.html(this.template(collection));
        }
    });
    // Get single record page
    MicApp.Views.Record = Backbone.View.extend({
        initialize: function (data) {
            this.template = Handlebars.compile($('#record-tpl').html());
            i18next.init(i18next, $);
            $(document).localize();
        },
        events: {
            'click .copy-img': 'copy',
            'click .main-nav': 'signup'
        },
        signup: function (e) {
            showmodel(e);
        },
        copy: function (e) {
            var id = this.collection.link;
            navigator.clipboard.writeText(id).then(function () {
                console.log('Async: Copying to clipboard was successful!');
            }, function (err) {
                console.error('Async: Could not copy text: ', err);
            });
        },
        render: function () {
            var collection = {
                userlogin: (Parse.User.current()) ? true : false,
                lang: Cookies.get('language'),
                record: this.collection
            };
            this.$el.html(this.template(collection));
        }
    });
    // TOS
    MicApp.Views.TOS = Backbone.View.extend({
        initialize: function () {
            this.template = Handlebars.compile($('#TOS-tpl').html());
            jqueryI18next.init(i18next, $);
            $(document).localize();
        },
        render: function () {
            this.$el.html(this.template({
                lang: Cookies.get('language')
            }));
            return this;
        }
    });

    MicApp.Views.PP = Backbone.View.extend({
        initialize: function () {
            this.template = Handlebars.compile($('#PP-tpl').html());
            jqueryI18next.init(i18next, $);
            $(document).localize();
        },
        render: function () {
            this.$el.html(this.template({
                lang: Cookies.get('language')
            }));
            return this;
        }
    });

    MicApp.Views.Manage = Backbone.View.extend({
        initialize: function (data) {
            this.template = Handlebars.compile($('#manage-tpl').html());
            i18next.init(i18next, $);
            $(document).localize();
        },

        events: {
            'click .updateinfo': 'updateinfo',
            'click .updatepassword': 'password',
            'click .hide-password': 'showpassword',
            'click .file-input': 'img'
        },
        img: function () {
            var inputs = document.querySelectorAll('.file-input')

            for (var i = 0, len = inputs.length; i < len; i++) {
                customInput(inputs[i])
            }

            function customInput(el) {
                const fileInput = el.querySelector('[type="file"]')
                const label = el.querySelector('[data-js-label]')

                fileInput.onchange = function () {
                    if (!fileInput.value) return
                    var value = fileInput.value.replace(/^.*[\\\/]/, '')
                    el.className += ' -chosen'
                    label.innerText = value.substr(-20);
                    $('.form-message-manage').text(i18next.t('manage.changingphoto'));
                    var parseFile = new Parse.File(Parse.User.current().get('username'), fileInput.files[0]);
                    parseFile.save().then(function (result) {
                        // The file has been saved to Parse.
                        var currentUser = Parse.User.current();
                        currentUser.set('img', parseFile);
                        currentUser.save(null, {
                            success: function (user) {
                                $('.img-profile').css('background-image', 'url(' + parseFile.url() + ')');
                                $('.form-message-manage').text(i18next.t('manage.successphoto'));
                                label.innerText = parseFile.name().substr(-20);
                            },
                            error: function (user, error) {
                                console.log('error code: ' + error.message);
                                $('.form-message-manage').text(error.message);
                                ga('send', 'exception', {
                                    'exDescription': error.message,
                                    'exFatal': false
                                });
                            }
                        })
                    }, function (error) {
                        ga('send', 'exception', {
                            'exDescription': error.message,
                            'exFatal': false
                        });
                        // The file either could not be read, or could not be saved to Parse.
                    });
                }
            }

        },
        showpassword: function () {
            showPassword();
            console.log('show');
        },
        updateinfo: function (e) {
            var username = $('.username-update').val();
            var email = $('.email-update').val();

            if (username == '' || email == '') {
                console.log('fill all fields');
                $('.form-message-manage').text(i18next.t('manage.enterdata'));
                return;
            } else if (!validateEmail(email)) {
                $('.form-message-manage').text(i18next.t('signup.erremail'));
                return;
            } else {
                $('.form-message-manage').text('');
            }
            var currentUser = Parse.User.current();
            currentUser.set('username', username);
            currentUser.set('email', email);

            currentUser.save(null, {
                success: function (user) {
                    console.log('user: ' + user);
                    $('.form-message-manage').text(i18next.t('manage.successsave'));
                },
                error: function (user, error) {
                    if (error.code == 100) {
                        $('.form-message-manage').text('Check your internet connection!');
                    } else if (error.code == 202) {
                        $('.form-message-manage').text(i18next.t('signup.useralready'));
                    } else if (error.code == 203) {
                        $('.form-message-manage').text(i18next.t('signup.emailalready'));
                    } else {
                        console.log('error code: ' + error.code);
                        $('.form-message-manage').text(error.message);
                    }

                    ga('send', 'exception', {
                        'exDescription': error.message,
                        'exFatal': false
                    });
                }
            })
        },
        password: function (e) {
            console.log('save pass');
            var password = $('.password-update').val();
            if (password == '') {
                console.log('fill password field');
                $('.form-message-password').text(i18next.t('manage.enterpassword'));
                return;
            }
            var currentUser = Parse.User.current();
            currentUser.set('password', password);
            currentUser.save(null, {
                success: function (user) {
                    console.log('user: ' + user);
                    $('.form-message-password').text(i18next.t('manage.successpassword'));
                },
                error: function (user, error) {
                    if (error.code == 100) {
                        $('.form-message-password').text('Check your internet connection!');
                    } else {
                        console.log('error code: ' + error.code);
                        $('.form-message-password').text(error.message);
                    }

                    ga('send', 'exception', {
                        'exDescription': error.message,
                        'exFatal': false
                    });
                }
            })
        },
        render: function () {
            var img, imgurl;
            if (Parse.User.current().get('img')) {
                img = Parse.User.current().get('img').name().substr(-20)
                imgurl = Parse.User.current().get('img').url();
            } else {
                img = "..."
                imgurl = "../public/imgs/user.svg"
            }
            var data = {
                username: Parse.User.current().get('username'),
                email: Parse.User.current().get('email'),
                img: img,
                imgurl: imgurl
            };
            this.$el.html(this.template(data));
            return this;
        }
    });

    MicApp.Views.Homenav = Backbone.View.extend({
        initialize: function (data) {
            this.template = Handlebars.compile($(this.collection.selectednav).html())
            i18next.init(i18next, $);
            $("body").localize();
        },
        events: {
            'click .main-nav': 'showLogin',
            'click .navbar-nav>a': 'collapse',
            'click #main': 'collapse',
            'click .btn-fb': 'loginfb',
            'click .manage-btn': 'manage',
        },
        manage: function () {
             console.log('manage');
        
        //MicApp.Router.navigate("/manage", true)
        },
        loginfb: function () {
            logIn()
        },
        collapse: function () {
            $('.navbar-collapse').collapse('hide');
        },
        showLogin: function (e) {
            console.log('login event');
            showmodel(e);
        },
        render: function () {
            var collection = {
                badge: this.collection.badge
            };
            this.$el.html(this.template(collection));
            return this;
        }
    });

    MicApp.fn.renderView = function (options) {
        var View = options.View, // type of View
            data = options.data || null, // data obj to render in the view
            $container = options.$container || MicApp.$container, // container to put the view
            notInsert = options.notInsert, // put the el in the container or return el as HTML
            view = new View(data);

        view.render();
        if (notInsert) {
            return view.el.outerHTML;
        } else {
            $container.html(view.el);
        }
    };

    Backbone.history.on("route", function () {
        $('.navbar-collapse').collapse('hide');
        $("body").localize();
    });

    // Check login 
    MicApp.fn.checkLogin = function (data) {
        var currentUser = Parse.User.current();

        if (!currentUser) {
            if (data === 'notRequired') {
                MicApp.fn.renderView({
                    View: MicApp.Views.Homenav,
                    data: {
                        collection: {
                            selectednav: '#nav-head-tpl',
                            badge: 0
                        }
                    },
                    $container: MicApp.$navhead
                });
                return;
            }
            Backbone.history.navigate('/', {
                trigger: false

            });
            MicApp.fn.renderView({
                View: MicApp.Views.Homenav,
                data: {
                    collection: {
                        selectednav: '#home-tpl',
                        badge: 0
                    }
                },
                $container: MicApp.$conty
            });
            MicApp.fn.renderView({
                View: MicApp.Views.Homenav,
                data: {
                    collection: {
                        selectednav: '#nav-head-tpl',
                        badge: 0
                    }
                },
                $container: MicApp.$navhead
            });
            return false;
        } else {

            //console.log('user is logedin ......');
            Parse.User.current().fetch();
            MicApp.fn.renderView({
                View: MicApp.Views.Homenav,
                data: {
                    collection: {
                        selectednav: '#nav-new-tpl',
                        badge: ((currentUser.get('new') > 0) ? currentUser.get('new') : null)
                    }
                },
                $container: MicApp.$navhead
            });

            return true;
        }
        //Backbone.history.navigate('#/login', { trigger: false });

    };

    // Set page type - control the .active class in nav; control if check login
    MicApp.fn.setPageType = function (type) {
        if (type === "home" && MicApp.fn.checkLogin()) {
            //console.log('setPageType HOME');
            Backbone.history.navigate('/', {
                trigger: false
            });
            var img;
            if (Parse.User.current().get('img')) {
                img = Parse.User.current().get('img')._url
            } else {
                img = '../public/imgs/user.svg'
            }
            MicApp.fn.renderView({
                View: MicApp.Views.Welcome,
                data: {
                    collection: {
                        username: Parse.User.current().get('username'),
                        url: img
                    }
                },
                $container: MicApp.$conty
            });
            messaging.requestPermission().then(function () {}).catch(function (err) {
                console.log('Unable to get permission to notify.', err);
            });
        } else if (type === "user") {
            //MicApp.fn.checkLogin('notRequired');
            console.log('setPageType SEND');
        } else if (type === "record") {
            console.log('setPageType RECORD');
        } else if (type === "records" && MicApp.fn.checkLogin()) {
            console.log('setPageType RECORDS');
        } else if (type === "manage" && MicApp.fn.checkLogin()) {
            console.log('setPageType MANAGE');
        } else if (type === "del" && MicApp.fn.checkLogin()) {
            console.log('setPageType DEL');

        }
    };

    var originalNavigate = Backbone.history.navigate;
    Backbone.history.navigate = function (fragment, options) {
        originalNavigate.apply(this, arguments);
        $('.navbar-collapse').collapse('hide');
        $("body").localize();
    }

    $(document).on("click", "a[href]:not([data-bypass])", function (evt) {
        // Get the absolute anchor href.
        var href = {
            prop: $(this).prop("href"),
            attr: $(this).attr("href")
        };
        var location = window.location;
        // Get the absolute root.
        var root = location.protocol + "//" + location.host + '/';

        // Ensure the root is part of the anchor href, meaning it's relative.
        if (href.prop.slice(0, root.length) === root) {
            // Stop the default event to ensure the link will not cause a page
            // refresh.
            evt.preventDefault();

            // `Backbone.history.navigate` is sufficient for all Routers and will
            // trigger the correct events. The Router's internal `navigate` method
            // calls this anyways.  The fragment is sliced from the root.
            Backbone.history.navigate(href.attr, true);
            
        }
    });

    var enablePushState = true;
    var pushState = !!(enablePushState && window.history && window.history.pushState);
    if (!pushState && window.location.pathname != "/") {
        window.location.replace("/#" + window.location.pathname)
    }
    
    // Router
    MicApp.Router = Backbone.Router.extend({

        initialize: function (options) {
            jqueryI18next.init(i18next, $);
            $(document).localize();
            MicApp.query = {
                records: new Parse.Query(MicApp.Models.Record).descending('createdAt'),
            };
        },

        start: function () {
            Backbone.history.start({
                root: '/',
                pushState: true
            });
        },

        routes: {
            '': 'index',
            'user/:user': 'user',
            'msg/:url': 'record',
            'records': 'records',
            'manage': 'manage',
            'logout': 'logout',
            'del/:del': 'del',
            'TOS': 'TOS',
            'PP': 'PP',
            ':user': 'user'
        },

        index: function () {
            (typeof mediaRecorder !== "undefined") && mediaRecorder.getTracks()[0].stop()
            MicApp.fn.setPageType('home');
            i18next.on('initialized', function (options) {
                $('html head').find('title').text(i18next.t('head.title'));
                setHeadTags('home');
            });
            ga('send', 'pageview', {
                'page': '/',
                'title': 'Home'
            });
        },

        record: function (url) {
            (typeof mediaRecorder !== "undefined") && mediaRecorder.getTracks()[0].stop()
            MicApp.fn.renderView({
                View: MicApp.Views.Load,
                $container: MicApp.$conty
            });

            MicApp.fn.checkLogin('notRequired');
            var record = new Parse.Query(MicApp.Models.Record);
            record.equalTo("objectId", url).first().then(function (record) {
                //console.log('single record', record);
                if (!record) {
                    MicApp.fn.setPageType('home');
                    return;
                }
                var siteName = i18next.t('head.sitename');
                $('html head').find('title').text(record.get('receiver')+' | '+siteName);

                var receiver = record.get('receiver');
                var img;
                var query = new Parse.Query('PublicUser');
                query.equalTo("username", receiver); // find users that match
                query.first({
                    success: function (e) {
                        setHeadTags('record', null ,{
                            username: e.get('username'),
                            img: e.get('img'),
                            recordId: url
                        });
                        if (e) {
                            if (e.get('img')) {
                                img = e.get('img')._url
                            } else {
                                img = '../public/imgs/user.svg'
                            }
                        }
                        var date = new Date(record.get('createdAt'));
                        var format = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                        var data = {
                            url: record.get('file').url(),
                            date: format,
                            link: document.location.origin + '/msg/' + record.id,
                            profile: document.location.origin + '/' + receiver,
                            id: record.id,
                            username: receiver,
                            imgurl: img
                        };
                        MicApp.fn.renderView({
                            View: MicApp.Views.Record,
                            data: {
                                collection: data
                            },
                            $container: MicApp.$conty
                        });
                        $('audio').mediaelementplayer();
                    }
                });


            });
            ga('send', 'pageview', {
                'page': '/#/record',
                'title': 'Record'
            });
        },

        user: function (user) {
            i18next.on('initialized', function (options) {
                var siteName = i18next.t('head.sitename');
                $('html head').find('title').text(user+' | '+siteName);
            });
            MicApp.fn.renderView({
                View: MicApp.Views.Load,
                $container: MicApp.$conty
            });   
            MicApp.fn.checkLogin('notRequired');
            var query = new Parse.Query('PublicUser');
            query.equalTo("username", user); // find users that match
            query.first({
                success: function (e) {
                    //getMicPermission();
                    if (e) {
                        var img;
                        if (e.get('img')) {
                            img = e.get('img')._url
                        } else {
                            img = '../public/imgs/user.svg'
                        }
                        var data = {
                            username: e.get('username'),
                            img: img,
                            id: e.get('userId')
                        }
                        console.log(data);
                        setHeadTags('user', {
                            username: e.get('username'),
                            img: e.get('img')._url
                        });
                        console.log(e.get('img')._url,e.get('username'));
                        MicApp.fn.renderView({
                            View: MicApp.Views.User,
                            data: {
                                collection: data
                            },
                            $container: MicApp.$conty
                        });
                        
                        startRecord();
                    } else {
                        console.log('No user found');
                        MicApp.fn.setPageType('home');
                        return;
                    }
                }
            });
            ga('send', 'pageview', {
                'page': '/#/user',
                'title': 'User'
            });
        },

        records: function () {
            (typeof mediaRecorder !== "undefined") && mediaRecorder.getTracks()[0].stop()
            if (!MicApp.fn.checkLogin()) {
                return;
            }
            ga('send', 'pageview', {
                'page': '/records',
                'title': 'Records'
            });
            i18next.on('initialized', function (options) {
                var siteName = i18next.t('head.sitename');
                $('html head').find('title').text(i18next.t('record.title') +' | '+siteName);
            });
            MicApp.fn.renderView({
                View: MicApp.Views.Load,
                $container: MicApp.$conty
            });

            var query = new Parse.Query(MicApp.Models.Record);
            query.equalTo('receiver', Parse.User.current().get('username'));
            query.count().then(function (e) {
                // console.log('records fetched', e);
                $('.records-count').attr('data-count', e);
                $('.records-count').attr('data-currentpage', 1);
                $('.records-count').attr('data-maxpage', Math.ceil(e / 5));
                // console.log('maxpages', Math.ceil(e / 5));
                page(1, e);
            });
        },

        manage: function () {
            (typeof mediaRecorder !== "undefined") && mediaRecorder.getTracks()[0].stop()
            if (!MicApp.fn.checkLogin()) {
                return;
            }
            i18next.on('initialized', function (options) {
                var siteName = i18next.t('head.sitename');
                $('html head').find('title').text(i18next.t('manage.manage')+' | '+siteName);
            });
            MicApp.fn.renderView({
                View: MicApp.Views.Manage,
                $container: MicApp.$conty,
                notInsert: false
            });
            ga('send', 'pageview', {
                'page': '/#/manage',
                'title': 'Manage'
            });
        },

        del: function (id) {
            (typeof mediaRecorder !== "undefined") && mediaRecorder.getTracks()[0].stop()
            if (!MicApp.fn.checkLogin()) {
                return;
            }
            /*MicApp.fn.renderView({
                View: MicApp.Views.Records
            });*/
            var record = new Parse.Query(MicApp.Models.Record);
            record.equalTo("objectId", id).first().then(function (record) {
                record.destroy()
                    .then(function (data) {
                        Backbone.history.navigate('/records', {
                            trigger: true
                        });
                        //window.location.reload();
                    });
            });
        },

        logout: function () {
            Parse.User.logOut().then(
                (success) => {
                    $("body").localize();
                    MicApp.fn.checkLogin();
                    ga('send', {
                        hitType: 'event',
                        eventCategory: 'Logout',
                        eventAction: 'logout',
                        eventLabel: 'logout'
                    });
                },
                (error) => {
                    window.location.reload();
                    console.log(error, 'error logging out.');
                    ga('send', 'exception', {
                        'exDescription': 'error logging out',
                        'exFatal': false
                    });
                });
        },

        TOS: function () {
            (typeof mediaRecorder !== "undefined") && mediaRecorder.getTracks()[0].stop()
            MicApp.fn.checkLogin('notRequired');
            MicApp.fn.renderView({
                View: MicApp.Views.Load,
                $container: MicApp.$conty
            });
            i18next.on('initialized', function (options) {
                $('html head').find('title').text(i18next.t('footer.tos'));
                setHeadTags('footer');
            });
            MicApp.fn.renderView({
                View: MicApp.Views.TOS,
                $container: MicApp.$conty
            });
            ga('send', 'pageview', {
                'page': '/#/TOS',
                'title': 'Terms of Use'
            });

        },

        PP: function () {
            (typeof mediaRecorder !== "undefined") && mediaRecorder.getTracks()[0].stop()
            i18next.on('initialized', function (options) {
                $('html head').find('title').text(i18next.t('footer.pp'));
                setHeadTags('footer');
            });
            MicApp.fn.renderView({
                View: MicApp.Views.PP,
                $container: MicApp.$conty
            });
            ga('send', 'pageview', {
                'page': '/#/PP',
                'title': 'Privacy Policy'
            });
            MicApp.fn.checkLogin('notRequired');
        },


    });

    MicApp.Models.Record = Parse.Object.extend('Records', {

        update: function (form) {
            this.set({

                'file': form.file,
                'receiverID': form.id,
                'receiver': form.receiver,
            }).save(null, {
                success: function (Record) {
                    window.location.reload();
                    // reload after 1 sec

                    $('.loading-text').text(i18next.t('user.sent'));
                    $('.loading-dark').css({
                        'display': 'none'
                    });
                    ga('send', {
                        hitType: 'event',
                        eventCategory: 'SendRecord',
                        eventAction: 'send',
                        eventLabel: 'success send'
                    });
                    setTimeout(function () {
                        // window.location.reload();
                    }, 500);
                },
                error: function (Record, error) {
                    console.log(error);
                    ga('send', 'exception', {
                        'exDescription': error,
                        'exFatal': false
                    });
                }
            });
        },


    });


    function setHeadTags(router, user, record) {
        var siteName = i18next.t('head.sitename');
        var siteURL = 'https://moklma.herokuapp.com';
        var description = i18next.t('head.description');
        var image = siteURL + '/public/imgs/fb-sharecard.png';
        var lang = Cookies.get('language');
        var locale = ((lang == 'ar') ? 'ar_AR' : 'en_US')
        
        $("meta[property='og:site_name']").attr('content', siteName)
        $("meta[name='description']").attr('content', description);
        $("meta[property='og:description']").attr('content', description);
        $("meta[name='twitter:description']").attr('content', description);
        $("meta[itemprop='description']").attr('content', description);
        $("meta[property='og:locale']").attr('content', locale)
        
        if (router == 'home' || router == 'footer') {
            $("meta[property='og:url']").attr('content', siteURL)
            $("meta[property='og:title']").attr('content', siteName)
            $("meta[property='og:locale']").attr('content', locale)
            $("meta[name='twitter:title']").attr('content', siteName)
            $("meta[itemprop='name']").attr('content', siteName)

            $("meta[itemprop='image']").attr('content', image)
            $("meta[name='twitter:image']").attr('content', image)
            $("meta[property='og:image']").attr('content', image)
        } else if (router == 'user') {
            let pageTitle = user.username + ' | ' + siteName;
            let userImage = ((user.img) ? user.img._url : image)
            $("meta[property='og:url']").attr('content', siteURL+'/#/' + user.username)
            $("meta[property='og:title']").attr('content', pageTitle)
            $("meta[name='twitter:title']").attr('content', pageTitle)
            $("meta[itemprop='name']").attr('content', pageTitle)

            $("meta[itemprop='image']").attr('content', userImage)
            $("meta[name='twitter:image']").attr('content', userImage)
            $("meta[property='og:image']").attr('content', userImage)
        } else if (router == 'record') {
            let pageTitle = record.username + ' | ' + siteName;
            let userImage = ((record.img) ? record.img._url : image)
            let recordURL = 'https://moklma.herokuapp.com.com/#/record/' + record.recordId
            $("meta[property='og:url']").attr('content', recordURL)
            $("meta[property='og:title']").attr('content', pageTitle)
            $("meta[name='twitter:title']").attr('content', pageTitle)
            $("meta[itemprop='name']").attr('content', pageTitle)

            $("meta[itemprop='image']").attr('content', userImage)
            $("meta[name='twitter:image']").attr('content', userImage)
            $("meta[property='og:image']").attr('content', userImage)
        }

    }

    var $form_modal = $('.user-modal'),
        $form_login = $form_modal.find('#login'),
        $form_signup = $form_modal.find('#signup'),
        $form_forgot_password = $form_modal.find('#reset-password'),
        $form_modal_tab = $('.switcher'),
        $tab_login = $form_modal_tab.children('li').eq(0).children('a'),
        $tab_signup = $form_modal_tab.children('li').eq(1).children('a'),
        $forgot_password_link = $form_login.find('.form-bottom-message a'),
        $back_to_login_link = $form_forgot_password.find('.form-bottom-message a'),
        $main_nav = $('.main-nav');

    var audio_context,
        bloby,
        sound,
        recorder;

    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        window.URL = window.URL || window.webkitURL || window.mozURL;

        //audio_context = new AudioContext();
    } catch (e) {
        console.warn('No web audio support in this browser!');
        ga('send', 'exception', {
            'exDescription': 'No web audio support in this browser!',
            'exFatal': false
        });
    }
    var constraints = window.constraints = {
        /*audio: {
            deviceId: {
                exact: "ee08386cbd8f7464fe5e86867992c6ad37cef66790070e7ed17f622f28222346"
            },
            audio: true
        },*/
        audio: true,
        video: false
    };
    function getMicPermission() {
    //audio_context = new AudioContext();
    navigator.getUserMedia(constraints, startUserMedia, function (e) {
        console.warn('No live audio input: ' + e);
        ga('send', 'exception', {
            'exDescription': 'No live audio input',
            'exFatal': false
        });
    });
           }

    navigator.mediaDevices.enumerateDevices().then(function (devices) {
        devices.forEach(function (device) {
            //console.log("label: " + device.label + " id = " + device.deviceId);
        });
    });

    function startUserMedia(stream) {
        audio_context = new AudioContext();
        console.log('Using audio mic: ' + stream.getAudioTracks()[0].label);
        var input = audio_context.createMediaStreamSource(stream);
        mediaRecorder = stream;
        recorder = new Recorder(input);
        recorder.record();
        console.log('Recorder initialised   + audioCTX  ',audio_context);
    }
        //Timer
    var CountDown = function () {
    // Length ms 
    var TimeOut = 10000;
    // Interval ms
    var TimeGap = 1000;
    var Stopp = false;
    var CurrentTime = ( new Date() ).getTime();
    var EndTime = ( new Date() ).getTime() + TimeOut;
        var txtTimer = '';
    
    var Running = true;
    
    var UpdateTimer = function() {
        if (Stopp) {
            
            $('.record-btn').css({'background-image': 'unset'});
        return;
        }
        // Run till timeout
        if( CurrentTime + TimeGap < EndTime ) {
            setTimeout( UpdateTimer, TimeGap );
        }
        // Countdown if running
        if( Running ) {
            CurrentTime += TimeGap;
            if( CurrentTime >= EndTime ) {
               // GuiTimer.css('color','red');
               stopRecord();
            }
        }
        // Update Gui
        var Time = new Date();
        Time.setTime( EndTime - CurrentTime );
        var Minutes = Time.getMinutes();
        var Seconds = Time.getSeconds();
        txtTimer = ' '+(Minutes < 10 ? '0' : '') + Minutes + ':' + (Seconds < 10 ? '0' : '') + Seconds;
        console.log("txtTimer: ", txtTimer);
        var curr = Time.getSeconds()+(Time.getMinutes()*60);
        var total = TimeOut/1000;
        var per = Math.floor((curr/total)*100);
        $('.record-btn').css({'background-image': 'linear-gradient(180deg, rgba(255,255,255,1) '+per+'%, rgba(255,0,0,1) 0%)'})
        
          };
    
    var Pause = function() {
        Running = false;
        /*GuiPause.hide();
        GuiResume.show();*/
    };
    
    var Resume = function() {
        Running = true;
    };
    
    var Stop = function() {
        Running = false;
        Stopp = true;
        //UpdateTimer = undefined;
        //$('.record-btn').css({'background-image': 'unset'});
    };
    
    var Start = function( Timeout ) {
        TimeOut = Timeout;
        CurrentTime = ( new Date() ).getTime();
        EndTime = ( new Date() ).getTime() + TimeOut;
        UpdateTimer();
    };

    return {
        Pause: Pause,
        Resume: Resume,
        Stop: Stop,
        txtTimer:txtTimer,
        Start: Start
    };
}
    
        
    var timer;// = new CountDown();
    
    function stopRecord() {
            $('.record-btn').css({'background-image': 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,0,0,1) 0%)'})
     }
    function startRecord() {
        var $level = $("input.level").slider({
                value: 50,
                min: -100,
                max: 100
            }),
            $slider = $('.slider'),
            $box = $(".record-box"),
            $loading = $(".loading"),
            $loadingtext = $(".loading-text"),
            $recordbtn = $('button.record-btn'),
            $removebtn = $('.remove'),
            $sendbtn = $('.send'),
            $recordbtntext = $('small.record-btn-text');

        $slider.addClass("col-10");
        
        //Clear Record & Close AudioContext
        $removebtn.on('click', function (e) {
            console.log('Remove record Btn');
            //timer = undefined;
            timer.Stop();
            //$('.record-btn').css({'background-image': 'unset'})
            $recordbtn.css({'background-color':'#000'});
            $recordbtntext.text(i18next.t('user.start'));
            $recordbtntext.addClass("text-sub");
            audio_context.close().then(function(s) {
            console.log('Context Removed', s);
                });
            $('audio').attr("src", "/public/assets/sample.mp3");
            $('.mejs__time-current').css({'transform': 'scaleX(0)'});
            $('.mejs__duration').text('00:00');
            sound = document.querySelector("audio");
            sound.pause();
            sound.currentTime = 0;
            $box.css({
                'pointer-events': 'none',
                'opacity': .7
            });
            recorder.clear();
            
            /*navigator.getUserMedia(constraints, startUserMedia, function (e) {
                console.warn('No live audio input: ' + e);
            });*/
        });

        

        
        $recordbtn.on('click', function (e) {
            if (!audio_context || audio_context.state === "closed"){
                console.log('audioContext Closed');
                timer = new CountDown();
                timer.Start(1000*60);
                getMicPermission();}
            else {
                console.log('else',audio_context);
                }
            
            if ($recordbtn.attr('data-recording') == 'false') {
                // Start Recording .....
                $box.css({
                    'pointer-events': 'none',
                    'opacity': .7
                });
                if (audio_context) {
                  if (audio_context.state != "closed") {ctxx(audio_context,"start");} 
                }
               // $('.record-btn').css({'background-image': ''})
                $recordbtn.css({'background-color':'#000'});
                $recordbtn.attr('data-recording', true);
                $recordbtn.addClass("recording");
                $recordbtntext.addClass("record-btn-text");
                $recordbtntext.removeClass("text-sub");
                $recordbtntext.text(i18next.t('user.pause') + timer.txtTimer);
                recorder && recorder.record();
                sound.pause();
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'Recording',
                    eventAction: 'record',
                    eventLabel: 'record start'
                });
            } else {
                // Paused
                ctxx(audio_context,"pause");
                $box.css({
                    'pointer-events': 'unset',
                    'opacity': 1
                });
                $recordbtn.attr('data-recording', false);
                $recordbtn.addClass("btn-paused");
                $recordbtn.removeClass("recording");
                $recordbtn.css({'background-color':'unset'});
                //$recordbtntext.removeClass("record-btn-text");
                $recordbtntext.removeClass("text-sub");
                $recordbtntext.text(i18next.t('user.continue')+timer.txtTimer);
                recorder && recorder.stop();
                recorder && recorder.exportAudio(function (blob) {
                    var url = URL.createObjectURL(blob);
                    //console.log('original ....',url);
                    bloby = url;
                    blobobj = blob;
                    $('audio').attr("src", url);
                    sound.play();

                });
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'Recording',
                    eventAction: 'record',
                    eventLabel: 'record stop'
                });
            }
        });
        function ctxx(audioCtx,state) {
  if(state === 'pause') {
      timer.Pause()
    audioCtx.suspend().then(function() {
      console.log('paused context');
    });
  } else if(state === 'start') {
      timer.Resume();
    audioCtx.resume().then(function() {
      console.log('resumed context');
    });  
  }
}
        $sendbtn.on('click', function (e) {
            console.log('send');
            sound.pause();
            $box.css({
                'pointer-events': 'none',
                'opacity': .7
            });
            $recordbtn.css({
                'pointer-events': 'none',
                'opacity': .7
            });
            $loading.css({
                'display': 'block',
            });
            mediaRecorder.getTracks()[0].stop();
            (async () => {
                $loadingtext.text(i18next.t('user.processing'));
                await stsend(bloby);
                await recorderx && recorderx.stop();
                await recorderx && recorderx.exportAudio(function (blob) {
                    var url = URL.createObjectURL(blob);
                    console.log('DONE...', url);
                    $loadingtext.text(i18next.t('user.sending'));
                    sendBlob(blob);
                });
            })();
        });
        $('audio').mediaelementplayer({
            success: function (media, node, instance) {
                sound = document.querySelector("audio");
                media.addEventListener('progress', function (e) {
                    //console.log('progress: ', e);
                });

                media.addEventListener('play', function (e) {
                    //console.log('play', e);
                    stplay(bloby);
                }, false);
                media.addEventListener('pause', function (e) {
                    //console.log('pause', e);
                    stpause();
                }, false);
            }
        });

        $level.on("slide", function (slideEvt) {
            levelslider(slideEvt.value);
        });
        $level.on("change", function (slideEvt) {
            console.log('change slide  ', (slideEvt.value.newValue / 100));
            levelslider(slideEvt.value.newValue);
        });

    }

    function sendBlob(blob) {

        var receiver = $('.user-box').attr('data-username');
        var id = $('.user-box').attr('data-id');
        console.log('blob: ', blob);
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
            var base64data = reader.result;
            var base64 = base64data.split('base64,')[1];
            var parseFile = new Parse.File(receiver +'.mp3', {
                base64: base64
            });
            parseFile.save().then(function (result) {
                console.log('success: ', result._url);
                this.record = new MicApp.Models.Record();
                this.record.update({
                    receiver: receiver,
                    id: id,
                    file: parseFile
                });
            }, function (error) {
                // The file either could not be read, or could not be saved to Parse.
                console.log(error);
            });
        }
    }

    var coun = 1;

    function nexte(pm) {
        if (pm == '+') {
            coun += 1;
        } else {
            coun -= 1;
        }
        console.log('click:::', coun);
        var totalrecords = $('.records-count').attr('data-count');
        $('.records-count').attr('data-currentpage', coun);
        page(coun, totalrecords);
    }

    function page(page, totalrecords) {
        var user = Parse.User.current()
        var query = new Parse.Query(MicApp.Models.Record);
        var displayLimit = 5;
        MicApp.fn.renderView({
            View: MicApp.Views.Load,
            $container: MicApp.$conty
        });
        query.equalTo('receiver', user.get('username'))
            .descending('createdAt')
            .limit(displayLimit)
            .skip((page - 1) * displayLimit)
            .find()
            .then(function (records) {

                user.set('new', 0);
                user.save(null, (e) => {

                    $('.badge-data').css({
                        'display': 'none'
                    });
                    user.fetch()
                }, (e) => {

                });
                var data = [];
                for (var i = 0; i < records.length; i++) {
                    var date = new Date(records[i].get('createdAt'));
                    var format = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    var private;
                    var link = document.location.origin + '/msg/' + records[i].id;

                    if (records[i].getACL().getPublicReadAccess()) {
                        private = 'private'
                    } else {
                        private = 'copy'
                    }
                    var record = {
                        id: records[i].id,
                        private: private,
                        public: records[i].getACL().getPublicReadAccess(),
                        link: link,
                        url: records[i].get('file').url(),
                        date: format
                    }
                    data.push(record);
                }
                MicApp.fn.renderView({
                    View: MicApp.Views.Records,
                    data: {
                        collection: {
                            content: data,
                            page: page,
                            totalrecords: totalrecords
                        }
                    },
                    $container: MicApp.$conty,
                    notInsert: false
                });

                $('audio').mediaelementplayer();
            });
    }


    if (Parse.User.current()) {
        var Message = Parse.Object.extend('_User');
        var query = new Parse.Query(Message);
        query.equalTo('username', Parse.User.current().get('username'));
        var subscription = query.subscribe();

        subscription.on('open', function (e) {
            // Parse.User.current().fetch();
            //console.log(Parse.User.current().get('new'))
        });
        subscription.on('create', function (obj) {
            console.log('create', obj.attributes); // not working
        });
        subscription.on('update', function (obj) {
            Parse.User.current().fetch();
            console.log('update', obj.attributes); //and here not working
            var ele = $('.badge-data');
            var newmsgs = obj.get('new');
            $('.newmsgs').text(newmsgs);
            if (newmsgs == 0) {
                ele.css({
                    'display': 'none'
                });
            } else {
                ele.css({
                    'display': 'inline-block'
                });
                ele.text(newmsgs);
            }
            // document.getElementById("json").innerHTML = JSON.stringify(obj.attributes, undefined, 2);
        });
    }




    $('body').on('click', function (event) {
        $('.navbar-collapse').collapse('hide');
    });

    //open modal
    $main_nav.on('click', function (event) {
        showmodel(event);
    });

    function showmodel(event) {
        if ($(event.target).is($main_nav)) {
            // on mobile open the submenu
            $(this).children('ul').toggleClass('is-visible');
        } else {
            // on mobile close submenu
            $main_nav.children('ul').removeClass('is-visible');
            $main_nav.addClass('hidetemp');
            //show modal layer
            $form_modal.addClass('is-visible');
            //show the selected form
            //console.log('card else', $(event.target).hasClass('signup-card'));
            
            ($(event.target).is('.signup') || $(event.target).is('.signup-card')) ? signup_selected(): login_selected();
        }
    }
    //close modal
    $('.user-modal').on('click', function (event) {
        if ($(event.target).is($form_modal) || $(event.target).is('.close-form')) {
            user_success();
        }
    });

    function user_success() {
        $form_modal.removeClass('is-visible');
        $main_nav.removeClass('hidetemp');
    }
    //close modal when clicking the esc keyboard button
    $(document).keyup(function (event) {
        if (event.which == '27') {
            $form_modal.removeClass('is-visible');
        }
    });

    //switch from a tab to another
    $form_modal_tab.on('click', function (event) {
        event.preventDefault();
        ($(event.target).is($tab_login)) ? login_selected(): signup_selected();
    });

    //hide or show password
    $('.hide-password').on('click', function () {
        showPassword();
    });

    function showPassword() {
        var $this = $('.hide-password'),
            $password_field = $this.prev('input');

        ('password' == $password_field.attr('type')) ? $password_field.attr('type', 'text'): $password_field.attr('type', 'password');
        if ('show' == $this.attr('data-shid')) {
            $this.text(i18next.t('manage.hide'))
            $this.attr('data-shid', 'hide');
        } else {
            $this.text(i18next.t('manage.show'));
            $this.attr('data-shid', 'show');
        }
        //focus and move cursor to the end of input field
        $password_field.putCursorAtEnd();
    }

    //show forgot-password form 
    $forgot_password_link.on('click', function (event) {
        event.preventDefault();
        forgot_password_selected();
    });

    //back to login from the forgot-password form
    $back_to_login_link.on('click', function (event) {
        event.preventDefault();
        login_selected();
    });

    function login_selected() {
        $form_login.addClass('is-selected');
        $form_signup.removeClass('is-selected');
        $form_forgot_password.removeClass('is-selected');
        $tab_login.addClass('selected');
        $tab_signup.removeClass('selected');
    }

    function signup_selected() {
        $form_login.removeClass('is-selected');
        $form_signup.addClass('is-selected');
        $form_forgot_password.removeClass('is-selected');
        $tab_login.removeClass('selected');
        $tab_signup.addClass('selected');
    }

    function forgot_password_selected() {
        $form_login.removeClass('is-selected');
        $form_signup.removeClass('is-selected');
        $form_forgot_password.addClass('is-selected');
    }

    //REMOVE THIS - it's just to show error messages 
    $form_login.find('input[type="submit"]').on('click', function (event) {
        //event.preventDefault();
        //$form_login.find('input[type="email"]').toggleClass('has-error').next('span').toggleClass('is-visible');
    });
    $form_signup.find('input[type="submit"]').on('click', function (event) {
        //event.preventDefault();
        //$form_signup.find('input[type="email"]').toggleClass('has-error').next('span').toggleClass('is-visible');
    });

    function loadingdisplay(e,status) {
        var target = $('.'+e)
        if (status) {
        target.removeClass('display-false')
        target.addClass('display-true')
        }
        else {
        target.removeClass('display-true')
        target.addClass('display-false')
        }
    }

    // Login User
    $form_login.find('input[type="submit"]').on('click', function (e) {

        // Prevent Default Submit Event
        e.preventDefault();
        
        // Get data from the form and put them into variables
        var username = $('#signin-email').val();
        var password = $('#signin-password').val();

        if (username == '' || password == '' || username == 'anonymous') {
            $('.form-message-login').text(i18next.t('login.enterdata'));
            return;
        } else {
            $('.form-message-login').text('');
        }
        loadingdisplay('loading-login', true)
        // Call Parse Login function with those variables
        Parse.User.logIn(username, password, {
            // If the username and password matches
            success: function (user) {
                loadingdisplay('loading-login', false)
                //console.log('Welcome!>', user);
                $('.form-message-login').text('');
                window.location.reload();
                user_success();
                
                //MicApp.fn.setPageType('home');
            },
            // If there is an error
            error: function (user, error) {
                loadingdisplay('loading-login', false)
                console.log(error);
                if (error.code == 201) {
                    $('.form-message-login').text(i18next.t('login.enterpassword'));
                } else if (error.code == 200) {
                    $('.form-message-login').text(i18next.t('login.enterusername'));
                } else if (error.code == 101) {
                    $('.form-message-login').text(i18next.t('login.erruserorpass'));
                } else if (error.code == 100) {
                    $('.form-message-login').text('Check your internet connection!');
                }
                ga('send', 'exception', {
                    'exDescription': error.message,
                    'exFatal': false
                });
            }
        });

    });
    var ip, country;
    if (Cookies.getJSON('user').success) {
        ip = Cookies.getJSON('user').ip;
        country = Cookies.getJSON('user').country;
    } else {
        ip = '0.0.0.0';
        country = null;
    }
    // fb login
    function logIn() {
        Parse.FacebookUtils.logIn("public_profile,email", {
            success: function (user) {
                if (!user.existed()) {
                    FB.api('/me?fields=id,name,email, picture.type(large),permissions', function (response) {
                        user.set('username', response.name.replace(/\s/g, ''));
                        user.set('email', response.email);
                        user.set("ip", ip);
                        user.set("country", country);
                        user.save(null, {
                            success: function (user) {
                                console.log(response, user)
                                $('.form-message-login').text('');
                                window.location.reload();
                                user_success();
                                window.location.reload();
                            },
                            error: function (user, error) {
                                console.log('Failed to save user to database with error: ' + error.message);
                            }
                        });
                    });
                } else {
                    window.location.reload();
                    console.log("User logged in through Facebook!");
                    
                }
            },
            error: function (user, error) {
                console.log("User cancelled the Facebook login or did not fully authorize.");
            }
        });
    }
    

    // SignUp User
    $form_signup.find('input[type="submit"]').on('click', function (e) {

        // Prevent Default Submit Event
        e.preventDefault();

        // Get data from the form and put them into variables
        var email = $('#signup-email').val();
        var username = $('#signup-username').val();
        var password = $('#signup-password').val();


        if (email == '' || username == '' || password == '') {
            $('.form-message-signup').text(i18next.t('signup.enterdata'));
            return;
        } else if (!validateEmail(email)) {
             $('.form-message-manage').text(i18next.t('signup.erremail'));
             return;
        }  else {
            $('.form-message-signup').text('');
        }
        loadingdisplay('loading-signup', true)

        var user = new Parse.User();
        user.set("email", email);
        user.set("password", password);
        user.set("username", username);
        user.set("ip", ip);
        user.set("country", country);

        // Call Parse Login function with those variables
        user.signUp(null, {
            // If the username and password matches
            success: function (user) {
                loadingdisplay('loading-signup', false)
                //console.log('Welcome!', user);
                $('.form-message-signup').text(i18next.t('signup.successsignup'));
                window.location.reload();
                user_success();
                //MicApp.fn.setPageType('home');
            },
            // If there is an error
            error: function (user, error) {
                console.log(error);
                loadingdisplay('loading-signup', false)
                if (error.code == 202) {
                    $('.form-message-signup').text(i18next.t('signup.useralready'));
                } else if (error.code == 203) {
                    $('.form-message-signup').text(i18next.t('signup.emailalready'));
                } else if (error.code == 125) {
                    $('.form-message-signup').text(i18next.t('signup.erremail'));
                } else if (error.code == 100) {
                    $('.form-message-signup').text('Check your internet connection!');
                }
                ga('send', 'exception', {
                    'exDescription': error.message,
                    'exFatal': false
                });
            }
        });

    });
    // rest password
    $form_forgot_password.find('input[type="submit"]').on('click', function (e) {

        // Prevent Default Submit Event
        e.preventDefault();

        // Get data from the form and put them into variables
        var email = $('#reset-email').val();
        if (email == "") {
            $('.form-message').text(i18next.t('reset.enteremail'));
            return;
        }
        loadingdisplay('loading-reset', true)
        // Call Parse Login function with those variables
        Parse.User.requestPasswordReset(email, {
            success: function (user) {
                loadingdisplay('loading-reset', false)
                console.log('rest!', user);
                $('.form-message').text(i18next.t('reset.passent'));
            },
            error: function (error) {
                loadingdisplay('loading-reset', false)
                console.log(error);
                if (error.code == 205) {
                    $('.form-message').text(i18next.t('reset.noaccount'));
                } else if (error.code == 204) {
                    $('.form-message').text(i18next.t('reset.enteremail'));
                } else if (error.code == 100) {
                    $('.form-message').text('Check your internet connection!');
                }
                ga('send', 'exception', {
                    'exDescription': error.message,
                    'exFatal': false
                });
            }

        });

    }); // end rest paswword

    $('abbr').on('click', function (event) {
        var lang = $(this).attr('data-lang');
            Cookies.set('language', lang, {
                expires: 365
            });
            window.location.reload();
    });
    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    MicApp.start();


});



jQuery.fn.putCursorAtEnd = function () {
    return this.each(function () {
        // If this function exists...
        if (this.setSelectionRange) {
            // ... then use it (Doesn't work in IE)
            // Double the length because Opera is inconsistent about whether a carriage return is one character or two. Sigh.
            var len = $(this).val().length * 2;
            this.setSelectionRange(len, len);
        } else {
            // ... otherwise replace the contents with itself
            // (Doesn't work in Google Chrome)
            $(this).val($(this).val());
        }
    });
};
