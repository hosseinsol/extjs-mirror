(function () {

var Element = Ext.dom.Element,
    AbstractElement = Ext.dom.AbstractElement,
    LEFT = "left",
    RIGHT = "right",
    positionTopRight = ['position', 'top', 'right'],
    scrollTo = Element.scrollTo,
    getXY = Element.getXY,
    getPageXY = Ext.EventManager.getPageXY,
    scrollbarPlacement,
    borders = {l: 'border-right-width', r: 'border-left-width', t: 'border-top-width', b: 'border-bottom-width'},
    paddings = {l: 'padding-right', r: 'padding-left', t: 'padding-top', b: 'padding-bottom'},
    margins = {l: 'margin-right', r: 'margin-left', t: 'margin-top', b: 'margin-bottom'};

Ext.onReady(function () {
    
    //<debug>
    if (window.location.search.indexOf('ext-mirror-off') !== -1) {
        return;
    }
    //</debug>
    Ext.getBody().addCls('x-mirror');
    
    // src/dom/Element.position.js
    Ext.override(Element, {
        
        setLeft: function (left) {
            this.setStyle(RIGHT, this.addUnits(left));
            return this;
        },
        
        setRight: function (right) {
            this.setStyle(LEFT, this.addUnits(right));
            return this;
        },
        
        getLeft: function (local) {
            return !local ? this.getX() : parseFloat(this.getStyle(RIGHT)) || 0;
        },
        
        translatePoints: function (x, y) {
            var me = this,
                styles = me.getStyle(positionTopRight),
                relative = styles.position == 'relative',
                right = parseFloat(styles.right),
                top = parseFloat(styles.top),
                xy = me.getXY();

            var offsetRight;
            if (me.dom.getBoundingClientRect) {
                offsetRight = me.dom.getBoundingClientRect().right;
            } else {
                offsetRight = me.dom.offsetLeft + me.dom.offsetWidth;
            }
            
            if (Ext.isArray(x)) {
                 y = x[1];
                 x = x[0];
            }
            if (isNaN(right)) {
                right = relative ? 0 : Element.getDocumentWidth() - offsetRight;
            }
            if (isNaN(top)) {
                top = relative ? 0 : me.dom.offsetTop;
            }
            right = (typeof x == 'number') ? x - xy[0] + right : undefined;
            top = (typeof y == 'number') ? y - xy[1] + top : undefined;
            return {
                left: right,
                top: top
            };
        },
        
        setLeftTop: function (left, top) {
            var style = this.dom.style;

            style.right = Element.addUnits(left);
            style.top = Element.addUnits(top);

            return this;
        }
        
    });
    
    // src/dom/Element.scroll.js
    Ext.override(Element, {
        
        getScroll: function () {
            var me = this,
                ret = me.callParent(),
                dom = me.dom;
            if (dom === document.body || dom === document.documentElement) {
                ret.left = -ret.left;
            }
            return ret;
        },
        
        scrollTo: function (side, value, animate) {
            var top = /top/i.test(side),
                me = this,
                dom = me.dom;
            if (!top) {
                if (dom === document.body || dom === document.documentElement) {
                    value = -value;
                } else {
                    value = dom.scrollWidth - dom.clientWidth - value;
                }
            }
            return this.callParent([side, value, animate]);
        }
        
    });
    
    // src/core/src/dom/AbstractElement.static.js
    Element.getXY = AbstractElement.getXY = function (el) {
        var doc = document,
            flyInstance,
            fly = function (el) {
                if (!flyInstance) {
                    flyInstance = new AbstractElement.Fly();
                }
                flyInstance.attach(el);
                return flyInstance;
            };
        
        var bd = (doc.body || doc.documentElement),
            rightBorder = 0,
            topBorder = 0,
            ret = [0,0],
            round = Math.round,
            b,
            scroll;

        el = Ext.getDom(el);

        if(el != doc && el != bd){
            // IE has the potential to throw when getBoundingClientRect called
            // on element not attached to dom
            if (Ext.isIE) {
                try {
                    b = el.getBoundingClientRect();
                    // In some versions of IE, the html element will have a 1px border that gets included, so subtract it off
                    topBorder = bd.clientTop;
                    rightBorder = bd.clientLeft;
                } catch (ex) {
                    b = { right: 0, top: 0 };
                }
            } else {
                b = el.getBoundingClientRect();
            }

            scroll = fly(document).getScroll();
            ret = [round(bd.clientWidth - b.right + scroll.left - rightBorder), round(b.top + scroll.top - topBorder)];
        }
        return ret;
    };
    Element.setXY = AbstractElement.setXY = function (el, xy) {
        (el = Ext.fly(el, '_setXY')).position();

        var pts = el.translatePoints(xy),
            style = el.dom.style,
            pos;
        
        if (pts.left) {
            pts.right = pts.left;
            delete pts.left;
        }

        for (pos in pts) {
            if (!isNaN(pts[pos])) {
                style[pos] = pts[pos] + "px";
            }
        }
    };
    
    // src/core/src/dom/AbstractElement.position.js
    Ext.override(Ext.dom.AbstractElement, {
        setXY: function (pos) {
            var me = this,
                pts,
                style,
                pt;

            if (arguments.length > 1) {
                pos = [pos, arguments[1]];
            }

            // me.position();
            pts = me.translatePoints(pos);
            style = me.dom.style;
            
            if (pts.left) {
                pts.right = pts.left;
                delete pts.left;
            }

            for (pt in pts) {
                if (!pts.hasOwnProperty(pt)) {
                    continue;
                }
                if (!isNaN(pts[pt])) {
                    style[pt] = pts[pt] + "px";
                }
            }
            return me;
        }
    });
    
    // src/core/src/dom/AbstractElement.style.js
    Ext.override(Ext.dom.AbstractElement, {
        
        getBorderWidth: function (side) {
            return this.addStyles(side, borders);//
        },
        
        getPadding: function (side) {
            return this.addStyles(side, paddings);//
        },
        
        margins: margins
        
    });
    Element.margins = AbstractElement.margins = margins;
    
    // src/core/src/EventManager.js
    Ext.EventManager.getPageXY = function (event) {
            var me = this,
                bd = (document.body || document.documentElement),
                ret;
            ret = getPageXY(event);
            ret[0] = bd.clientWidth - ret[0] - 1;
            return ret;
    };
    
    // like src/core/src/Ext-more.js@getScrollbarSize
    Ext.getScrollbarPlacement = function (force) {
        if (force || !scrollbarPlacement) {
            var db = document.body,
                div = document.createElement('div');

            div.style.width = div.style.height = '100px';
            div.style.overflow = 'scroll';
            div.style.position = 'absolute';

            db.appendChild(div); // now we can measure the div...

            scrollbarPlacement = (div.clientLeft > 0) ? 'left' : 'right';

            db.removeChild(div);
        }

        return scrollbarPlacement;
    };
    
    if (Ext.getScrollbarPlacement() === 'left') {
        Ext.getBody().addCls('x-mirror-scrollbar-left');
    } else {
        Ext.getBody().addCls('x-mirror-scrollbar-right');
        Ext.ClassManager.onCreated(function () {
            Ext.override(Ext.grid.ColumnLayout, {
                calculate: function (ownerContext) {
                    var me = this,
                        childItems = ownerContext.childItems,
                        childContext,
                        names = me.getNames(),
                        scrollbarWidth = Ext.getScrollbarSize().width,
                        i = 0,
                        len = childItems.length;
                    me.callParent(arguments);
                    for (;i < len; i += 1){
                        childContext = childItems[i];
                        childContext.setProp(names.x, childContext.props[names.x] + scrollbarWidth);
                    }
                }
            });
        }, this, 'Ext.grid.ColumnLayout');
    }
        
    // src/Shadow.js
    Ext.ClassManager.onCreated(function () {
        Ext.Function.interceptAfter(Ext.Shadow.prototype, 'realign', function () {
            if (!this.el) {
                return;
            }
            var s = this.el.dom.style;
            s.right = s.left;
            s.left = 'auto';
        });
    }, this, 'Ext.Shadow');

    // src/layout/container/Box.js
    Ext.ClassManager.onCreated(function () {
        var renderTpl = Ext.layout.container.Box.prototype.renderTpl;
        // replace left with right
        renderTpl[7] = renderTpl[7].replace('left', 'right');
    }, this, 'Ext.layout.container.Box');

    // src/layout/container/boxOverflow/Scroller.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.layout.container.boxOverflow.Scroller, {

            beginLayout: function (ownerContext) {
                var me = this,
                    layout = me.layout,
                    dom = layout.innerCt.dom,
                    pos = dom.scrollWidth - dom.clientWidth - dom.scrollLeft;

                this.callParent(arguments);
                ownerContext.innerCtScrollPos = pos;
            },

            finishedLayout: function (ownerContext) {
                var me = this,
                    layout = me.layout,
                    dom = layout.innerCt.dom,
                    scrollPos = Math.min(me.getMaxScrollPosition(), ownerContext.innerCtScrollPos);

                dom.scrollLeft = dom.scrollWidth - dom.clientWidth - scrollPos;
            },

            getScrollPosition: function () {
                var me = this,
                    layout = me.layout,
                    dom = layout.innerCt.dom,
                    result;

                // Until we actually scroll, the scroll[Top|Left] is stored as zero to avoid DOM hits.
                if (me.hasOwnProperty('scrollPosition')) {
                    result = me.scrollPosition;
                } else {
                    result = (dom.scrollWidth - dom.clientWidth - dom.scrollLeft) || 0;
                }
                return result;
            }
        });
    }, this, 'Ext.layout.container.boxOverflow.Scroller');

    // src/menu/Item.js
    Ext.ClassManager.onCreated(function () {
        var renderTpl = Ext.menu.Item.prototype.renderTpl;
        // replace margin-right with margin-left
        renderTpl[5] = renderTpl[5].replace('margin-right', 'margin-left');
    }, this, 'Ext.menu.Item');

    // src/panel/Panel.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.panel.Panel, {
            titleAlign: 'right'
        });
    }, this, 'Ext.panel.Panel');

    // src/panel/Header.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.panel.Header, {
            titleAlign: 'right'
        });
    }, this, 'Ext.panel.Header');

    // src/grid/column/Column.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.grid.column.Column, {
            align: 'right'
        });
    }, this, 'Ext.grid.column.Column');

});

}());
