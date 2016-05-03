interface HTMLDivElement {
    ongesturestart: any;
}

interface Event {
    data: any
}

module EventEmitter {
    export function emit(name, data) {
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
        event.data = data;
        window.dispatchEvent(event);
    }

    export function on(name, callback) {
        window.addEventListener(name, callback);
    }
}

module Services {
    export function addClass(elem, cls) {
        if (!hasClass(elem, cls)) {
            var oldCls = elem.getAttribute('class');
            elem.setAttribute('class', oldCls + ' ' + cls);
        }
    }

    export function removeClass(elem, cls) {
        if (hasClass(elem, cls)) {
            var oldCls = elem.getAttribute('class');
            var newCls = oldCls.split(' ' + cls);
            elem.setAttribute('class', newCls[0] + newCls[1]);
        }
    }

    export function hasClass(elem, cls) {
        var oldCls = elem.getAttribute('class');
        if (oldCls.indexOf(cls) > -1) {
            return true;
        } else {
            return false;
        }
    }

    export function isTouchDevice() {
        var el = document.createElement('div');
        el.setAttribute('ongesturestart', 'return;'); // or try "ontouchstart"
        return typeof el.ongesturestart === "function";
    }
}