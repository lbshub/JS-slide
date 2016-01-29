/**
 * LBS Slide 图片切换/轮播/焦点图 
 * Date: 2012-5-26
 * ===================================================
 * opts.el 外围包裹容器(wrapper) (一个ID或者元素对象)
          它的第一个子元素(slider)
 * opts.distance 每次滚动的距离 (默认slider的clientWidth)          
 * opts.index 	索引(默认0) 指定显示哪个索引项的图片
 * opts.current	当前项添加的类名(默认'current')
 * opts.pointShow 是否需要导航指示 默认true 需要 
 * opts.pointClass 导航指示容器的类名 方便设置样式 (默认'slide-point') 
 * opts.pointEvent 导航指示绑定的事件 ('click'-默认 'mouseover')
 * opts.duration 动画持续时间 (默认400毫秒)
 * opts.easing 动画效果 默认'linear' (*)
 	spring: 弹簧(*)
 	wobble: 摇晃
 	swing: 摇摆(*)
 	bounce: 反弹(*)
 	easeIn: 加速 渐入
 	easeOut: 减速 渐出
 	easeInOut: 先加速后减速 渐入渐出(*)
 	easeFrom: 由慢到快
 	easeTo: 由快到慢
 	easeOutBounce: 渐出反弹(*)
 	easeInOutBack: 渐入渐出晃动
 	easeInOutQuad: 渐入渐出 四次方(*)
 	easeInOutCubic: 渐入渐出 三次方
 * opts.auto 是否自动滚动(默认false)
 * opts.delay 自动滚动间隔时间(默认5000毫秒)
 * opts.lazyLoad 是否延迟加载图片 (默认false 不延迟加载)
 * opts.attribute 预定义的图片真实地址的属性 (默认_src)
 * ===================================================
 * this.slideLeft() 向左滚动(方便手动调用)
 * this.slideRight() 向右滚动(方便手动调用)
 * ===================================================
 **/

