/*

Requirements:
-------------
 - LazyLoader needs to be called on dom:loaded or at the bottom of the HTML page.
 - placeHolderImage option is the image to use when an image hasn't be loaded yet.
   It's best to use a placeHolder image that is the same size as the original image.
 - threshold is the amount of pixels to check ahead (so if threshold is 100, then
   it'll check 100 pixels to the left, right, top and bottom of the relativeContainer)
 - You can attach the LazyLoader.update function to an onScroll event to attempt to load images
   whenever a container is scrolled (or any event you see fit).

*/

var LazyLoader = Class.create({
    options: {
        placeHolderImage: "",
        threshold: 0
    },
    
    initialize: function(container, options) {
        this.options = Object.extend(Object.extend({}, this.options), options || {});
        
        // use selector to grab the images
        this.container = $(container);
        
        // die gracefully
        if (this.container == null) return;
        
        this.images = this.container.getElementsBySelector('img');
        
        this.lazyLoadedImaged = this.images.map(function(image) {
            return new LazyLoader.Image(image, this.options, this);
        }.bind(this));
		
        // update on load only if using scroll!
        if (this.container.getStyle('overflow') == "scroll") {
            // update on scroll
    		this.container.observe('scroll', this.update.bind(this));
            Event.observe(window, 'load', this.update.bind(this));
        }
    },
    
    /* Call this with an event or whenever you want to attempt to load visible image */
    update: function() {
        this.lazyLoadedImaged.each(function(image) {
           image.showIfVisible(); 
        });
    },
    
    /* Use to change threshold at any time */
    setThreshold: function(threshold) {
        this.options.threshold = threshold;
        
        this.lazyLoadedImaged.each(function(image) {
           image.options.threshold = threshold; 
        });
    }
});

LazyLoader.Image = Class.create({
    options: {
    },
    
    initialize: function(image, options, parent) {
        this.options = Object.extend(Object.extend({}, this.options), options || {});
        
        // store the image
        this.image = $(image);
        this.parent = parent;
        
        // remove src of images if invisible
        this.hide();
    },
    
    /* Add the source back to image if it's now visible in the dom element viewport */
    showIfVisible: function() {
        if (this.loaded) return;
        
        if (this.isVisible() && this.originalSource != null) {
            this.image.src = this.originalSource;
            this.loaded = true;
        }
    },
    
    /* Remove the src of the image if invisible, for lazy loading later */
    hide: function() {
        this.originalSource = this.image.src;
        this.image.src = this.options.placeHolderImage;
    },

    /* Returns true if the specified position is in the specified bounding box */    
    checkPositionIsInDimensions: function(position, dimensions) {
        // check if the point is inside the bounding box
        return  position.left > -this.options.threshold &&
                position.left < dimensions.width + this.options.threshold &&
                position.top > -this.options.threshold &&
                position.top < dimensions.height + this.options.threshold;
    },
    
    /* Returns true if the image is currently visible */
    isVisible: function() {
        var offsetParent;
        
        //if (this.options.relativeContainer) {
        offsetParent = $(this.parent.container);
        //} else {
        //    offsetParent = this.image.getOffsetParent();
        //}
        
        // calculate dimensions and scroll position of the offset parent
        var offsetParentDimensions      = offsetParent.getDimensions();
        var offsetParentScrollPosition  = { 'left': offsetParent.scrollLeft, 'top': offsetParent.scrollTop };
        
        // calculate the visible position of the image
        var offsetParentPosition    = offsetParent.cumulativeOffset();
        var position                = this.image.cumulativeOffset();
        
        position = {
            'left': position.left - offsetParentPosition.left,
            'top': position.top - offsetParentPosition.top
        };
        
        var scrolledPosition = {
            'left': (position.left - offsetParentScrollPosition.left),
            'top': (position.top - offsetParentScrollPosition.top)
        };
        
        // work out the bottom right position of the image
        var imageDimensions = this.image.getDimensions();
        var bottomPosition = {
            'left': (scrolledPosition.left + imageDimensions.width),
            'top': (scrolledPosition.top + imageDimensions.height)
        };
        
        // check if in the visible bounding box
        return this.checkPositionIsInDimensions(scrolledPosition, offsetParentDimensions) ||
               this.checkPositionIsInDimensions(bottomPosition, offsetParentDimensions);
    }
});