(function() {
    "use strict";
    var handleDOMContentLoaded = function() {
        var feedbackLink = document.getElementsByClassName('feedback-link')[0];
        feedbackLink.addEventListener(
            'click',
            window.Zenbox.show
        );
        window.Zenbox.init({
            dropboxID: 20294576,
            url: 'https://coins.zendesk.com',
            tabTooltip: 'Support',
            tabImageURL: 'https://assets.zendesk.com/external/zenbox/images/tab_support.png',
            tabColor: '#6d8b9f',
            tabPosition: 'Left'
        });
        
    };
    document.addEventListener(
        'DOMContentLoaded',
        handleDOMContentLoaded,
        false
    );
})();