;(function(window, document) {
	'use strict';

	var tween = {
		linear: function(pos) {
			return pos;
		},
		spring: function(pos) {
			return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
		},
		wobble: function(pos) {
			return (-Math.cos(pos * Math.PI * (9 * pos)) / 2) + 0.5;
		},
		swing: function(pos) {
			return 0.5 - Math.cos(pos * Math.PI) / 2;
		},
		bounce: function(pos) {
			if (pos < (1 / 2.75)) {
				return (7.5625 * pos * pos);
			} else if (pos < (2 / 2.75)) {
				return (7.5625 * (pos -= (1.5 / 2.75)) * pos + .75);
			} else if (pos < (2.5 / 2.75)) {
				return (7.5625 * (pos -= (2.25 / 2.75)) * pos + .9375);
			} else {
				return (7.5625 * (pos -= (2.625 / 2.75)) * pos + .984375);
			}
		},
		easeIn: function(pos) {
			return -Math.cos(pos * (Math.PI / 2)) + 1;
		},
		easeOut: function(pos) {
			return Math.sin(pos * (Math.PI / 2));
		},
		easeInOut: function(pos) {
			return (-.5 * (Math.cos(Math.PI * pos) - 1));
		},
		easeFrom: function(pos) {
			return Math.pow(pos, 4);
		},
		easeTo: function(pos) {
			return Math.pow(pos, 0.25);
		},
		easeOutBounce: function(pos) {
			if ((pos) < (1 / 2.75)) {
				return (7.5625 * pos * pos);
			} else if (pos < (2 / 2.75)) {
				return (7.5625 * (pos -= (1.5 / 2.75)) * pos + .75);
			} else if (pos < (2.5 / 2.75)) {
				return (7.5625 * (pos -= (2.25 / 2.75)) * pos + .9375);
			} else {
				return (7.5625 * (pos -= (2.625 / 2.75)) * pos + .984375);
			}
		},
		easeInOutBack: function(pos) {
			var s = 1.70158;
			if ((pos /= 0.5) < 1) return 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s));
			return 0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
		},
		easeInOutQuad: function(pos) {
			if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 2);
			return -0.5 * ((pos -= 2) * pos - 2);
		},
		easeInOutCubic: function(pos) {
			if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 3);
			return 0.5 * (Math.pow((pos - 2), 3) + 2);
		}
	};

	var Slide = function(opts) {
		opts = opts || {};
		if (opts.el === undefined) return;
		this.wrapper = typeof opts.el === 'string' ? document.getElementById(opts.el) : opts.el;
		this.slider = this.wrapper.children[0];
		this.elements = this.slider.children;
		this.length = this.elements.length;
		if (this.length < 1) return;
		if (opts.index > this.length - 1) opts.index = 0;
		this.index = opts.index || 0;
		this.oIndex = this.index;
		this.distance = opts.distance || parseInt(this.slider.clientWidth); //滚动的宽度

		this.duration = opts.duration || 400;
		this.easing = (opts.easing && tween[opts.easing]) || tween.linear;
		this.auto = !!opts.auto || false;
		this.auto && (this.delay = opts.delay || 5000);

		this.lazyLoad = !!opts.lazyLoad || false;
		this.attribute = opts.attribute || '_src';
		this.current = opts.current || 'current';

		this.pointShow = opts.pointShow === false ? false : true;
		this.pointClass = opts.pointClass || 'slide-point';
		this.pointEvent = opts.pointEvent || 'click';
		this.points = [];

		this._init();
	};
	Slide.prototype = {
		_init: function() {
			if (this.pointShow) this._create();
			this._initSet();
			this._bind();
		},
		_create: function() {
			var li = null,
				i = 0;
			this.pointer = document.createElement('ul');
			for (; i < this.length; i++) {
				li = document.createElement('li');
				li.innerHTML = i + 1;
				li.index = i;
				this.points.push(li);
				this.pointer.appendChild(li);
			}
			this.pointer.className = this.pointClass;
			this.wrapper.appendChild(this.pointer);
		},
		_initSet: function() {
			if (this.css(this.slider, 'position') === 'static') this.slider.style.position = 'relative';
			for (var i = 0; i < this.length; i++) {
				if (this.css(this.elements[i], 'display') !== 'none') this.elements[i].style.display = 'none';
				if (this.css(this.elements[i], 'position') !== 'absolute') this.elements[i].style.position = 'absolute';
			}
			this.elements[this.index].style.left = 0;
			this.elements[this.index].className += ' ' + this.current;
			this.elements[this.index].style.display = 'block';
			if (this.lazyLoad) this._loadIMG(this.elements[this.index]);
			if (this.pointShow) this.points[this.index].className += ' ' + this.current;
		},
		_bind: function() {
			var _this = this;
			if (this.pointShow) this._event();
			if (this.auto) {
				this.play();
				this.on(this.wrapper, 'mouseover', function() {
					_this.stop();
				});
				this.on(this.wrapper, 'mouseout', function() {
					_this.play();
				});
			}
		},
		_event: function() {
			var _this = this,
				timer = null;
			this.on(this.pointer, this.pointEvent, function(e) {
				if (_this.amimated) return;
				var e = e || window.event,
					target = e.target || e.srcElement;
				if (target.tagName.toLowerCase() === 'li') {
					if (_this.pointEvent === 'mouseover') {
						clearTimeout(timer);
						timer = setTimeout(function() {
							_this.index = target.index;
							_this._slide();
						}, 200);
						return;
					}
					_this.index = target.index;
					_this._slide();
				}
			});
		},
		_loadIMG: function(el) {
			var img = el.getElementsByTagName('img')[0];
			if (img.getAttribute(this.attribute)) {
				img.setAttribute('src', img.getAttribute(this.attribute));
				img.removeAttribute(this.attribute);
			}
		},
		_animate: function(el, sm, ft, fn) {
			var start = parseInt(el.style[sm]),
				end = ft,
				change = end - start,
				duration = this.duration,
				ease = this.easing,
				startTime = +new Date();
			!function animate() {
				var nowTime = +new Date(),
					timestamp = nowTime - startTime,
					delta = ease(timestamp / duration);
				el.style[sm] = start + (delta * change) + 'px';
				if (timestamp > duration) {
					el.style[sm] = end + 'px';
					fn && fn();
				} else {
					setTimeout(animate, 20);
				}
			}();
		},
		_slide: function() {
			if (this.index === this.oIndex) return;
			var _this = this,
				distance = 0;
			this.amimated = true;
			distance = this.index < this.oIndex ? -this.distance : this.distance;
			if (this.index > this.length - 1) this.index = 0;
			if (this.index < 0) this.index = this.length - 1;
			this.elements[this.index].style.left = distance + 'px';
			this.elements[this.index].style.display = 'block';
			if (this.lazyLoad) this._loadIMG(this.elements[this.index]);
			if (this.pointShow) {
				this.points[this.index].className += ' ' + this.current;
				this.points[this.oIndex].className = this.points[this.oIndex].className.replace(this.current, '');
			}
			this._animate(this.elements[this.oIndex], 'left', -distance);
			this._animate(this.elements[this.index], 'left', 0, function() {
				_this._slideEnd();
			});
		},
		_slideEnd: function() {
			this.elements[this.index].className += ' ' + this.current;
			this.elements[this.oIndex].style.display = 'none';
			this.elements[this.oIndex].className = this.elements[this.oIndex].className.replace(this.current, '');
			this.oIndex = this.index;
			this.amimated = false;
		},
		slideLeft: function() {
			if (this.amimated) return;
			this.index++;
			this._slide();
		},
		slideRight: function() {
			if (this.amimated) return;
			this.index--;
			this._slide();
		},
		play: function() {
			var _this = this;
			this.timer = setInterval(function() {
				_this.slideLeft();
			}, this.delay);
		},
		stop: function() {
			this.timer && clearInterval(this.timer);
			this.timer = null;
		},
		css: function(o, n) {
			return o.currentStyle ? o.currentStyle[n] : getComputedStyle(o, null)[n];
		},
		on: function(el, type, handler) {
			if (el.addEventListener) {
				el.addEventListener(type, handler, false);
			} else if (el.attachEvent) {
				el.attachEvent('on' + type, handler);
			} else {
				el['on' + type] = handler;
			}
		}
	};

	if (typeof define === 'function' && define.amd) {
		define('Slide', [], function() {
			return Slide;
		});
	} else {
		window.Slide = Slide;
	}

}(window, document));