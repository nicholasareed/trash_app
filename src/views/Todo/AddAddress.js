/*globals define*/
define(function(require, exports, module) {

    var Engine = require('famous/core/Engine');
    var View = require('famous/core/View');
    var ScrollView = require('famous/views/Scrollview');
    var SequentialLayout = require('famous/views/SequentialLayout');
    var Surface = require('famous/core/Surface');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var InputSurface = require('famous/surfaces/InputSurface');
    var SubmitInputSurface = require('famous/surfaces/SubmitInputSurface');
    var FormContainerSurface = require('famous/surfaces/FormContainerSurface');
    var Modifier = require('famous/core/Modifier');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Transitionable     = require('famous/transitions/Transitionable');
    var Transform = require('famous/core/Transform');
    var Matrix = require('famous/core/Transform');
    var RenderNode         = require('famous/core/RenderNode')

    var Utility = require('famous/utilities/Utility');
    var Timer = require('famous/utilities/Timer');

    var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');
    var NavigationBar = require('famous/widgets/NavigationBar');
    var GridLayout = require("famous/views/GridLayout");

    var Credentials         = JSON.parse(require('text!credentials.json'));
    var $ = require('jquery');
    var Utils = require('utils');

    // Curves
    var Easing = require('famous/transitions/Easing');

    // Views
    var StandardPageView = require('views/common/StandardPageView');
    var StandardHeader = require('views/common/StandardHeader');
    var FormHelper = require('views/common/FormHelper');
    var BoxLayout = require('famous-boxlayout');
    
    var EventHandler = require('famous/core/EventHandler');

    // Models
    var UserModel = require('models/user');
    // var Geolocation = require('models/geolocation');


    function PageView(options) {
        var that = this;
        StandardPageView.apply(this, arguments);
        this.options = options;

        if(!this.options.App.Cache.TodoAddLocationOptions){
            console.error('no location options');
            App.history.back();
            return;
        }

        // What we'll return (kinda, through choose_xyz)
        // ....

        // Add to new ".passed" options, separate from this.options.App and other root-level arguments/objects
        this.options.passed = _.extend({
            // ;pass
        }, App.Cache.TodoAddLocationOptions || {});

        this._showing = false;

        // create the layout
        this.layout = new HeaderFooterLayout({
            headerSize: App.Defaults.Header.size,
            footerSize: 0
        });

        this.createHeader();
        this.createContent();
        
        // Attach to render tree
        this.add(this.layout);

    }

    PageView.prototype = Object.create(StandardPageView.prototype);
    PageView.prototype.constructor = PageView;

    PageView.prototype.createHeader = function(){
        var that = this;

        // create the header
        this.header = new StandardHeader({
            content: "",
            classes: ["normal-header"],
            backClasses: ["normal-header"],
            // backContent: tru,
            moreContent: false
        }); 
        this.header._eventOutput.on('back',function(){
            App.history.back();
        });
        this.header.navBar.title.on('click',function(){
            App.history.back();

            if(this.test.click4){
                console.log(1);
            }
        });
        this.header.pipe(this._eventInput);
        this._eventOutput.on('inOutTransition', function(args){
            this.header.inOutTransition.apply(this.header, args);
        })

        // Attach header to the layout        
        this.layout.header.add(Utils.usePlane('header')).add(this.header);

    };

    PageView.prototype.createContent = function(){
        var that = this;

        this.form = new FormHelper({
            type: 'form',
            scroll: true
        });

        // Add surfaces to content (buttons)
        this.addSurfaces();

        // Content Modifiers
        this.layout.content.StateModifier = new StateModifier();

        // Now add content
        this.layout.content.add(this.layout.content.StateModifier).add(Utils.usePlane('content')).add(this.form);


        // // Form Container
        // this.FormContainer = new FormContainerSurface();

        // // create the scrollView of content
        // this.contentScrollView = new ScrollView(App.Defaults.ScrollView);
        // this.contentScrollView.Views = [];

        // // link endpoints of layout to widgets

        // // Sequence
        // this.contentScrollView.sequenceFrom(this.contentScrollView.Views);

        // this.FormContainer.add(this.contentScrollView);

        // // Content Modifiers
        // this.layout.content.StateModifier = new StateModifier();

        // // Now add content
        // this.layout.content.add(this.layout.content.StateModifier).add(this.FormContainer);


    };

    PageView.prototype.addSurfaces = function() {
        var that = this;

        var allInputs = []; // array for adding to the _formScrollView

        // // Text at top
        // this.topText = new View();
        // this.topText.StateModifier = new StateModifier();
        // this.topText.Surface = new Surface({
        //     content: 'Where is your<br />Blossom installed?',
        //     size: [undefined, 60], 
        //     classes: ['add-address-top-text']
        // });
        // this.topText.Surface.pipe(this.form._formScrollView);
        // this.topText.add(this.topText.StateModifier).add(this.topText.Surface);

        // allInputs.push(this.topText);


        // // Auto-fill option
        // this.topAutofill = new View();
        // this.topAutofill.StateModifier = new StateModifier();
        // this.topAutofill.Surface = new Surface({
        //     content: 'Autofill with current location',
        //     size: [undefined, 30], 
        //     classes: ['add-address-autofill-text']
        // });
        // this.topAutofill.Surface.pipe(this.form._formScrollView);
        // this.topAutofill.Surface.on('click', function(){
        //     that.autofill_with_gps();
        // });
        // this.topAutofill.add(this.topAutofill.StateModifier).add(this.topAutofill.Surface);

        // allInputs.push(this.topAutofill);


        var defStreet = localStorage.getItem('address_street') && localStorage.getItem('address_street') != 'null' ? localStorage.getItem('address_street') : '';
        var defStreet2 = localStorage.getItem('address_street2') && localStorage.getItem('address_street2') != 'null'? localStorage.getItem('address_street2') : '';
        var defCity = localStorage.getItem('address_city') && localStorage.getItem('address_city') != 'null'? localStorage.getItem('address_city') : '';
        var defState = localStorage.getItem('address_state') && localStorage.getItem('address_state') != 'null'? localStorage.getItem('address_state') : '';
        var defZipcode = localStorage.getItem('address_zipcode') && localStorage.getItem('address_zipcode') != 'null' ? localStorage.getItem('address_zipcode') : '';

        this.inputs = [{
            name: 'street',
            placeholder: 'Street Address',
            type: 'text',
            size: [undefined, 50],
            value: defStreet
        },{
            name: 'street2',
            placeholder: 'Apt or Unit #',
            type: 'text',
            size: [undefined, 50],
            value: defStreet2
        },{
            name: 'city',
            placeholder: 'City',
            type: 'text',
            size: [undefined, 50],
            value: defCity
        },{
            name: 'state',
            placeholder: 'State',
            type: 'text',
            size: [undefined, 50],
            value: defState
        },{
            name: 'zipcode',
            placeholder: 'Zipcode',
            type: 'number',
            size: [undefined, 50],
            value: defZipcode
        }];

        this._inputs = {};

        this.inputs.forEach(function(inputOpts){
            var id = inputOpts.id || inputOpts.name;

            that._inputs[id] = new FormHelper({

                margins: [10,10],

                form: that.form,
                name: inputOpts.name,
                placeholder: inputOpts.placeholder,
                type: inputOpts.type,
                value: inputOpts.value
            });

            // that._inputs[id] = new InputSurface(inputOpts);
            // that._inputs[id].pipe(that.contentScrollView);
            // that._inputs[id].View = new View();
            // that._inputs[id].View.StateModifier = new StateModifier();
            // that._inputs[id].View.add(that._inputs[id].View.StateModifier).add(that._inputs[id]);
            // that.contentScrollView.Views.push(that._inputs[id].View);
        });

        Object.keys(this._inputs).forEach(function(key){
            allInputs.push(that._inputs[key]);
        });

        this.submitButton = new FormHelper({
            form: this.form,
            type: 'submit',
            value: 'Save Address',
            margins: [10,10],
            click: this.save_address.bind(this)
        });

        allInputs.push(this.submitButton);

        this.form.addInputsToForm(allInputs);


        // this.submitButtonSurface = new SubmitInputSurface({
        //     value: 'Save Address',
        //     size: [undefined, 60],
        //     classes: ['form-button-submit-default']
        // });
        // this.submitButtonSurface.View = new View();
        // this.submitButtonSurface.View.StateModifier = new StateModifier();
        // this.submitButtonSurface.View.add(this.submitButtonSurface.View.StateModifier).add(this.submitButtonSurface);
        // this.contentScrollView.Views.push(this.submitButtonSurface.View);

        // this.FormContainer.on('submit', function(ev){
        //     ev.preventDefault();
        //     return false;
        // });

        // // Events for surfaces
        // this.submitButtonSurface.on('click', this.save_address.bind(this));


    };

    PageView.prototype.save_address = function(ev){
        var that = this;

        if(this.checking === true){
            return;
        }
        this.checking = true;
        this.submitButton.setContent('Validating Address');

        // var $form = this.$('#credit-card-form');
        var submitData = {
            street: $.trim(this._inputs['street'].getValue().toString()),
            street2: $.trim(this._inputs['street2'].getValue().toString()),
            city: $.trim(this._inputs['city'].getValue().toString()),
            state: $.trim(this._inputs['state'].getValue().toString()),
            zipcode: $.trim(this._inputs['zipcode'].getValue().toString())
        };

        localStorage.setItem('address_street', submitData.street);
        localStorage.setItem('address_street2', submitData.street2);
        localStorage.setItem('address_city', submitData.city);
        localStorage.setItem('address_state', submitData.state);
        localStorage.setItem('address_zipcode', submitData.zipcode);

        console.log(submitData);

        // App.Cache.AddController = {
        //     address: submitData
        // };


        App.Cache.TodoAddLocationOptions.on_choose(submitData);


        // // Test validation
        // Geolocation.AddressValidation(submitData)
        // .then(function(results){
        //     console.log(results);
        //     // return;
        //     that.checking = false;
        //     that.submitButton.setContent('Save Address');
        //     App.history.navigate('controller/add/activate/' + that.options.args[0]);
        // })
        // .fail(function(){
        //     that.checking = false;
        //     that.submitButton.setContent('Save Address');
        //     Utils.Notification.Toast('Address validation failed');
        // });

        return false;
    };

    PageView.prototype.autofill_with_gps = function(){
        var that = this;

        // get gps position
        // - pop up a "waiting" window while we do this
        // -PopoverWaiting? (with cancel option)
        App.Events.on('popover-new', function(newPopover){
            that.WaitingPopover = newPopover;
        });

        Timer.setTimeout(function(){

            var gotLocationResponse = false;

            try {
                navigator.geolocation.getCurrentPosition(function(position){

                    // Fetch address from these coordinates

                    if(gotLocationResponse){
                        // already "failed" getting in a timely fashion
                        return;
                    }
                    gotLocationResponse = true;
                    
                    console.log("POSITION");
                    console.log(position);

                    // Test validation
                    Geolocation.AddressFromGPS(position.coords)
                    .then(function(results){
                        // Got some results back

                        App.Views.Popover.hideIf(that.WaitingPopover);

                        if(results.length < 1){
                            console.error('Unable to find address');
                            Utils.Notification.Toast('Unable to find address');
                            return;
                        }

                        var address = results.shift();

                        console.log(address);

                        // Put values in Inputs
                        that._inputs['street'].setContent(address.street);
                        that._inputs['street2'].setContent(address.street2);
                        that._inputs['city'].setContent(address.city);
                        that._inputs['state'].setContent(address.state);
                        that._inputs['zipcode'].setContent(address.zipcode);

                    })
                    .fail(function(){

                        if(gotLocationResponse){
                            // already "failed" getting in a timely fashion
                            return;
                        }
                        gotLocationResponse = true;

                        App.Views.Popover.hideIf(that.WaitingPopover);

                    });

                    App.Views.Popover.hideIf(that.WaitingPopover);

                }, function(err){

                    if(gotLocationResponse){
                        // already "failed" getting in a timely fashion
                        return;
                    }
                    gotLocationResponse = true;
                    
                    Utils.Notification.Toast('Unable to load GPS');
                    App.Views.Popover.hideIf(that.WaitingPopover);
                });
                
                Timer.setTimeout(function(){
                    // failed getting gps quickly enough?
                    if(gotLocationResponse){
                        return;
                    }
                    gotLocationResponse = true;
                    Utils.Notification.Toast('Unable to load GPS');
                    App.Views.Popover.hideIf(that.WaitingPopover);                        
                },5000);

            } catch(err){
                console.error(err);
                Utils.Notification.Toast('Unable to load GPS');
                App.Views.Popover.hideIf(that.WaitingPopover);
            }
        },1000);

        Utils.Popover.Waiting();

    };

    PageView.prototype.inOutTransition = function(direction, otherViewName, transitionOptions, delayShowing, otherView, goingBack){
        var that = this;

        this._eventOutput.emit('inOutTransition', arguments);

        switch(direction){
            case 'hiding':
                this._showing = false;
                switch(otherViewName){

                    default:
                        // Overwriting and using default identity
                        transitionOptions.outTransform = Transform.identity;

                        // Hide/move elements
                        Timer.setTimeout(function(){

                            // slide out
                            that.layout.content.StateModifier.setTransform(Transform.translate(-1 * window.innerWidth,0,0),{
                                duration: 450,
                                curve: Easing.inQuad
                            });

                        }, delayShowing);

                        break;
                }

                break;
            case 'showing':
                this._showing = true;
                if(this._refreshData){
                    // Timer.setTimeout(that.refreshData.bind(that), 1000);
                }
                this._refreshData = true;
                switch(otherViewName){

                    default:

                        // No animation by default
                        transitionOptions.inTransform = Transform.identity;

                        // // Default position
                        // if(goingBack){
                        //     that.layout.content.StateModifier.setTransform(Transform.translate(window.innerWidth * -1,0,0));
                        // } else {
                        //     that.layout.content.StateModifier.setTransform(Transform.translate(window.innerWidth + 100,0,0));
                        // }
                        that.layout.content.StateModifier.setTransform(Transform.translate(window.innerWidth,0,0));
                        // that.contentScrollView.Views.forEach(function(surf, index){
                        //     surf.StateModifier.setTransform(Transform.translate(0,window.innerHeight,0));
                        // });

                        // Content
                        // - extra delay for other content to be gone
                        Timer.setTimeout(function(){

                            that.layout.content.StateModifier.setTransform(Transform.translate(0,0,0),{
                                duration: 450,
                                curve: Easing.outQuad
                            });

                            // // Bring content back
                            // that.layout.content.StateModifier.setTransform(Transform.translate(0,0,0), transitionOptions.inTransition);

                            // Bring in button surfaces individually
                            // that.contentScrollView.Views.forEach(function(surf, index){
                                // Timer.setTimeout(function(){
                                //     surf.StateModifier.setTransform(Transform.translate(0,0,0), {
                                //         duration: 750,
                                //         curve: Easing.inOutElastic
                                //     });
                                // }, index * 50);
                            // });

                        }, delayShowing); // + transitionOptions.outTransition.duration);

                        break;
                }
                break;
        }
        
        return transitionOptions;
    };



    PageView.DEFAULT_OPTIONS = {
        header: {
            size: [undefined, 50],
            // inTransition: true,
            // outTransition: true,
            // look: {
            //     size: [undefined, 50]
            // }
        },
        footer: {
            size: [undefined, 0]
        },
        content: {
            size: [undefined, undefined],
            inTransition: true,
            outTransition: true,
            overlap: true
        }
    };

    module.exports = PageView;

});
