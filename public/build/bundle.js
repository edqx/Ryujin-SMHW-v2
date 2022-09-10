
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\ClassGroups.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$a } = globals;
    const file$l = "src\\components\\ClassGroups.svelte";

    function get_each_context$a(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (26:16) {#each pool as class_group}
    function create_each_block$a(ctx) {
    	let tr;
    	let td0;
    	let button;
    	let t1;
    	let td1;
    	let t2_value = /*class_group*/ ctx[6].class_year + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*class_group*/ ctx[6].name + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*class_group*/ ctx[6].student_ids.length + "";
    	let t6;
    	let t7;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*class_group*/ ctx[6], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			button = element("button");
    			button.textContent = "→";
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			add_location(button, file$l, 27, 28, 875);
    			add_location(td0, file$l, 27, 24, 871);
    			add_location(td1, file$l, 28, 24, 966);
    			add_location(td2, file$l, 29, 24, 1025);
    			add_location(td3, file$l, 30, 24, 1078);
    			add_location(tr, file$l, 26, 20, 841);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, button);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*pool*/ 4 && t2_value !== (t2_value = /*class_group*/ ctx[6].class_year + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*pool*/ 4 && t4_value !== (t4_value = /*class_group*/ ctx[6].name + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*pool*/ 4 && t6_value !== (t6_value = /*class_group*/ ctx[6].student_ids.length + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$a.name,
    		type: "each",
    		source: "(26:16) {#each pool as class_group}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let label;
    	let t1;
    	let t2_value = /*pool*/ ctx[2].length + "";
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t5;
    	let td1;
    	let t7;
    	let td2;
    	let t9;
    	let td3;
    	let t11;
    	let tbody;
    	let mounted;
    	let dispose;
    	let each_value = /*pool*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$a(get_each_context$a(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text("Filter (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			t4 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			t5 = space();
    			td1 = element("td");
    			td1.textContent = "Year";
    			t7 = space();
    			td2 = element("td");
    			td2.textContent = "Name";
    			t9 = space();
    			td3 = element("td");
    			td3.textContent = "Students";
    			t11 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "name", "filter");
    			add_location(input, file$l, 11, 8, 356);
    			attr_dev(label, "for", "filter");
    			add_location(label, file$l, 12, 8, 407);
    			attr_dev(div0, "class", "selector-list-header");
    			add_location(div0, file$l, 10, 4, 312);
    			add_location(td0, file$l, 18, 20, 590);
    			add_location(td1, file$l, 19, 20, 621);
    			add_location(td2, file$l, 20, 20, 656);
    			add_location(td3, file$l, 21, 20, 691);
    			add_location(tr, file$l, 17, 16, 564);
    			add_location(thead, file$l, 16, 12, 539);
    			add_location(tbody, file$l, 24, 12, 767);
    			add_location(table, file$l, 15, 8, 518);
    			attr_dev(div1, "class", "selector-list-table");
    			add_location(div1, file$l, 14, 4, 475);
    			attr_dev(div2, "class", "selector-list");
    			add_location(div2, file$l, 9, 0, 279);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*filter*/ ctx[1]);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			append_dev(label, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t5);
    			append_dev(tr, td1);
    			append_dev(tr, t7);
    			append_dev(tr, td2);
    			append_dev(tr, t9);
    			append_dev(tr, td3);
    			append_dev(table, t11);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*filter*/ 2 && input.value !== /*filter*/ ctx[1]) {
    				set_input_value(input, /*filter*/ ctx[1]);
    			}

    			if (dirty & /*pool*/ 4 && t2_value !== (t2_value = /*pool*/ ctx[2].length + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*pool, selected*/ 5) {
    				each_value = /*pool*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$a(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$a(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { class_groups } = $$props;
    	let { selected } = $$props;
    	let filter = "";
    	const writable_props = ["class_groups", "selected"];

    	Object_1$a.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ClassGroups> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ClassGroups", $$slots, []);

    	function input_input_handler() {
    		filter = this.value;
    		$$invalidate(1, filter);
    	}

    	const click_handler = class_group => $$invalidate(0, selected = class_group);

    	$$self.$set = $$props => {
    		if ("class_groups" in $$props) $$invalidate(3, class_groups = $$props.class_groups);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({ class_groups, selected, filter, pool });

    	$$self.$inject_state = $$props => {
    		if ("class_groups" in $$props) $$invalidate(3, class_groups = $$props.class_groups);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("filter" in $$props) $$invalidate(1, filter = $$props.filter);
    		if ("pool" in $$props) $$invalidate(2, pool = $$props.pool);
    	};

    	let pool;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filter, class_groups*/ 10) {
    			$$invalidate(2, pool = filter
    			? Object.values(class_groups).filter(class_group => class_group.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
    			: Object.values(class_groups));
    		}
    	};

    	return [selected, filter, pool, class_groups, input_input_handler, click_handler];
    }

    class ClassGroups extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { class_groups: 3, selected: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClassGroups",
    			options,
    			id: create_fragment$l.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*class_groups*/ ctx[3] === undefined && !("class_groups" in props)) {
    			console.warn("<ClassGroups> was created without expected prop 'class_groups'");
    		}

    		if (/*selected*/ ctx[0] === undefined && !("selected" in props)) {
    			console.warn("<ClassGroups> was created without expected prop 'selected'");
    		}
    	}

    	get class_groups() {
    		throw new Error("<ClassGroups>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class_groups(value) {
    		throw new Error("<ClassGroups>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<ClassGroups>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<ClassGroups>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ClassGroupInfo.svelte generated by Svelte v3.23.0 */

    const file$k = "src\\components\\ClassGroupInfo.svelte";

    // (5:0) {#if class_group}
    function create_if_block$b(ctx) {
    	let span0;
    	let t0;
    	let t1_value = /*class_group*/ ctx[0].id + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*class_group*/ ctx[0].class_year + "";
    	let t4;
    	let t5;
    	let span2;
    	let t6;
    	let t7_value = /*class_group*/ ctx[0].name + "";
    	let t7;
    	let t8;
    	let span3;
    	let t9;
    	let t10_value = /*class_group*/ ctx[0].student_ids.length + "";
    	let t10;
    	let t11;
    	let span4;
    	let t12;
    	let t13_value = /*class_group*/ ctx[0].teacher_ids.length + "";
    	let t13;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text("ID: ");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text("Year: ");
    			t4 = text(t4_value);
    			t5 = space();
    			span2 = element("span");
    			t6 = text("Name: ");
    			t7 = text(t7_value);
    			t8 = space();
    			span3 = element("span");
    			t9 = text("Students: ");
    			t10 = text(t10_value);
    			t11 = space();
    			span4 = element("span");
    			t12 = text("Teachers: ");
    			t13 = text(t13_value);
    			add_location(span0, file$k, 5, 4, 75);
    			add_location(span1, file$k, 6, 4, 114);
    			add_location(span2, file$k, 7, 4, 163);
    			add_location(span3, file$k, 8, 4, 206);
    			add_location(span4, file$k, 9, 4, 267);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, span3, anchor);
    			append_dev(span3, t9);
    			append_dev(span3, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, span4, anchor);
    			append_dev(span4, t12);
    			append_dev(span4, t13);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*class_group*/ 1 && t1_value !== (t1_value = /*class_group*/ ctx[0].id + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*class_group*/ 1 && t4_value !== (t4_value = /*class_group*/ ctx[0].class_year + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*class_group*/ 1 && t7_value !== (t7_value = /*class_group*/ ctx[0].name + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*class_group*/ 1 && t10_value !== (t10_value = /*class_group*/ ctx[0].student_ids.length + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*class_group*/ 1 && t13_value !== (t13_value = /*class_group*/ ctx[0].teacher_ids.length + "")) set_data_dev(t13, t13_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(span4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(5:0) {#if class_group}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let if_block_anchor;
    	let if_block = /*class_group*/ ctx[0] && create_if_block$b(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*class_group*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$b(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { class_group } = $$props;
    	const writable_props = ["class_group"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ClassGroupInfo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ClassGroupInfo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("class_group" in $$props) $$invalidate(0, class_group = $$props.class_group);
    	};

    	$$self.$capture_state = () => ({ class_group });

    	$$self.$inject_state = $$props => {
    		if ("class_group" in $$props) $$invalidate(0, class_group = $$props.class_group);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [class_group];
    }

    class ClassGroupInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { class_group: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClassGroupInfo",
    			options,
    			id: create_fragment$k.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*class_group*/ ctx[0] === undefined && !("class_group" in props)) {
    			console.warn("<ClassGroupInfo> was created without expected prop 'class_group'");
    		}
    	}

    	get class_group() {
    		throw new Error("<ClassGroupInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class_group(value) {
    		throw new Error("<ClassGroupInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Teachers.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$9 } = globals;
    const file$j = "src\\components\\Teachers.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (28:16) {#each pool as teacher}
    function create_each_block$9(ctx) {
    	let tr;
    	let td0;
    	let button;
    	let t1;
    	let td1;
    	let t2_value = /*teacher*/ ctx[7].title + "";
    	let t2;
    	let t3;
    	let td2;

    	let t4_value = (/*users*/ ctx[1][/*teacher*/ ctx[7].id]
    	? /*users*/ ctx[1][/*teacher*/ ctx[7].id].forename
    	: /*teacher*/ ctx[7].forename) + "";

    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*teacher*/ ctx[7].surname + "";
    	let t6;
    	let t7;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*teacher*/ ctx[7], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			button = element("button");
    			button.textContent = "→";
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			add_location(button, file$j, 29, 28, 978);
    			add_location(td0, file$j, 29, 24, 974);
    			add_location(td1, file$j, 30, 24, 1065);
    			add_location(td2, file$j, 31, 24, 1115);
    			add_location(td3, file$j, 32, 24, 1217);
    			add_location(tr, file$j, 28, 20, 944);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, button);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*pool*/ 8 && t2_value !== (t2_value = /*teacher*/ ctx[7].title + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*users, pool*/ 10 && t4_value !== (t4_value = (/*users*/ ctx[1][/*teacher*/ ctx[7].id]
    			? /*users*/ ctx[1][/*teacher*/ ctx[7].id].forename
    			: /*teacher*/ ctx[7].forename) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*pool*/ 8 && t6_value !== (t6_value = /*teacher*/ ctx[7].surname + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(28:16) {#each pool as teacher}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let label;
    	let t1;
    	let t2_value = /*pool*/ ctx[3].length + "";
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t5;
    	let td1;
    	let t7;
    	let td2;
    	let t9;
    	let td3;
    	let t11;
    	let tbody;
    	let mounted;
    	let dispose;
    	let each_value = /*pool*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text("Filter (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			t4 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			t5 = space();
    			td1 = element("td");
    			td1.textContent = "Title";
    			t7 = space();
    			td2 = element("td");
    			td2.textContent = "Forename";
    			t9 = space();
    			td3 = element("td");
    			td3.textContent = "Surname";
    			t11 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "name", "filter");
    			add_location(input, file$j, 13, 8, 459);
    			attr_dev(label, "for", "filter");
    			add_location(label, file$j, 14, 8, 510);
    			attr_dev(div0, "class", "selector-list-header");
    			add_location(div0, file$j, 12, 4, 415);
    			add_location(td0, file$j, 20, 20, 693);
    			add_location(td1, file$j, 21, 20, 724);
    			add_location(td2, file$j, 22, 20, 760);
    			add_location(td3, file$j, 23, 20, 799);
    			add_location(tr, file$j, 19, 16, 667);
    			add_location(thead, file$j, 18, 12, 642);
    			add_location(tbody, file$j, 26, 12, 874);
    			add_location(table, file$j, 17, 8, 621);
    			attr_dev(div1, "class", "selector-list-table");
    			add_location(div1, file$j, 16, 4, 578);
    			attr_dev(div2, "class", "selector-list");
    			add_location(div2, file$j, 11, 0, 382);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*filter*/ ctx[2]);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			append_dev(label, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t5);
    			append_dev(tr, td1);
    			append_dev(tr, t7);
    			append_dev(tr, td2);
    			append_dev(tr, t9);
    			append_dev(tr, td3);
    			append_dev(table, t11);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*filter*/ 4 && input.value !== /*filter*/ ctx[2]) {
    				set_input_value(input, /*filter*/ ctx[2]);
    			}

    			if (dirty & /*pool*/ 8 && t2_value !== (t2_value = /*pool*/ ctx[3].length + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*pool, users, selected*/ 11) {
    				each_value = /*pool*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { teachers } = $$props;
    	let { users } = $$props;
    	let { selected } = $$props;
    	let filter = "";
    	const writable_props = ["teachers", "users", "selected"];

    	Object_1$9.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Teachers> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Teachers", $$slots, []);

    	function input_input_handler() {
    		filter = this.value;
    		$$invalidate(2, filter);
    	}

    	const click_handler = teacher => $$invalidate(0, selected = teacher);

    	$$self.$set = $$props => {
    		if ("teachers" in $$props) $$invalidate(4, teachers = $$props.teachers);
    		if ("users" in $$props) $$invalidate(1, users = $$props.users);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({ teachers, users, selected, filter, pool });

    	$$self.$inject_state = $$props => {
    		if ("teachers" in $$props) $$invalidate(4, teachers = $$props.teachers);
    		if ("users" in $$props) $$invalidate(1, users = $$props.users);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("filter" in $$props) $$invalidate(2, filter = $$props.filter);
    		if ("pool" in $$props) $$invalidate(3, pool = $$props.pool);
    	};

    	let pool;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filter, teachers*/ 20) {
    			$$invalidate(3, pool = filter
    			? Object.values(teachers).filter(teacher => teacher.surname.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
    			: Object.values(teachers));
    		}

    		if ($$self.$$.dirty & /*pool*/ 8) {
    			pool.sort((a, b) => a.surname.toLowerCase().localeCompare(b.surname.toLowerCase()));
    		}
    	};

    	return [selected, users, filter, pool, teachers, input_input_handler, click_handler];
    }

    class Teachers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { teachers: 4, users: 1, selected: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Teachers",
    			options,
    			id: create_fragment$j.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*teachers*/ ctx[4] === undefined && !("teachers" in props)) {
    			console.warn("<Teachers> was created without expected prop 'teachers'");
    		}

    		if (/*users*/ ctx[1] === undefined && !("users" in props)) {
    			console.warn("<Teachers> was created without expected prop 'users'");
    		}

    		if (/*selected*/ ctx[0] === undefined && !("selected" in props)) {
    			console.warn("<Teachers> was created without expected prop 'selected'");
    		}
    	}

    	get teachers() {
    		throw new Error("<Teachers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set teachers(value) {
    		throw new Error("<Teachers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get users() {
    		throw new Error("<Teachers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set users(value) {
    		throw new Error("<Teachers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Teachers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Teachers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\TeacherInfo.svelte generated by Svelte v3.23.0 */

    const file$i = "src\\components\\TeacherInfo.svelte";

    // (6:0) {#if teacher}
    function create_if_block$a(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let br0;
    	let t0;
    	let span0;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*teacher*/ ctx[0].id + "";
    	let t4;
    	let br1;
    	let t5;
    	let t6;
    	let span2;
    	let t7;
    	let t8_value = /*teacher*/ ctx[0].title + "";
    	let t8;
    	let br2;
    	let t9;
    	let span3;
    	let t10;

    	let t11_value = (/*user*/ ctx[1]
    	? /*user*/ ctx[1].forename
    	: /*teacher*/ ctx[0].forename) + "";

    	let t11;
    	let br3;
    	let t12;
    	let span4;
    	let t13;
    	let t14_value = /*teacher*/ ctx[0].surname + "";
    	let t14;
    	let br4;
    	let t15;
    	let if_block0 = /*user*/ ctx[1] && create_if_block_2$3(ctx);
    	let if_block1 = /*user*/ ctx[1] && create_if_block_1$4(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			br0 = element("br");
    			t0 = space();
    			span0 = element("span");
    			span0.textContent = "User avatar";
    			t2 = space();
    			span1 = element("span");
    			t3 = text("ID: ");
    			t4 = text(t4_value);
    			br1 = element("br");
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			span2 = element("span");
    			t7 = text("Title: ");
    			t8 = text(t8_value);
    			br2 = element("br");
    			t9 = space();
    			span3 = element("span");
    			t10 = text("Forename: ");
    			t11 = text(t11_value);
    			br3 = element("br");
    			t12 = space();
    			span4 = element("span");
    			t13 = text("Surname: ");
    			t14 = text(t14_value);
    			br4 = element("br");
    			t15 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(img, "class", "avatar");
    			if (img.src !== (img_src_value = (/*user*/ ctx[1] ? /*user*/ ctx[1].avatar : null) || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "avatar");
    			attr_dev(img, "width", "96");
    			attr_dev(img, "height", "96");
    			add_location(img, file$i, 8, 12, 182);
    			add_location(br0, file$i, 8, 165, 335);
    			add_location(span0, file$i, 9, 12, 353);
    			set_style(div0, "float", "right");
    			set_style(div0, "text-align", "right");
    			add_location(div0, file$i, 7, 8, 125);
    			add_location(span1, file$i, 11, 8, 403);
    			add_location(br1, file$i, 11, 37, 432);
    			add_location(span2, file$i, 15, 8, 535);
    			add_location(br2, file$i, 15, 43, 570);
    			add_location(span3, file$i, 16, 8, 584);
    			add_location(br3, file$i, 16, 72, 648);
    			add_location(span4, file$i, 17, 8, 662);
    			add_location(br4, file$i, 17, 47, 701);
    			set_style(div1, "padding", "4px");
    			add_location(div1, file$i, 6, 4, 89);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, br0);
    			append_dev(div0, t0);
    			append_dev(div0, span0);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(div1, br1);
    			append_dev(div1, t5);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t6);
    			append_dev(div1, span2);
    			append_dev(span2, t7);
    			append_dev(span2, t8);
    			append_dev(div1, br2);
    			append_dev(div1, t9);
    			append_dev(div1, span3);
    			append_dev(span3, t10);
    			append_dev(span3, t11);
    			append_dev(div1, br3);
    			append_dev(div1, t12);
    			append_dev(div1, span4);
    			append_dev(span4, t13);
    			append_dev(span4, t14);
    			append_dev(div1, br4);
    			append_dev(div1, t15);
    			if (if_block1) if_block1.m(div1, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*user*/ 2 && img.src !== (img_src_value = (/*user*/ ctx[1] ? /*user*/ ctx[1].avatar : null) || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*teacher*/ 1 && t4_value !== (t4_value = /*teacher*/ ctx[0].id + "")) set_data_dev(t4, t4_value);

    			if (/*user*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$3(ctx);
    					if_block0.c();
    					if_block0.m(div1, t6);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*teacher*/ 1 && t8_value !== (t8_value = /*teacher*/ ctx[0].title + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*user, teacher*/ 3 && t11_value !== (t11_value = (/*user*/ ctx[1]
    			? /*user*/ ctx[1].forename
    			: /*teacher*/ ctx[0].forename) + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*teacher*/ 1 && t14_value !== (t14_value = /*teacher*/ ctx[0].surname + "")) set_data_dev(t14, t14_value);

    			if (/*user*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$4(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(6:0) {#if teacher}",
    		ctx
    	});

    	return block;
    }

    // (13:8) {#if user}
    function create_if_block_2$3(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*user*/ ctx[1].sims_id + "";
    	let t1;
    	let br;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Sims ID: ");
    			t1 = text(t1_value);
    			br = element("br");
    			add_location(span, file$i, 13, 12, 470);
    			add_location(br, file$i, 13, 48, 506);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*user*/ 2 && t1_value !== (t1_value = /*user*/ ctx[1].sims_id + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(13:8) {#if user}",
    		ctx
    	});

    	return block;
    }

    // (19:8) {#if user}
    function create_if_block_1$4(ctx) {
    	let span;
    	let t0;
    	let t1_value = new Date(/*user*/ ctx[1].created_at).toLocaleDateString() + "";
    	let t1;
    	let br;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("Joined at: ");
    			t1 = text(t1_value);
    			br = element("br");
    			add_location(span, file$i, 19, 12, 739);
    			add_location(br, file$i, 19, 84, 811);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*user*/ 2 && t1_value !== (t1_value = new Date(/*user*/ ctx[1].created_at).toLocaleDateString() + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(19:8) {#if user}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let if_block_anchor;
    	let if_block = /*teacher*/ ctx[0] && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*teacher*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { teacher } = $$props;
    	let { user } = $$props;
    	const writable_props = ["teacher", "user"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TeacherInfo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TeacherInfo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("teacher" in $$props) $$invalidate(0, teacher = $$props.teacher);
    		if ("user" in $$props) $$invalidate(1, user = $$props.user);
    	};

    	$$self.$capture_state = () => ({ teacher, user });

    	$$self.$inject_state = $$props => {
    		if ("teacher" in $$props) $$invalidate(0, teacher = $$props.teacher);
    		if ("user" in $$props) $$invalidate(1, user = $$props.user);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [teacher, user];
    }

    class TeacherInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { teacher: 0, user: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TeacherInfo",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*teacher*/ ctx[0] === undefined && !("teacher" in props)) {
    			console.warn("<TeacherInfo> was created without expected prop 'teacher'");
    		}

    		if (/*user*/ ctx[1] === undefined && !("user" in props)) {
    			console.warn("<TeacherInfo> was created without expected prop 'user'");
    		}
    	}

    	get teacher() {
    		throw new Error("<TeacherInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set teacher(value) {
    		throw new Error("<TeacherInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get user() {
    		throw new Error("<TeacherInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set user(value) {
    		throw new Error("<TeacherInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Tasks.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$8 } = globals;
    const file$h = "src\\components\\Tasks.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[26] = list;
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (97:24) {:else}
    function create_else_block$1(ctx) {
    	let td0;
    	let t0_value = new Date(/*task*/ ctx[25].due_on).toLocaleDateString() + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*task*/ ctx[25].class_group_name + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*task*/ ctx[25].subject + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*task*/ ctx[25].teacher_name + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*task*/ ctx[25].class_task_title + "";
    	let t8;

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			add_location(td0, file$h, 97, 28, 4484);
    			add_location(td1, file$h, 98, 28, 4567);
    			add_location(td2, file$h, 99, 28, 4629);
    			add_location(td3, file$h, 100, 28, 4682);
    			add_location(td4, file$h, 101, 28, 4740);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			append_dev(td0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, td1, anchor);
    			append_dev(td1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, td2, anchor);
    			append_dev(td2, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, td3, anchor);
    			append_dev(td3, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, td4, anchor);
    			append_dev(td4, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pool*/ 128 && t0_value !== (t0_value = new Date(/*task*/ ctx[25].due_on).toLocaleDateString() + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*pool*/ 128 && t2_value !== (t2_value = /*task*/ ctx[25].class_group_name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*pool*/ 128 && t4_value !== (t4_value = /*task*/ ctx[25].subject + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*pool*/ 128 && t6_value !== (t6_value = /*task*/ ctx[25].teacher_name + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*pool*/ 128 && t8_value !== (t8_value = /*task*/ ctx[25].class_task_title + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(td1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(td2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(td3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(td4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(97:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (91:24) {#if task.completed}
    function create_if_block$9(ctx) {
    	let td0;
    	let s0;
    	let t0_value = new Date(/*task*/ ctx[25].due_on).toLocaleDateString() + "";
    	let t0;
    	let t1;
    	let td1;
    	let s1;
    	let t2_value = /*task*/ ctx[25].class_group_name + "";
    	let t2;
    	let t3;
    	let td2;
    	let s2;
    	let t4_value = /*task*/ ctx[25].subject + "";
    	let t4;
    	let t5;
    	let td3;
    	let s3;
    	let t6_value = /*task*/ ctx[25].teacher_name + "";
    	let t6;
    	let t7;
    	let td4;
    	let s4;
    	let t8_value = /*task*/ ctx[25].class_task_title + "";
    	let t8;

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			s0 = element("s");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			s1 = element("s");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			s2 = element("s");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			s3 = element("s");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			s4 = element("s");
    			t8 = text(t8_value);
    			add_location(s0, file$h, 91, 32, 4102);
    			add_location(td0, file$h, 91, 28, 4098);
    			add_location(s1, file$h, 92, 32, 4192);
    			add_location(td1, file$h, 92, 28, 4188);
    			add_location(s2, file$h, 93, 32, 4261);
    			add_location(td2, file$h, 93, 28, 4257);
    			add_location(s3, file$h, 94, 32, 4321);
    			add_location(td3, file$h, 94, 28, 4317);
    			add_location(s4, file$h, 95, 32, 4386);
    			add_location(td4, file$h, 95, 28, 4382);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			append_dev(td0, s0);
    			append_dev(s0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, td1, anchor);
    			append_dev(td1, s1);
    			append_dev(s1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, td2, anchor);
    			append_dev(td2, s2);
    			append_dev(s2, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, td3, anchor);
    			append_dev(td3, s3);
    			append_dev(s3, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, td4, anchor);
    			append_dev(td4, s4);
    			append_dev(s4, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pool*/ 128 && t0_value !== (t0_value = new Date(/*task*/ ctx[25].due_on).toLocaleDateString() + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*pool*/ 128 && t2_value !== (t2_value = /*task*/ ctx[25].class_group_name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*pool*/ 128 && t4_value !== (t4_value = /*task*/ ctx[25].subject + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*pool*/ 128 && t6_value !== (t6_value = /*task*/ ctx[25].teacher_name + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*pool*/ 128 && t8_value !== (t8_value = /*task*/ ctx[25].class_task_title + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(td1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(td2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(td3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(td4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(91:24) {#if task.completed}",
    		ctx
    	});

    	return block;
    }

    // (87:16) {#each pool as task, i}
    function create_each_block$8(ctx) {
    	let tr;
    	let td0;
    	let button;
    	let t1;
    	let td1;
    	let input;
    	let t2;
    	let t3;
    	let tr_class_value;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[22](/*task*/ ctx[25], ...args);
    	}

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[23].call(input, /*task*/ ctx[25]);
    	}

    	function change_handler_1(...args) {
    		return /*change_handler_1*/ ctx[24](/*task*/ ctx[25], ...args);
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*task*/ ctx[25].completed) return create_if_block$9;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			button = element("button");
    			button.textContent = "→";
    			t1 = space();
    			td1 = element("td");
    			input = element("input");
    			t2 = space();
    			if_block.c();
    			t3 = space();
    			add_location(button, file$h, 88, 28, 3822);
    			add_location(td0, file$h, 88, 24, 3818);
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$h, 89, 28, 3910);
    			add_location(td1, file$h, 89, 24, 3906);

    			attr_dev(tr, "class", tr_class_value = "task-" + /*task*/ ctx[25].class_task_type.toLowerCase() + (!/*show_past*/ ctx[6] && /*pool*/ ctx[7][/*i*/ ctx[27] + 1] && isoverdue(/*task*/ ctx[25]) && !isoverdue(/*pool*/ ctx[7][/*i*/ ctx[27] + 1])
    			? " task-separator"
    			: "") + " svelte-1d36sq");

    			add_location(tr, file$h, 87, 20, 3640);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, button);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, input);
    			input.checked = /*task*/ ctx[25].completed;
    			append_dev(tr, t2);
    			if_block.m(tr, null);
    			append_dev(tr, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", click_handler, false, false, false),
    					listen_dev(input, "change", input_change_handler),
    					listen_dev(input, "change", change_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pool*/ 128) {
    				input.checked = /*task*/ ctx[25].completed;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(tr, t3);
    				}
    			}

    			if (dirty & /*pool, show_past*/ 192 && tr_class_value !== (tr_class_value = "task-" + /*task*/ ctx[25].class_task_type.toLowerCase() + (!/*show_past*/ ctx[6] && /*pool*/ ctx[7][/*i*/ ctx[27] + 1] && isoverdue(/*task*/ ctx[25]) && !isoverdue(/*pool*/ ctx[7][/*i*/ ctx[27] + 1])
    			? " task-separator"
    			: "") + " svelte-1d36sq")) {
    				attr_dev(tr, "class", tr_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(87:16) {#each pool as task, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div2;
    	let div0;
    	let fieldset;
    	let legend;
    	let t0;
    	let t1_value = /*pool*/ ctx[7].length + "";
    	let t1;
    	let t2;
    	let t3;
    	let input0;
    	let t4;
    	let label0;
    	let br0;
    	let t6;
    	let input1;
    	let t7;
    	let label1;
    	let br1;
    	let t9;
    	let input2;
    	let t10;
    	let label2;
    	let br2;
    	let br3;
    	let t12;
    	let input3;
    	let t13;
    	let label3;
    	let t15;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let br4;
    	let br5;
    	let t21;
    	let input4;
    	let t22;
    	let label4;
    	let t24;
    	let input5;
    	let t25;
    	let label5;
    	let br6;
    	let t27;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t28;
    	let td1;
    	let t29;
    	let td2;
    	let t31;
    	let td3;
    	let t33;
    	let td4;
    	let t35;
    	let td5;
    	let t37;
    	let td6;
    	let t39;
    	let tbody;
    	let mounted;
    	let dispose;
    	let each_value = /*pool*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			fieldset = element("fieldset");
    			legend = element("legend");
    			t0 = text("Filter (");
    			t1 = text(t1_value);
    			t2 = text(")");
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label0 = element("label");
    			label0.textContent = "Filter";
    			br0 = element("br");
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			label1 = element("label");
    			label1.textContent = "Match description?";
    			br1 = element("br");
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			label2 = element("label");
    			label2.textContent = "Class group";
    			br2 = element("br");
    			br3 = element("br");
    			t12 = space();
    			input3 = element("input");
    			t13 = space();
    			label3 = element("label");
    			label3.textContent = "Subject";
    			t15 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "All";
    			option1 = element("option");
    			option1.textContent = "Homeworks";
    			option2 = element("option");
    			option2.textContent = "Flexible Tasks";
    			option3 = element("option");
    			option3.textContent = "Quizzes";
    			option4 = element("option");
    			option4.textContent = "Spelling Tests";
    			br4 = element("br");
    			br5 = element("br");
    			t21 = space();
    			input4 = element("input");
    			t22 = space();
    			label4 = element("label");
    			label4.textContent = "Teacher";
    			t24 = space();
    			input5 = element("input");
    			t25 = space();
    			label5 = element("label");
    			label5.textContent = "Show past?";
    			br6 = element("br");
    			t27 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			t28 = space();
    			td1 = element("td");
    			t29 = space();
    			td2 = element("td");
    			td2.textContent = "Due on";
    			t31 = space();
    			td3 = element("td");
    			td3.textContent = "Class group";
    			t33 = space();
    			td4 = element("td");
    			td4.textContent = "Subject";
    			t35 = space();
    			td5 = element("td");
    			td5.textContent = "Teacher";
    			t37 = space();
    			td6 = element("td");
    			td6.textContent = "Title";
    			t39 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(legend, file$h, 56, 12, 1973);
    			attr_dev(input0, "name", "filter");
    			add_location(input0, file$h, 57, 12, 2026);
    			attr_dev(label0, "for", "filter");
    			add_location(label0, file$h, 57, 53, 2067);
    			add_location(br0, file$h, 57, 87, 2101);
    			attr_dev(input1, "type", "checkbox");
    			attr_dev(input1, "name", "description");
    			add_location(input1, file$h, 58, 12, 2119);
    			attr_dev(label1, "for", "description");
    			add_location(label1, file$h, 58, 82, 2189);
    			add_location(br1, file$h, 58, 133, 2240);
    			attr_dev(input2, "name", "class-group");
    			add_location(input2, file$h, 59, 12, 2258);
    			attr_dev(label2, "for", "class-group");
    			add_location(label2, file$h, 59, 64, 2310);
    			add_location(br2, file$h, 59, 108, 2354);
    			add_location(br3, file$h, 59, 112, 2358);
    			attr_dev(input3, "name", "subject");
    			add_location(input3, file$h, 60, 12, 2376);
    			attr_dev(label3, "for", "subject");
    			add_location(label3, file$h, 60, 56, 2420);
    			option0.selected = true;
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file$h, 62, 16, 2575);
    			option1.__value = "Homework";
    			option1.value = option1.__value;
    			add_location(option1, file$h, 63, 16, 2638);
    			option2.__value = "FlexibleTask";
    			option2.value = option2.__value;
    			add_location(option2, file$h, 64, 16, 2699);
    			option3.__value = "Quiz";
    			option3.value = option3.__value;
    			add_location(option3, file$h, 65, 16, 2769);
    			option4.__value = "SpellingTest";
    			option4.value = option4.__value;
    			add_location(option4, file$h, 66, 16, 2824);
    			add_location(select, file$h, 61, 12, 2470);
    			add_location(br4, file$h, 67, 21, 2899);
    			add_location(br5, file$h, 67, 25, 2903);
    			attr_dev(input4, "name", "teacher");
    			add_location(input4, file$h, 68, 12, 2921);
    			attr_dev(label4, "for", "teacher");
    			add_location(label4, file$h, 68, 56, 2965);
    			attr_dev(input5, "type", "checkbox");
    			attr_dev(input5, "name", "show-past");
    			add_location(input5, file$h, 69, 12, 3015);
    			attr_dev(label5, "for", "show-past");
    			add_location(label5, file$h, 69, 78, 3081);
    			add_location(br6, file$h, 69, 119, 3122);
    			add_location(fieldset, file$h, 55, 8, 1949);
    			attr_dev(div0, "class", "selector-list-header");
    			add_location(div0, file$h, 54, 4, 1905);
    			add_location(td0, file$h, 76, 20, 3280);
    			add_location(td1, file$h, 77, 20, 3311);
    			add_location(td2, file$h, 78, 20, 3342);
    			add_location(td3, file$h, 79, 20, 3379);
    			add_location(td4, file$h, 80, 20, 3421);
    			add_location(td5, file$h, 81, 20, 3459);
    			add_location(td6, file$h, 82, 20, 3497);
    			add_location(tr, file$h, 75, 16, 3254);
    			add_location(thead, file$h, 74, 12, 3229);
    			add_location(tbody, file$h, 85, 12, 3570);
    			add_location(table, file$h, 73, 8, 3208);
    			attr_dev(div1, "class", "selector-list-table");
    			add_location(div1, file$h, 72, 4, 3165);
    			attr_dev(div2, "class", "selector-list");
    			add_location(div2, file$h, 53, 0, 1872);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, fieldset);
    			append_dev(fieldset, legend);
    			append_dev(legend, t0);
    			append_dev(legend, t1);
    			append_dev(legend, t2);
    			append_dev(fieldset, t3);
    			append_dev(fieldset, input0);
    			set_input_value(input0, /*title*/ ctx[0]);
    			append_dev(fieldset, t4);
    			append_dev(fieldset, label0);
    			append_dev(fieldset, br0);
    			append_dev(fieldset, t6);
    			append_dev(fieldset, input1);
    			input1.checked = /*description*/ ctx[1];
    			append_dev(fieldset, t7);
    			append_dev(fieldset, label1);
    			append_dev(fieldset, br1);
    			append_dev(fieldset, t9);
    			append_dev(fieldset, input2);
    			set_input_value(input2, /*class_group*/ ctx[2]);
    			append_dev(fieldset, t10);
    			append_dev(fieldset, label2);
    			append_dev(fieldset, br2);
    			append_dev(fieldset, br3);
    			append_dev(fieldset, t12);
    			append_dev(fieldset, input3);
    			set_input_value(input3, /*subject*/ ctx[3]);
    			append_dev(fieldset, t13);
    			append_dev(fieldset, label3);
    			append_dev(fieldset, t15);
    			append_dev(fieldset, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(fieldset, br4);
    			append_dev(fieldset, br5);
    			append_dev(fieldset, t21);
    			append_dev(fieldset, input4);
    			set_input_value(input4, /*teacher*/ ctx[5]);
    			append_dev(fieldset, t22);
    			append_dev(fieldset, label4);
    			append_dev(fieldset, t24);
    			append_dev(fieldset, input5);
    			input5.checked = /*show_past*/ ctx[6];
    			append_dev(fieldset, t25);
    			append_dev(fieldset, label5);
    			append_dev(fieldset, br6);
    			append_dev(div2, t27);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t28);
    			append_dev(tr, td1);
    			append_dev(tr, t29);
    			append_dev(tr, td2);
    			append_dev(tr, t31);
    			append_dev(tr, td3);
    			append_dev(tr, t33);
    			append_dev(tr, td4);
    			append_dev(tr, t35);
    			append_dev(tr, td5);
    			append_dev(tr, t37);
    			append_dev(tr, td6);
    			append_dev(table, t39);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[15]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[16]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[17]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[18]),
    					listen_dev(select, "blur", /*blur_handler*/ ctx[14], false, false, false),
    					listen_dev(select, "change", /*change_handler*/ ctx[19], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[20]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[21])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pool*/ 128 && t1_value !== (t1_value = /*pool*/ ctx[7].length + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*title*/ 1 && input0.value !== /*title*/ ctx[0]) {
    				set_input_value(input0, /*title*/ ctx[0]);
    			}

    			if (dirty & /*description*/ 2) {
    				input1.checked = /*description*/ ctx[1];
    			}

    			if (dirty & /*class_group*/ 4 && input2.value !== /*class_group*/ ctx[2]) {
    				set_input_value(input2, /*class_group*/ ctx[2]);
    			}

    			if (dirty & /*subject*/ 8 && input3.value !== /*subject*/ ctx[3]) {
    				set_input_value(input3, /*subject*/ ctx[3]);
    			}

    			if (dirty & /*teacher*/ 32 && input4.value !== /*teacher*/ ctx[5]) {
    				set_input_value(input4, /*teacher*/ ctx[5]);
    			}

    			if (dirty & /*show_past*/ 64) {
    				input5.checked = /*show_past*/ ctx[6];
    			}

    			if (dirty & /*pool, show_past, isoverdue, Date, select_task*/ 448) {
    				each_value = /*pool*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isoverdue(task) {
    	return task.due_on + 86400000 < Date.now();
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { tasks } = $$props;
    	let { selected } = $$props;
    	let title = "";
    	let regex = false;
    	let description = false;
    	let class_group = "";
    	let subject = "";
    	let type = "";
    	let teacher = "";
    	let show_past = false;
    	let pool = [];

    	function update() {
    		$$invalidate(7, pool = show_past
    		? Object.values(tasks)
    		: Object.values(tasks).filter(task => !task.completed || task.due_on + 86400000 > Date.now()));

    		if (title) {
    			if (description) {
    				$$invalidate(7, pool = pool.filter(task => (task.class_task_title.toLowerCase() + (task.description
    				? " " + task.description.toLowerCase()
    				: "")).indexOf(title.toLowerCase()) !== -1));
    			} else {
    				$$invalidate(7, pool = pool.filter(task => task.class_task_title.toLowerCase().indexOf(title.toLowerCase()) !== -1));
    			}
    		}

    		$$invalidate(7, pool = class_group
    		? pool.filter(task => task.class_group_name.toLowerCase().indexOf(class_group.toLowerCase()) !== -1)
    		: pool);

    		$$invalidate(7, pool = subject
    		? pool.filter(task => task.subject.toLowerCase().indexOf(subject.toLowerCase()) !== -1)
    		: pool);

    		$$invalidate(7, pool = type
    		? pool.filter(task => task.class_task_type === type)
    		: pool);

    		$$invalidate(7, pool = teacher
    		? pool.filter(task => task.teacher_name.toLowerCase().indexOf(teacher.toLowerCase()) !== -1)
    		: pool);

    		pool.sort((a, b) => a.due_on - b.due_on);
    	}

    	const dispatch = createEventDispatcher();

    	function select_task(task) {
    		$$invalidate(9, selected = task);
    		dispatch("select_task", { task });
    	}

    	const writable_props = ["tasks", "selected"];

    	Object_1$8.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tasks> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tasks", $$slots, []);

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function input0_input_handler() {
    		title = this.value;
    		$$invalidate(0, title);
    	}

    	function input1_change_handler() {
    		description = this.checked;
    		$$invalidate(1, description);
    	}

    	function input2_input_handler() {
    		class_group = this.value;
    		$$invalidate(2, class_group);
    	}

    	function input3_input_handler() {
    		subject = this.value;
    		$$invalidate(3, subject);
    	}

    	const change_handler = e => $$invalidate(4, type = e.target.options[e.target.selectedIndex].value);

    	function input4_input_handler() {
    		teacher = this.value;
    		$$invalidate(5, teacher);
    	}

    	function input5_change_handler() {
    		show_past = this.checked;
    		$$invalidate(6, show_past);
    	}

    	const click_handler = task => select_task(task);

    	function input_change_handler(task) {
    		task.completed = this.checked;
    		$$invalidate(7, pool);
    	}

    	const change_handler_1 = (task, e) => task.setCompleted(e.target.checked);

    	$$self.$set = $$props => {
    		if ("tasks" in $$props) $$invalidate(10, tasks = $$props.tasks);
    		if ("selected" in $$props) $$invalidate(9, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		tasks,
    		selected,
    		title,
    		regex,
    		description,
    		class_group,
    		subject,
    		type,
    		teacher,
    		show_past,
    		pool,
    		isoverdue,
    		update,
    		dispatch,
    		select_task
    	});

    	$$self.$inject_state = $$props => {
    		if ("tasks" in $$props) $$invalidate(10, tasks = $$props.tasks);
    		if ("selected" in $$props) $$invalidate(9, selected = $$props.selected);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("regex" in $$props) $$invalidate(11, regex = $$props.regex);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("class_group" in $$props) $$invalidate(2, class_group = $$props.class_group);
    		if ("subject" in $$props) $$invalidate(3, subject = $$props.subject);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("teacher" in $$props) $$invalidate(5, teacher = $$props.teacher);
    		if ("show_past" in $$props) $$invalidate(6, show_past = $$props.show_past);
    		if ("pool" in $$props) $$invalidate(7, pool = $$props.pool);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*tasks, title, description, class_group, subject, type, teacher, show_past*/ 1151) {
    			if (tasks || title || regex || description || class_group || subject || type || teacher || show_past || 1) update();
    		}
    	};

    	return [
    		title,
    		description,
    		class_group,
    		subject,
    		type,
    		teacher,
    		show_past,
    		pool,
    		select_task,
    		selected,
    		tasks,
    		regex,
    		update,
    		dispatch,
    		blur_handler,
    		input0_input_handler,
    		input1_change_handler,
    		input2_input_handler,
    		input3_input_handler,
    		change_handler,
    		input4_input_handler,
    		input5_change_handler,
    		click_handler,
    		input_change_handler,
    		change_handler_1
    	];
    }

    class Tasks extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { tasks: 10, selected: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tasks",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tasks*/ ctx[10] === undefined && !("tasks" in props)) {
    			console.warn("<Tasks> was created without expected prop 'tasks'");
    		}

    		if (/*selected*/ ctx[9] === undefined && !("selected" in props)) {
    			console.warn("<Tasks> was created without expected prop 'selected'");
    		}
    	}

    	get tasks() {
    		throw new Error("<Tasks>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tasks(value) {
    		throw new Error("<Tasks>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Tasks>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Tasks>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\MainDash.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$7 } = globals;
    const file$g = "src\\pages\\MainDash.svelte";

    function create_fragment$g(ctx) {
    	let div10;
    	let div1;
    	let div0;
    	let span0;
    	let t1;
    	let updating_selected;
    	let t2;
    	let div5;
    	let div2;
    	let span1;
    	let t4;
    	let updating_selected_1;
    	let t5;
    	let div4;
    	let div3;
    	let span2;
    	let t7;
    	let t8;
    	let div9;
    	let div6;
    	let span3;
    	let t10;
    	let updating_selected_2;
    	let t11;
    	let div8;
    	let div7;
    	let span4;
    	let t13;
    	let current;

    	function tasks_selected_binding(value) {
    		/*tasks_selected_binding*/ ctx[8].call(null, value);
    	}

    	let tasks_props = { tasks: /*_cache*/ ctx[1].tasks };

    	if (/*selected_task*/ ctx[0] !== void 0) {
    		tasks_props.selected = /*selected_task*/ ctx[0];
    	}

    	const tasks = new Tasks({ props: tasks_props, $$inline: true });
    	binding_callbacks.push(() => bind(tasks, "selected", tasks_selected_binding));
    	tasks.$on("select_task", /*select_task*/ ctx[5]);

    	function teachers_selected_binding(value) {
    		/*teachers_selected_binding*/ ctx[9].call(null, value);
    	}

    	let teachers_props = {
    		teachers: /*_cache*/ ctx[1].own_teachers,
    		users: Object.values(/*_cache*/ ctx[1].users)
    	};

    	if (/*selected_teacher*/ ctx[3] !== void 0) {
    		teachers_props.selected = /*selected_teacher*/ ctx[3];
    	}

    	const teachers = new Teachers({ props: teachers_props, $$inline: true });
    	binding_callbacks.push(() => bind(teachers, "selected", teachers_selected_binding));

    	const teacherinfo = new TeacherInfo({
    			props: {
    				teacher: /*selected_teacher*/ ctx[3],
    				user: /*selected_teacher_user*/ ctx[4]
    			},
    			$$inline: true
    		});

    	function classgroups_selected_binding(value) {
    		/*classgroups_selected_binding*/ ctx[10].call(null, value);
    	}

    	let classgroups_props = {
    		class_groups: /*_cache*/ ctx[1].class_groups
    	};

    	if (/*selected_class_group*/ ctx[2] !== void 0) {
    		classgroups_props.selected = /*selected_class_group*/ ctx[2];
    	}

    	const classgroups = new ClassGroups({ props: classgroups_props, $$inline: true });
    	binding_callbacks.push(() => bind(classgroups, "selected", classgroups_selected_binding));

    	const classgroupinfo = new ClassGroupInfo({
    			props: {
    				class_group: /*selected_class_group*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Tasks";
    			t1 = space();
    			create_component(tasks.$$.fragment);
    			t2 = space();
    			div5 = element("div");
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "Teachers";
    			t4 = space();
    			create_component(teachers.$$.fragment);
    			t5 = space();
    			div4 = element("div");
    			div3 = element("div");
    			span2 = element("span");
    			span2.textContent = "Selected";
    			t7 = space();
    			create_component(teacherinfo.$$.fragment);
    			t8 = space();
    			div9 = element("div");
    			div6 = element("div");
    			span3 = element("span");
    			span3.textContent = "Class Groups";
    			t10 = space();
    			create_component(classgroups.$$.fragment);
    			t11 = space();
    			div8 = element("div");
    			div7 = element("div");
    			span4 = element("span");
    			span4.textContent = "Selected";
    			t13 = space();
    			create_component(classgroupinfo.$$.fragment);
    			add_location(span0, file$g, 34, 12, 1000);
    			attr_dev(div0, "class", "page-content-title");
    			add_location(div0, file$g, 33, 8, 954);
    			attr_dev(div1, "class", "page-section column svelte-azmzo5");
    			attr_dev(div1, "id", "section-tasks");
    			add_location(div1, file$g, 32, 4, 892);
    			add_location(span1, file$g, 40, 12, 1261);
    			attr_dev(div2, "class", "page-content-title");
    			add_location(div2, file$g, 39, 8, 1215);
    			add_location(span2, file$g, 45, 16, 1519);
    			attr_dev(div3, "class", "page-content-title");
    			add_location(div3, file$g, 44, 12, 1469);
    			attr_dev(div4, "class", "page-content");
    			add_location(div4, file$g, 43, 8, 1429);
    			attr_dev(div5, "class", "page-section column svelte-azmzo5");
    			attr_dev(div5, "id", "section-teachers");
    			add_location(div5, file$g, 38, 4, 1150);
    			add_location(span3, file$g, 52, 12, 1788);
    			attr_dev(div6, "class", "page-content-title");
    			add_location(div6, file$g, 51, 8, 1742);
    			add_location(span4, file$g, 57, 16, 2025);
    			attr_dev(div7, "class", "page-content-title");
    			add_location(div7, file$g, 56, 12, 1975);
    			attr_dev(div8, "class", "page-content");
    			add_location(div8, file$g, 55, 8, 1935);
    			attr_dev(div9, "class", "page-section column svelte-azmzo5");
    			attr_dev(div9, "id", "section-classes");
    			add_location(div9, file$g, 50, 4, 1678);
    			attr_dev(div10, "class", "page svelte-azmzo5");
    			attr_dev(div10, "id", "page-main-dash");
    			add_location(div10, file$g, 31, 0, 848);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(div1, t1);
    			mount_component(tasks, div1, null);
    			append_dev(div10, t2);
    			append_dev(div10, div5);
    			append_dev(div5, div2);
    			append_dev(div2, span1);
    			append_dev(div5, t4);
    			mount_component(teachers, div5, null);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, span2);
    			append_dev(div4, t7);
    			mount_component(teacherinfo, div4, null);
    			append_dev(div10, t8);
    			append_dev(div10, div9);
    			append_dev(div9, div6);
    			append_dev(div6, span3);
    			append_dev(div9, t10);
    			mount_component(classgroups, div9, null);
    			append_dev(div9, t11);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, span4);
    			append_dev(div8, t13);
    			mount_component(classgroupinfo, div8, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tasks_changes = {};
    			if (dirty & /*_cache*/ 2) tasks_changes.tasks = /*_cache*/ ctx[1].tasks;

    			if (!updating_selected && dirty & /*selected_task*/ 1) {
    				updating_selected = true;
    				tasks_changes.selected = /*selected_task*/ ctx[0];
    				add_flush_callback(() => updating_selected = false);
    			}

    			tasks.$set(tasks_changes);
    			const teachers_changes = {};
    			if (dirty & /*_cache*/ 2) teachers_changes.teachers = /*_cache*/ ctx[1].own_teachers;
    			if (dirty & /*_cache*/ 2) teachers_changes.users = Object.values(/*_cache*/ ctx[1].users);

    			if (!updating_selected_1 && dirty & /*selected_teacher*/ 8) {
    				updating_selected_1 = true;
    				teachers_changes.selected = /*selected_teacher*/ ctx[3];
    				add_flush_callback(() => updating_selected_1 = false);
    			}

    			teachers.$set(teachers_changes);
    			const teacherinfo_changes = {};
    			if (dirty & /*selected_teacher*/ 8) teacherinfo_changes.teacher = /*selected_teacher*/ ctx[3];
    			if (dirty & /*selected_teacher_user*/ 16) teacherinfo_changes.user = /*selected_teacher_user*/ ctx[4];
    			teacherinfo.$set(teacherinfo_changes);
    			const classgroups_changes = {};
    			if (dirty & /*_cache*/ 2) classgroups_changes.class_groups = /*_cache*/ ctx[1].class_groups;

    			if (!updating_selected_2 && dirty & /*selected_class_group*/ 4) {
    				updating_selected_2 = true;
    				classgroups_changes.selected = /*selected_class_group*/ ctx[2];
    				add_flush_callback(() => updating_selected_2 = false);
    			}

    			classgroups.$set(classgroups_changes);
    			const classgroupinfo_changes = {};
    			if (dirty & /*selected_class_group*/ 4) classgroupinfo_changes.class_group = /*selected_class_group*/ ctx[2];
    			classgroupinfo.$set(classgroupinfo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tasks.$$.fragment, local);
    			transition_in(teachers.$$.fragment, local);
    			transition_in(teacherinfo.$$.fragment, local);
    			transition_in(classgroups.$$.fragment, local);
    			transition_in(classgroupinfo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tasks.$$.fragment, local);
    			transition_out(teachers.$$.fragment, local);
    			transition_out(teacherinfo.$$.fragment, local);
    			transition_out(classgroups.$$.fragment, local);
    			transition_out(classgroupinfo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			destroy_component(tasks);
    			destroy_component(teachers);
    			destroy_component(teacherinfo);
    			destroy_component(classgroups);
    			destroy_component(classgroupinfo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { _cache } = $$props;
    	let { client } = $$props;
    	let selected_class_group = null;
    	let selected_teacher = null;
    	let { selected_task } = $$props;
    	const dispatch = createEventDispatcher();

    	function select_task(task) {
    		dispatch("select_task", { task });
    	}

    	const writable_props = ["_cache", "client", "selected_task"];

    	Object_1$7.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MainDash> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("MainDash", $$slots, []);

    	function tasks_selected_binding(value) {
    		selected_task = value;
    		$$invalidate(0, selected_task);
    	}

    	function teachers_selected_binding(value) {
    		selected_teacher = value;
    		$$invalidate(3, selected_teacher);
    	}

    	function classgroups_selected_binding(value) {
    		selected_class_group = value;
    		$$invalidate(2, selected_class_group);
    	}

    	$$self.$set = $$props => {
    		if ("_cache" in $$props) $$invalidate(1, _cache = $$props._cache);
    		if ("client" in $$props) $$invalidate(6, client = $$props.client);
    		if ("selected_task" in $$props) $$invalidate(0, selected_task = $$props.selected_task);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		_cache,
    		client,
    		ClassGroups,
    		ClassGroupInfo,
    		Teachers,
    		TeacherInfo,
    		Tasks,
    		selected_class_group,
    		selected_teacher,
    		selected_task,
    		dispatch,
    		select_task,
    		selected_teacher_user
    	});

    	$$self.$inject_state = $$props => {
    		if ("_cache" in $$props) $$invalidate(1, _cache = $$props._cache);
    		if ("client" in $$props) $$invalidate(6, client = $$props.client);
    		if ("selected_class_group" in $$props) $$invalidate(2, selected_class_group = $$props.selected_class_group);
    		if ("selected_teacher" in $$props) $$invalidate(3, selected_teacher = $$props.selected_teacher);
    		if ("selected_task" in $$props) $$invalidate(0, selected_task = $$props.selected_task);
    		if ("selected_teacher_user" in $$props) $$invalidate(4, selected_teacher_user = $$props.selected_teacher_user);
    	};

    	let selected_teacher_user;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selected_teacher, _cache*/ 10) {
    			$$invalidate(4, selected_teacher_user = selected_teacher
    			? _cache.users[selected_teacher.id]
    			: null);
    		}
    	};

    	return [
    		selected_task,
    		_cache,
    		selected_class_group,
    		selected_teacher,
    		selected_teacher_user,
    		select_task,
    		client,
    		dispatch,
    		tasks_selected_binding,
    		teachers_selected_binding,
    		classgroups_selected_binding
    	];
    }

    class MainDash extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { _cache: 1, client: 6, selected_task: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MainDash",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*_cache*/ ctx[1] === undefined && !("_cache" in props)) {
    			console.warn("<MainDash> was created without expected prop '_cache'");
    		}

    		if (/*client*/ ctx[6] === undefined && !("client" in props)) {
    			console.warn("<MainDash> was created without expected prop 'client'");
    		}

    		if (/*selected_task*/ ctx[0] === undefined && !("selected_task" in props)) {
    			console.warn("<MainDash> was created without expected prop 'selected_task'");
    		}
    	}

    	get _cache() {
    		throw new Error("<MainDash>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _cache(value) {
    		throw new Error("<MainDash>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get client() {
    		throw new Error("<MainDash>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set client(value) {
    		throw new Error("<MainDash>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected_task() {
    		throw new Error("<MainDash>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected_task(value) {
    		throw new Error("<MainDash>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Submissions.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$6 } = globals;
    const file$f = "src\\components\\Submissions.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (41:16) {#each pool as submission}
    function create_each_block$7(ctx) {
    	let tr;
    	let td0;
    	let button;
    	let t1;
    	let td1;
    	let t2_value = /*submission*/ ctx[10].student_name + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = (/*submission*/ ctx[10].status || "-") + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = (/*submission*/ ctx[10].grade || "-") + "";
    	let t6;
    	let t7;
    	let tr_class_value;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[9](/*submission*/ ctx[10], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			button = element("button");
    			button.textContent = "→";
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			add_location(button, file$f, 42, 28, 1694);
    			add_location(td0, file$f, 42, 24, 1690);
    			add_location(td1, file$f, 43, 24, 1784);
    			add_location(td2, file$f, 44, 24, 1844);
    			add_location(td3, file$f, 45, 24, 1905);
    			attr_dev(tr, "class", tr_class_value = "submission submission-" + /*submission*/ ctx[10].status + " svelte-1pgrzcq");
    			add_location(tr, file$f, 41, 20, 1610);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, button);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*pool*/ 8 && t2_value !== (t2_value = /*submission*/ ctx[10].student_name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*pool*/ 8 && t4_value !== (t4_value = (/*submission*/ ctx[10].status || "-") + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*pool*/ 8 && t6_value !== (t6_value = (/*submission*/ ctx[10].grade || "-") + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*pool*/ 8 && tr_class_value !== (tr_class_value = "submission submission-" + /*submission*/ ctx[10].status + " svelte-1pgrzcq")) {
    				attr_dev(tr, "class", tr_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(41:16) {#each pool as submission}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let label;
    	let t1;
    	let t2_value = /*pool*/ ctx[3].length + "";
    	let t2;
    	let t3;
    	let t4;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t9;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t10;
    	let td1;
    	let t12;
    	let td2;
    	let t14;
    	let td3;
    	let t16;
    	let tbody;
    	let mounted;
    	let dispose;
    	let each_value = /*pool*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text("Filter (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			t4 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "All";
    			option1 = element("option");
    			option1.textContent = "Submitted";
    			option2 = element("option");
    			option2.textContent = "Not Submitted";
    			option3 = element("option");
    			option3.textContent = "Submitted late";
    			t9 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			t10 = space();
    			td1 = element("td");
    			td1.textContent = "Student name";
    			t12 = space();
    			td2 = element("td");
    			td2.textContent = "Status";
    			t14 = space();
    			td3 = element("td");
    			td3.textContent = "Grade";
    			t16 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "name", "filter");
    			add_location(input, file$f, 20, 8, 741);
    			attr_dev(label, "for", "filter");
    			add_location(label, file$f, 21, 8, 792);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file$f, 23, 12, 964);
    			option1.__value = "submitted";
    			option1.value = option1.__value;
    			add_location(option1, file$f, 24, 12, 1023);
    			option2.__value = "not-submitted";
    			option2.value = option2.__value;
    			add_location(option2, file$f, 25, 12, 1081);
    			option3.__value = "submitted-late";
    			option3.value = option3.__value;
    			add_location(option3, file$f, 26, 12, 1147);
    			add_location(select, file$f, 22, 8, 852);
    			attr_dev(div0, "class", "selector-list-header");
    			add_location(div0, file$f, 19, 4, 697);
    			add_location(td0, file$f, 33, 20, 1353);
    			add_location(td1, file$f, 34, 20, 1384);
    			add_location(td2, file$f, 35, 20, 1427);
    			add_location(td3, file$f, 36, 20, 1464);
    			add_location(tr, file$f, 32, 16, 1327);
    			add_location(thead, file$f, 31, 12, 1302);
    			add_location(tbody, file$f, 39, 12, 1537);
    			add_location(table, file$f, 30, 8, 1281);
    			attr_dev(div1, "class", "selector-list-table");
    			add_location(div1, file$f, 29, 4, 1238);
    			attr_dev(div2, "class", "selector-list");
    			add_location(div2, file$f, 18, 0, 664);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*filter*/ ctx[1]);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			append_dev(label, t3);
    			append_dev(div0, t4);
    			append_dev(div0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(div2, t9);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t10);
    			append_dev(tr, td1);
    			append_dev(tr, t12);
    			append_dev(tr, td2);
    			append_dev(tr, t14);
    			append_dev(tr, td3);
    			append_dev(table, t16);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(select, "blur", /*blur_handler*/ ctx[6], false, false, false),
    					listen_dev(select, "change", /*change_handler*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*filter*/ 2 && input.value !== /*filter*/ ctx[1]) {
    				set_input_value(input, /*filter*/ ctx[1]);
    			}

    			if (dirty & /*pool*/ 8 && t2_value !== (t2_value = /*pool*/ ctx[3].length + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*pool, selected*/ 9) {
    				each_value = /*pool*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { submissions } = $$props;
    	let { selected } = $$props;
    	let filter = "";
    	let selected_status = "";
    	let pool = submissions;

    	function update() {
    		$$invalidate(3, pool = filter
    		? Object.values(submissions).filter(submission => submission.student_name.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
    		: Object.values(submissions));

    		$$invalidate(3, pool = selected_status
    		? pool.filter(submission => selected_status.toLowerCase() === submission.status)
    		: pool);

    		pool.sort((a, b) => a.student_name.toLowerCase().localeCompare(b.student_name.toLowerCase()));
    	}

    	const writable_props = ["submissions", "selected"];

    	Object_1$6.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Submissions> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Submissions", $$slots, []);

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		filter = this.value;
    		$$invalidate(1, filter);
    	}

    	const change_handler = e => $$invalidate(2, selected_status = e.target.options[e.target.selectedIndex].value);
    	const click_handler = submission => $$invalidate(0, selected = submission);

    	$$self.$set = $$props => {
    		if ("submissions" in $$props) $$invalidate(4, submissions = $$props.submissions);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({
    		submissions,
    		selected,
    		filter,
    		selected_status,
    		pool,
    		update
    	});

    	$$self.$inject_state = $$props => {
    		if ("submissions" in $$props) $$invalidate(4, submissions = $$props.submissions);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("filter" in $$props) $$invalidate(1, filter = $$props.filter);
    		if ("selected_status" in $$props) $$invalidate(2, selected_status = $$props.selected_status);
    		if ("pool" in $$props) $$invalidate(3, pool = $$props.pool);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filter, selected_status, submissions*/ 22) {
    			(update());
    		}
    	};

    	return [
    		selected,
    		filter,
    		selected_status,
    		pool,
    		submissions,
    		update,
    		blur_handler,
    		input_input_handler,
    		change_handler,
    		click_handler
    	];
    }

    class Submissions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { submissions: 4, selected: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Submissions",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*submissions*/ ctx[4] === undefined && !("submissions" in props)) {
    			console.warn("<Submissions> was created without expected prop 'submissions'");
    		}

    		if (/*selected*/ ctx[0] === undefined && !("selected" in props)) {
    			console.warn("<Submissions> was created without expected prop 'selected'");
    		}
    	}

    	get submissions() {
    		throw new Error("<Submissions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submissions(value) {
    		throw new Error("<Submissions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Submissions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Submissions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\HFTSubmissionInfo.svelte generated by Svelte v3.23.0 */

    const file$e = "src\\components\\HFTSubmissionInfo.svelte";

    // (5:0) {#if submission}
    function create_if_block$8(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let br0;
    	let t0;
    	let span0;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*submission*/ ctx[0].id + "";
    	let t4;
    	let br1;
    	let t5;
    	let span2;
    	let t6;
    	let t7_value = /*submission*/ ctx[0].student_id + "";
    	let t7;
    	let br2;
    	let t8;
    	let span3;
    	let t9;
    	let t10_value = /*submission*/ ctx[0].student_name + "";
    	let t10;
    	let br3;
    	let t11;
    	let span4;
    	let t12;
    	let t13_value = /*submission*/ ctx[0].status + "";
    	let t13;
    	let br4;
    	let t14;
    	let span5;
    	let t15;
    	let t16_value = (/*submission*/ ctx[0].grade || "-") + "";
    	let t16;
    	let br5;
    	let t17;
    	let span6;
    	let t18;

    	let t19_value = (/*submission*/ ctx[0].handed_in_on
    	? new Date(/*submission*/ ctx[0].handed_in_on).toLocaleDateString()
    	: "") + "";

    	let t19;
    	let br6;
    	let t20;
    	let span7;
    	let t21;
    	let t22_value = /*submission*/ ctx[0].overdue + "";
    	let t22;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			br0 = element("br");
    			t0 = space();
    			span0 = element("span");
    			span0.textContent = "Student avatar";
    			t2 = space();
    			span1 = element("span");
    			t3 = text("ID: ");
    			t4 = text(t4_value);
    			br1 = element("br");
    			t5 = space();
    			span2 = element("span");
    			t6 = text("Student ID: ");
    			t7 = text(t7_value);
    			br2 = element("br");
    			t8 = space();
    			span3 = element("span");
    			t9 = text("Student name: ");
    			t10 = text(t10_value);
    			br3 = element("br");
    			t11 = space();
    			span4 = element("span");
    			t12 = text("Status: ");
    			t13 = text(t13_value);
    			br4 = element("br");
    			t14 = space();
    			span5 = element("span");
    			t15 = text("Grade: ");
    			t16 = text(t16_value);
    			br5 = element("br");
    			t17 = space();
    			span6 = element("span");
    			t18 = text("Handed in on: ");
    			t19 = text(t19_value);
    			br6 = element("br");
    			t20 = space();
    			span7 = element("span");
    			t21 = text("Overdue: ");
    			t22 = text(t22_value);
    			attr_dev(img, "class", "avatar");
    			if (img.src !== (img_src_value = /*submission*/ ctx[0].student_avatar || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "avatar");
    			attr_dev(img, "width", "96");
    			attr_dev(img, "height", "96");
    			add_location(img, file$e, 7, 12, 166);
    			add_location(br0, file$e, 7, 163, 317);
    			add_location(span0, file$e, 8, 12, 335);
    			set_style(div0, "float", "right");
    			set_style(div0, "text-align", "right");
    			add_location(div0, file$e, 6, 8, 109);
    			add_location(span1, file$e, 10, 8, 388);
    			add_location(br1, file$e, 10, 40, 420);
    			add_location(span2, file$e, 11, 8, 434);
    			add_location(br2, file$e, 11, 56, 482);
    			add_location(span3, file$e, 12, 8, 496);
    			add_location(br3, file$e, 12, 60, 548);
    			add_location(span4, file$e, 13, 8, 562);
    			add_location(br4, file$e, 13, 48, 602);
    			add_location(span5, file$e, 14, 8, 616);
    			add_location(br5, file$e, 14, 53, 661);
    			add_location(span6, file$e, 15, 8, 675);
    			add_location(br6, file$e, 15, 122, 789);
    			add_location(span7, file$e, 16, 8, 803);
    			set_style(div1, "padding", "4px");
    			add_location(div1, file$e, 5, 4, 73);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, br0);
    			append_dev(div0, t0);
    			append_dev(div0, span0);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(div1, br1);
    			append_dev(div1, t5);
    			append_dev(div1, span2);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    			append_dev(div1, br2);
    			append_dev(div1, t8);
    			append_dev(div1, span3);
    			append_dev(span3, t9);
    			append_dev(span3, t10);
    			append_dev(div1, br3);
    			append_dev(div1, t11);
    			append_dev(div1, span4);
    			append_dev(span4, t12);
    			append_dev(span4, t13);
    			append_dev(div1, br4);
    			append_dev(div1, t14);
    			append_dev(div1, span5);
    			append_dev(span5, t15);
    			append_dev(span5, t16);
    			append_dev(div1, br5);
    			append_dev(div1, t17);
    			append_dev(div1, span6);
    			append_dev(span6, t18);
    			append_dev(span6, t19);
    			append_dev(div1, br6);
    			append_dev(div1, t20);
    			append_dev(div1, span7);
    			append_dev(span7, t21);
    			append_dev(span7, t22);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*submission*/ 1 && img.src !== (img_src_value = /*submission*/ ctx[0].student_avatar || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*submission*/ 1 && t4_value !== (t4_value = /*submission*/ ctx[0].id + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*submission*/ 1 && t7_value !== (t7_value = /*submission*/ ctx[0].student_id + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*submission*/ 1 && t10_value !== (t10_value = /*submission*/ ctx[0].student_name + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*submission*/ 1 && t13_value !== (t13_value = /*submission*/ ctx[0].status + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*submission*/ 1 && t16_value !== (t16_value = (/*submission*/ ctx[0].grade || "-") + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*submission*/ 1 && t19_value !== (t19_value = (/*submission*/ ctx[0].handed_in_on
    			? new Date(/*submission*/ ctx[0].handed_in_on).toLocaleDateString()
    			: "") + "")) set_data_dev(t19, t19_value);

    			if (dirty & /*submission*/ 1 && t22_value !== (t22_value = /*submission*/ ctx[0].overdue + "")) set_data_dev(t22, t22_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(5:0) {#if submission}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let if_block_anchor;
    	let if_block = /*submission*/ ctx[0] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*submission*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { submission } = $$props;
    	const writable_props = ["submission"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HFTSubmissionInfo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("HFTSubmissionInfo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("submission" in $$props) $$invalidate(0, submission = $$props.submission);
    	};

    	$$self.$capture_state = () => ({ submission });

    	$$self.$inject_state = $$props => {
    		if ("submission" in $$props) $$invalidate(0, submission = $$props.submission);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [submission];
    }

    class HFTSubmissionInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { submission: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HFTSubmissionInfo",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*submission*/ ctx[0] === undefined && !("submission" in props)) {
    			console.warn("<HFTSubmissionInfo> was created without expected prop 'submission'");
    		}
    	}

    	get submission() {
    		throw new Error("<HFTSubmissionInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submission(value) {
    		throw new Error("<HFTSubmissionInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Comments.svelte generated by Svelte v3.23.0 */

    const file$d = "src\\components\\Comments.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (6:0) {#each comments as comment}
    function create_each_block$6(ctx) {
    	let p;
    	let b;
    	let t0_value = /*comment*/ ctx[2].user_name + "";
    	let t0;
    	let t1;
    	let t2_value = new Date(/*comment*/ ctx[2].created_at).toISOString() + "";
    	let t2;
    	let t3;
    	let t4;
    	let t5_value = /*comment*/ ctx[2].text + "";
    	let t5;
    	let p_class_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = text(" @ ");
    			t2 = text(t2_value);
    			t3 = text(":");
    			t4 = space();
    			t5 = text(t5_value);
    			add_location(b, file$d, 6, 94, 207);

    			attr_dev(p, "class", p_class_value = "" + (null_to_empty(/*submission*/ ctx[1]
    			? /*comment*/ ctx[2].user_id === /*submission*/ ctx[1].student_id
    				? "out"
    				: "in"
    			: "") + " svelte-j00rkf"));

    			add_location(p, file$d, 6, 4, 117);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, b);
    			append_dev(b, t0);
    			append_dev(b, t1);
    			append_dev(b, t2);
    			append_dev(b, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*comments*/ 1 && t0_value !== (t0_value = /*comment*/ ctx[2].user_name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*comments*/ 1 && t2_value !== (t2_value = new Date(/*comment*/ ctx[2].created_at).toISOString() + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*comments*/ 1 && t5_value !== (t5_value = /*comment*/ ctx[2].text + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*submission, comments*/ 3 && p_class_value !== (p_class_value = "" + (null_to_empty(/*submission*/ ctx[1]
    			? /*comment*/ ctx[2].user_id === /*submission*/ ctx[1].student_id
    				? "out"
    				: "in"
    			: "") + " svelte-j00rkf"))) {
    				attr_dev(p, "class", p_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(6:0) {#each comments as comment}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let each_1_anchor;
    	let each_value = /*comments*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*submission, comments, Date*/ 3) {
    				each_value = /*comments*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { comments } = $$props;
    	let { submission = null } = $$props;
    	const writable_props = ["comments", "submission"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Comments> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Comments", $$slots, []);

    	$$self.$set = $$props => {
    		if ("comments" in $$props) $$invalidate(0, comments = $$props.comments);
    		if ("submission" in $$props) $$invalidate(1, submission = $$props.submission);
    	};

    	$$self.$capture_state = () => ({ comments, submission });

    	$$self.$inject_state = $$props => {
    		if ("comments" in $$props) $$invalidate(0, comments = $$props.comments);
    		if ("submission" in $$props) $$invalidate(1, submission = $$props.submission);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [comments, submission];
    }

    class Comments extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { comments: 0, submission: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Comments",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*comments*/ ctx[0] === undefined && !("comments" in props)) {
    			console.warn("<Comments> was created without expected prop 'comments'");
    		}
    	}

    	get comments() {
    		throw new Error("<Comments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set comments(value) {
    		throw new Error("<Comments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get submission() {
    		throw new Error("<Comments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submission(value) {
    		throw new Error("<Comments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\CommentInput.svelte generated by Svelte v3.23.0 */

    const file$c = "src\\components\\CommentInput.svelte";

    function create_fragment$c(ctx) {
    	let textarea;
    	let t0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(textarea, "placeholder", "Add a comment..");
    			attr_dev(textarea, "class", "svelte-cu4ugo");
    			add_location(textarea, file$c, 6, 0, 71);
    			attr_dev(button, "class", "comment svelte-cu4ugo");
    			add_location(button, file$c, 7, 0, 145);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*comment*/ ctx[1]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[2]),
    					listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*comment*/ 2) {
    				set_input_value(textarea, /*comment*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { submission } = $$props;
    	let comment;
    	const writable_props = ["submission"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CommentInput> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CommentInput", $$slots, []);

    	function textarea_input_handler() {
    		comment = this.value;
    		$$invalidate(1, comment);
    	}

    	const click_handler = () => submission.postComment(comment);

    	$$self.$set = $$props => {
    		if ("submission" in $$props) $$invalidate(0, submission = $$props.submission);
    	};

    	$$self.$capture_state = () => ({ submission, comment });

    	$$self.$inject_state = $$props => {
    		if ("submission" in $$props) $$invalidate(0, submission = $$props.submission);
    		if ("comment" in $$props) $$invalidate(1, comment = $$props.comment);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [submission, comment, textarea_input_handler, click_handler];
    }

    class CommentInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { submission: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CommentInput",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*submission*/ ctx[0] === undefined && !("submission" in props)) {
    			console.warn("<CommentInput> was created without expected prop 'submission'");
    		}
    	}

    	get submission() {
    		throw new Error("<CommentInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submission(value) {
    		throw new Error("<CommentInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function formatBytes(bytes) {
        if (bytes === 0) return "0 B";

        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    const dialog = require("electron").remote.dialog;
    const fs = require("fs");
    const https = require("https");

    function downloadAttachment(attachment) {
        dialog.showSaveDialog({ defaultPath: attachment.filename }).then(response => {
            if (!response.canceled) {
                var filewrite = fs.createWriteStream(response.filePath);

                const request = https.get(attachment.file_url, function(response) {
                    response.pipe(filewrite);

                    filewrite.on("finish", function() {
                        filewrite.close();
                    });
                });
                
                request.on("error", function(err) {
                    alert("There was an error downloading attachment " + attachment.filename + ".\n\nMessage: ", err.message);

                    fs.unlinkSync(response.filePath); 
                });
            }
        });
    }

    /* src\components\Attachments.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$5 } = globals;
    const file$b = "src\\components\\Attachments.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (27:16) {#each pool as attachment}
    function create_each_block$5(ctx) {
    	let tr;
    	let td0;
    	let button;
    	let t1;
    	let td1;
    	let t2_value = /*attachment*/ ctx[5].filename + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = formatBytes(/*attachment*/ ctx[5].file_size) + "";
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*attachment*/ ctx[5], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			button = element("button");
    			button.textContent = "⭳";
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			add_location(button, file$b, 28, 28, 944);
    			add_location(td0, file$b, 28, 24, 940);
    			add_location(td1, file$b, 29, 24, 1043);
    			add_location(td2, file$b, 30, 24, 1099);
    			add_location(tr, file$b, 27, 20, 910);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, button);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*pool*/ 2 && t2_value !== (t2_value = /*attachment*/ ctx[5].filename + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*pool*/ 2 && t4_value !== (t4_value = formatBytes(/*attachment*/ ctx[5].file_size) + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(27:16) {#each pool as attachment}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let label;
    	let t1;
    	let t2_value = /*pool*/ ctx[1].length + "";
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t5;
    	let td1;
    	let t7;
    	let td2;
    	let t9;
    	let tbody;
    	let mounted;
    	let dispose;
    	let each_value = /*pool*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text("Filter (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			t4 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			t5 = space();
    			td1 = element("td");
    			td1.textContent = "Filename";
    			t7 = space();
    			td2 = element("td");
    			td2.textContent = "Size";
    			t9 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "name", "filter");
    			add_location(input, file$b, 13, 8, 461);
    			attr_dev(label, "for", "filter");
    			add_location(label, file$b, 14, 8, 512);
    			attr_dev(div0, "class", "selector-list-header");
    			add_location(div0, file$b, 12, 4, 417);
    			add_location(td0, file$b, 20, 20, 695);
    			add_location(td1, file$b, 21, 20, 726);
    			add_location(td2, file$b, 22, 20, 765);
    			add_location(tr, file$b, 19, 16, 669);
    			add_location(thead, file$b, 18, 12, 644);
    			add_location(tbody, file$b, 25, 12, 837);
    			add_location(table, file$b, 17, 8, 623);
    			attr_dev(div1, "class", "selector-list-table");
    			add_location(div1, file$b, 16, 4, 580);
    			attr_dev(div2, "class", "selector-list");
    			add_location(div2, file$b, 11, 0, 384);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*filter*/ ctx[0]);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			append_dev(label, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t5);
    			append_dev(tr, td1);
    			append_dev(tr, t7);
    			append_dev(tr, td2);
    			append_dev(table, t9);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*filter*/ 1 && input.value !== /*filter*/ ctx[0]) {
    				set_input_value(input, /*filter*/ ctx[0]);
    			}

    			if (dirty & /*pool*/ 2 && t2_value !== (t2_value = /*pool*/ ctx[1].length + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*formatBytes, pool, downloadAttachment*/ 2) {
    				each_value = /*pool*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { attachments } = $$props;
    	let filter = "";
    	const writable_props = ["attachments"];

    	Object_1$5.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Attachments> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Attachments", $$slots, []);

    	function input_input_handler() {
    		filter = this.value;
    		$$invalidate(0, filter);
    	}

    	const click_handler = attachment => downloadAttachment(attachment);

    	$$self.$set = $$props => {
    		if ("attachments" in $$props) $$invalidate(2, attachments = $$props.attachments);
    	};

    	$$self.$capture_state = () => ({
    		formatBytes,
    		downloadAttachment,
    		attachments,
    		filter,
    		pool
    	});

    	$$self.$inject_state = $$props => {
    		if ("attachments" in $$props) $$invalidate(2, attachments = $$props.attachments);
    		if ("filter" in $$props) $$invalidate(0, filter = $$props.filter);
    		if ("pool" in $$props) $$invalidate(1, pool = $$props.pool);
    	};

    	let pool;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filter, attachments*/ 5) {
    			$$invalidate(1, pool = filter
    			? Object.values(attachments).filter(attachment => attachment.filename.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
    			: Object.values(attachments));
    		}
    	};

    	return [filter, pool, attachments, input_input_handler, click_handler];
    }

    class Attachments extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { attachments: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Attachments",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*attachments*/ ctx[2] === undefined && !("attachments" in props)) {
    			console.warn("<Attachments> was created without expected prop 'attachments'");
    		}
    	}

    	get attachments() {
    		throw new Error("<Attachments>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set attachments(value) {
    		throw new Error("<Attachments>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\HFTInfo.svelte generated by Svelte v3.23.0 */

    const file$a = "src\\components\\HFTInfo.svelte";

    // (5:0) {#if assignment}
    function create_if_block$7(ctx) {
    	let span0;
    	let t0;
    	let t1_value = /*assignment*/ ctx[0].id + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*assignment*/ ctx[0].title + "";
    	let t4;
    	let t5;
    	let span2;
    	let t6;
    	let t7_value = /*assignment*/ ctx[0].teacher_name + "";
    	let t7;
    	let t8;
    	let span3;
    	let t9;
    	let t10_value = /*assignment*/ ctx[0].class_group_name + "";
    	let t10;
    	let t11;
    	let span4;
    	let t12;
    	let t13_value = /*assignment*/ ctx[0].class_year + "";
    	let t13;
    	let t14;
    	let span5;
    	let t15;
    	let t16_value = /*assignment*/ ctx[0].type + "";
    	let t16;
    	let t17;
    	let span6;
    	let t18;
    	let t19_value = new Date(/*assignment*/ ctx[0].issued_on).toLocaleDateString() + "";
    	let t19;
    	let t20;
    	let span7;
    	let t21;
    	let t22_value = new Date(/*assignment*/ ctx[0].due_on).toLocaleDateString() + "";
    	let t22;
    	let t23;
    	let span8;
    	let t24;
    	let t25_value = /*assignment*/ ctx[0].duration + " " + /*assignment*/ ctx[0].duration_units + "";
    	let t25;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text("ID: ");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text("Title: ");
    			t4 = text(t4_value);
    			t5 = space();
    			span2 = element("span");
    			t6 = text("Teacher: ");
    			t7 = text(t7_value);
    			t8 = space();
    			span3 = element("span");
    			t9 = text("Group: ");
    			t10 = text(t10_value);
    			t11 = space();
    			span4 = element("span");
    			t12 = text("Year: ");
    			t13 = text(t13_value);
    			t14 = space();
    			span5 = element("span");
    			t15 = text("Type: ");
    			t16 = text(t16_value);
    			t17 = space();
    			span6 = element("span");
    			t18 = text("Issued: ");
    			t19 = text(t19_value);
    			t20 = space();
    			span7 = element("span");
    			t21 = text("Due: ");
    			t22 = text(t22_value);
    			t23 = space();
    			span8 = element("span");
    			t24 = text("Duration: ");
    			t25 = text(t25_value);
    			add_location(span0, file$a, 5, 4, 73);
    			add_location(span1, file$a, 6, 4, 111);
    			add_location(span2, file$a, 7, 4, 155);
    			add_location(span3, file$a, 8, 4, 208);
    			add_location(span4, file$a, 9, 4, 263);
    			add_location(span5, file$a, 10, 4, 311);
    			add_location(span6, file$a, 11, 4, 353);
    			add_location(span7, file$a, 12, 4, 433);
    			add_location(span8, file$a, 13, 4, 507);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, span3, anchor);
    			append_dev(span3, t9);
    			append_dev(span3, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, span4, anchor);
    			append_dev(span4, t12);
    			append_dev(span4, t13);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, span5, anchor);
    			append_dev(span5, t15);
    			append_dev(span5, t16);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, span6, anchor);
    			append_dev(span6, t18);
    			append_dev(span6, t19);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, span7, anchor);
    			append_dev(span7, t21);
    			append_dev(span7, t22);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, span8, anchor);
    			append_dev(span8, t24);
    			append_dev(span8, t25);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*assignment*/ 1 && t1_value !== (t1_value = /*assignment*/ ctx[0].id + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*assignment*/ 1 && t4_value !== (t4_value = /*assignment*/ ctx[0].title + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*assignment*/ 1 && t7_value !== (t7_value = /*assignment*/ ctx[0].teacher_name + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*assignment*/ 1 && t10_value !== (t10_value = /*assignment*/ ctx[0].class_group_name + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*assignment*/ 1 && t13_value !== (t13_value = /*assignment*/ ctx[0].class_year + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*assignment*/ 1 && t16_value !== (t16_value = /*assignment*/ ctx[0].type + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*assignment*/ 1 && t19_value !== (t19_value = new Date(/*assignment*/ ctx[0].issued_on).toLocaleDateString() + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*assignment*/ 1 && t22_value !== (t22_value = new Date(/*assignment*/ ctx[0].due_on).toLocaleDateString() + "")) set_data_dev(t22, t22_value);
    			if (dirty & /*assignment*/ 1 && t25_value !== (t25_value = /*assignment*/ ctx[0].duration + " " + /*assignment*/ ctx[0].duration_units + "")) set_data_dev(t25, t25_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(span4);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(span5);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(span6);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(span7);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(span8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(5:0) {#if assignment}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;
    	let if_block = /*assignment*/ ctx[0] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*assignment*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { assignment } = $$props;
    	const writable_props = ["assignment"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HFTInfo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("HFTInfo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("assignment" in $$props) $$invalidate(0, assignment = $$props.assignment);
    	};

    	$$self.$capture_state = () => ({ assignment });

    	$$self.$inject_state = $$props => {
    		if ("assignment" in $$props) $$invalidate(0, assignment = $$props.assignment);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [assignment];
    }

    class HFTInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { assignment: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HFTInfo",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*assignment*/ ctx[0] === undefined && !("assignment" in props)) {
    			console.warn("<HFTInfo> was created without expected prop 'assignment'");
    		}
    	}

    	get assignment() {
    		throw new Error("<HFTInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set assignment(value) {
    		throw new Error("<HFTInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\SelectTaskHFT.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$4 } = globals;
    const file$9 = "src\\pages\\SelectTaskHFT.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (21:0) {#if assignment}
    function create_if_block$6(ctx) {
    	let div15;
    	let div2;
    	let div0;
    	let div0_class_value;
    	let t0;
    	let div1;
    	let a;
    	let br0;
    	let t2;
    	let html_tag;
    	let raw_value = /*selected_task*/ ctx[0].description + "";
    	let br1;
    	let t3;
    	let t4;
    	let div4;
    	let div3;
    	let span0;
    	let t6;
    	let t7;
    	let div6;
    	let div5;
    	let span1;
    	let t9;
    	let t10;
    	let div14;
    	let div8;
    	let div7;
    	let span2;
    	let t12;
    	let updating_selected;
    	let t13;
    	let div10;
    	let div9;
    	let span3;
    	let t15;
    	let t16;
    	let div13;
    	let div11;
    	let span4;
    	let t18;
    	let div12;
    	let t19;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*selected_task*/ ctx[0].class_task_type === "Homework") return create_if_block_2$2;
    		if (/*selected_task*/ ctx[0].class_task_type === "FlexibleTask") return create_if_block_3$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let each_value = /*assignment*/ ctx[3].web_links;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const hftinfo = new HFTInfo({
    			props: { assignment: /*assignment*/ ctx[3] },
    			$$inline: true
    		});

    	const attachments_1 = new Attachments({
    			props: { attachments: /*attachments*/ ctx[4] },
    			$$inline: true
    		});

    	function submissions_1_selected_binding(value) {
    		/*submissions_1_selected_binding*/ ctx[9].call(null, value);
    	}

    	let submissions_1_props = { submissions: /*submissions*/ ctx[5] };

    	if (/*selected_submission*/ ctx[1] !== void 0) {
    		submissions_1_props.selected = /*selected_submission*/ ctx[1];
    	}

    	const submissions_1 = new Submissions({
    			props: submissions_1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(submissions_1, "selected", submissions_1_selected_binding));

    	const hftsubmissioninfo = new HFTSubmissionInfo({
    			props: {
    				submission: /*selected_submission*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const comments_1 = new Comments({
    			props: {
    				comments: /*comments*/ ctx[6],
    				submission: /*selected_submission*/ ctx[1]
    			},
    			$$inline: true
    		});

    	let if_block1 = /*selected_submission*/ ctx[1] && /*selected_submission*/ ctx[1].student_id === /*client*/ ctx[2].student.id && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			a = element("a");
    			a.textContent = "Back";
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div4 = element("div");
    			div3 = element("div");
    			span0 = element("span");
    			span0.textContent = "Information";
    			t6 = space();
    			create_component(hftinfo.$$.fragment);
    			t7 = space();
    			div6 = element("div");
    			div5 = element("div");
    			span1 = element("span");
    			span1.textContent = "Attachments";
    			t9 = space();
    			create_component(attachments_1.$$.fragment);
    			t10 = space();
    			div14 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			span2 = element("span");
    			span2.textContent = "Submissions";
    			t12 = space();
    			create_component(submissions_1.$$.fragment);
    			t13 = space();
    			div10 = element("div");
    			div9 = element("div");
    			span3 = element("span");
    			span3.textContent = "Selected";
    			t15 = space();
    			create_component(hftsubmissioninfo.$$.fragment);
    			t16 = space();
    			div13 = element("div");
    			div11 = element("div");
    			span4 = element("span");
    			span4.textContent = "Comments";
    			t18 = space();
    			div12 = element("div");
    			create_component(comments_1.$$.fragment);
    			t19 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", div0_class_value = "page-content-title task-title task-title-" + /*selected_task*/ ctx[0].class_task_type.toLowerCase());
    			add_location(div0, file$9, 23, 12, 1233);
    			attr_dev(a, "href", "##");
    			add_location(a, file$9, 31, 16, 1857);
    			add_location(br0, file$9, 31, 75, 1916);
    			html_tag = new HtmlTag(br1);
    			add_location(br1, file$9, 32, 49, 1971);
    			attr_dev(div1, "id", "task-description");
    			attr_dev(div1, "class", "svelte-1sonrzw");
    			add_location(div1, file$9, 30, 12, 1812);
    			attr_dev(div2, "class", "page-section column svelte-1sonrzw");
    			attr_dev(div2, "id", "section-description");
    			add_location(div2, file$9, 22, 8, 1161);
    			add_location(span0, file$9, 40, 16, 2311);
    			attr_dev(div3, "class", "page-content-title");
    			add_location(div3, file$9, 39, 12, 2261);
    			attr_dev(div4, "class", "page-section column svelte-1sonrzw");
    			attr_dev(div4, "id", "section-information");
    			add_location(div4, file$9, 38, 8, 2189);
    			add_location(span1, file$9, 46, 16, 2540);
    			attr_dev(div5, "class", "page-content-title");
    			add_location(div5, file$9, 45, 12, 2490);
    			attr_dev(div6, "class", "page-section column svelte-1sonrzw");
    			attr_dev(div6, "id", "section-attachments");
    			add_location(div6, file$9, 44, 8, 2418);
    			add_location(span2, file$9, 53, 20, 2815);
    			attr_dev(div7, "class", "page-content-title");
    			add_location(div7, file$9, 52, 16, 2761);
    			attr_dev(div8, "class", "page-content");
    			add_location(div8, file$9, 51, 12, 2717);
    			add_location(span3, file$9, 59, 20, 3077);
    			attr_dev(div9, "class", "page-content-title");
    			add_location(div9, file$9, 58, 16, 3023);
    			attr_dev(div10, "class", "page-content");
    			add_location(div10, file$9, 57, 12, 2979);
    			add_location(span4, file$9, 65, 20, 3325);
    			attr_dev(div11, "class", "page-content-title");
    			add_location(div11, file$9, 64, 16, 3271);
    			attr_dev(div12, "class", "scroll");
    			set_style(div12, "flex", "1 1 0");
    			add_location(div12, file$9, 67, 16, 3388);
    			attr_dev(div13, "class", "page-content");
    			add_location(div13, file$9, 63, 12, 3227);
    			attr_dev(div14, "class", "page-section svelte-1sonrzw");
    			attr_dev(div14, "id", "section-submissions");
    			add_location(div14, file$9, 50, 8, 2652);
    			attr_dev(div15, "class", "page svelte-1sonrzw");
    			attr_dev(div15, "id", "page-selected-hft");
    			add_location(div15, file$9, 21, 4, 1110);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, div2);
    			append_dev(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, a);
    			append_dev(div1, br0);
    			append_dev(div1, t2);
    			html_tag.m(raw_value, div1);
    			append_dev(div1, br1);
    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div15, t4);
    			append_dev(div15, div4);
    			append_dev(div4, div3);
    			append_dev(div3, span0);
    			append_dev(div4, t6);
    			mount_component(hftinfo, div4, null);
    			append_dev(div15, t7);
    			append_dev(div15, div6);
    			append_dev(div6, div5);
    			append_dev(div5, span1);
    			append_dev(div6, t9);
    			mount_component(attachments_1, div6, null);
    			append_dev(div15, t10);
    			append_dev(div15, div14);
    			append_dev(div14, div8);
    			append_dev(div8, div7);
    			append_dev(div7, span2);
    			append_dev(div8, t12);
    			mount_component(submissions_1, div8, null);
    			append_dev(div14, t13);
    			append_dev(div14, div10);
    			append_dev(div10, div9);
    			append_dev(div9, span3);
    			append_dev(div10, t15);
    			mount_component(hftsubmissioninfo, div10, null);
    			append_dev(div14, t16);
    			append_dev(div14, div13);
    			append_dev(div13, div11);
    			append_dev(div11, span4);
    			append_dev(div13, t18);
    			append_dev(div13, div12);
    			mount_component(comments_1, div12, null);
    			append_dev(div13, t19);
    			if (if_block1) if_block1.m(div13, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (!current || dirty & /*selected_task*/ 1 && div0_class_value !== (div0_class_value = "page-content-title task-title task-title-" + /*selected_task*/ ctx[0].class_task_type.toLowerCase())) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if ((!current || dirty & /*selected_task*/ 1) && raw_value !== (raw_value = /*selected_task*/ ctx[0].description + "")) html_tag.p(raw_value);

    			if (dirty & /*assignment*/ 8) {
    				each_value = /*assignment*/ ctx[3].web_links;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const hftinfo_changes = {};
    			if (dirty & /*assignment*/ 8) hftinfo_changes.assignment = /*assignment*/ ctx[3];
    			hftinfo.$set(hftinfo_changes);
    			const attachments_1_changes = {};
    			if (dirty & /*attachments*/ 16) attachments_1_changes.attachments = /*attachments*/ ctx[4];
    			attachments_1.$set(attachments_1_changes);
    			const submissions_1_changes = {};
    			if (dirty & /*submissions*/ 32) submissions_1_changes.submissions = /*submissions*/ ctx[5];

    			if (!updating_selected && dirty & /*selected_submission*/ 2) {
    				updating_selected = true;
    				submissions_1_changes.selected = /*selected_submission*/ ctx[1];
    				add_flush_callback(() => updating_selected = false);
    			}

    			submissions_1.$set(submissions_1_changes);
    			const hftsubmissioninfo_changes = {};
    			if (dirty & /*selected_submission*/ 2) hftsubmissioninfo_changes.submission = /*selected_submission*/ ctx[1];
    			hftsubmissioninfo.$set(hftsubmissioninfo_changes);
    			const comments_1_changes = {};
    			if (dirty & /*comments*/ 64) comments_1_changes.comments = /*comments*/ ctx[6];
    			if (dirty & /*selected_submission*/ 2) comments_1_changes.submission = /*selected_submission*/ ctx[1];
    			comments_1.$set(comments_1_changes);

    			if (/*selected_submission*/ ctx[1] && /*selected_submission*/ ctx[1].student_id === /*client*/ ctx[2].student.id) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*selected_submission, client*/ 6) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div13, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hftinfo.$$.fragment, local);
    			transition_in(attachments_1.$$.fragment, local);
    			transition_in(submissions_1.$$.fragment, local);
    			transition_in(hftsubmissioninfo.$$.fragment, local);
    			transition_in(comments_1.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hftinfo.$$.fragment, local);
    			transition_out(attachments_1.$$.fragment, local);
    			transition_out(submissions_1.$$.fragment, local);
    			transition_out(hftsubmissioninfo.$$.fragment, local);
    			transition_out(comments_1.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);

    			if (if_block0) {
    				if_block0.d();
    			}

    			destroy_each(each_blocks, detaching);
    			destroy_component(hftinfo);
    			destroy_component(attachments_1);
    			destroy_component(submissions_1);
    			destroy_component(hftsubmissioninfo);
    			destroy_component(comments_1);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(21:0) {#if assignment}",
    		ctx
    	});

    	return block;
    }

    // (27:75) 
    function create_if_block_3$1(ctx) {
    	let a;
    	let span;
    	let t_value = /*assignment*/ ctx[3].title + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$9, 27, 104, 1720);
    			attr_dev(a, "href", a_href_value = "https://www.satchelone.com/flexible-tasks/" + /*assignment*/ ctx[3].id);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$9, 27, 20, 1636);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*assignment*/ 8 && t_value !== (t_value = /*assignment*/ ctx[3].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*assignment*/ 8 && a_href_value !== (a_href_value = "https://www.satchelone.com/flexible-tasks/" + /*assignment*/ ctx[3].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(27:75) ",
    		ctx
    	});

    	return block;
    }

    // (25:16) {#if selected_task.class_task_type === "Homework"}
    function create_if_block_2$2(ctx) {
    	let a;
    	let span;
    	let t_value = /*assignment*/ ctx[3].title + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$9, 25, 99, 1502);
    			attr_dev(a, "href", a_href_value = "https://www.satchelone.com/homeworks/" + /*assignment*/ ctx[3].id);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$9, 25, 20, 1423);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*assignment*/ 8 && t_value !== (t_value = /*assignment*/ ctx[3].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*assignment*/ 8 && a_href_value !== (a_href_value = "https://www.satchelone.com/homeworks/" + /*assignment*/ ctx[3].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(25:16) {#if selected_task.class_task_type === \\\"Homework\\\"}",
    		ctx
    	});

    	return block;
    }

    // (34:16) {#each assignment.web_links as web_link}
    function create_each_block$4(ctx) {
    	let a;
    	let t_value = /*web_link*/ ctx[10].url + "";
    	let t;
    	let a_href_value;
    	let br;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			br = element("br");
    			attr_dev(a, "href", a_href_value = /*web_link*/ ctx[10].url);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$9, 34, 20, 2055);
    			add_location(br, file$9, 34, 79, 2114);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*assignment*/ 8 && t_value !== (t_value = /*web_link*/ ctx[10].url + "")) set_data_dev(t, t_value);

    			if (dirty & /*assignment*/ 8 && a_href_value !== (a_href_value = /*web_link*/ ctx[10].url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(34:16) {#each assignment.web_links as web_link}",
    		ctx
    	});

    	return block;
    }

    // (71:16) {#if selected_submission && selected_submission.student_id === client.student.id}
    function create_if_block_1$3(ctx) {
    	let div;
    	let current;

    	const commentinput = new CommentInput({
    			props: {
    				submission: /*selected_submission*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(commentinput.$$.fragment);
    			set_style(div, "flex-direction", "column");
    			set_style(div, "flex", "1 1 0");
    			add_location(div, file$9, 71, 20, 3650);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(commentinput, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const commentinput_changes = {};
    			if (dirty & /*selected_submission*/ 2) commentinput_changes.submission = /*selected_submission*/ ctx[1];
    			commentinput.$set(commentinput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(commentinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(commentinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(commentinput);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(71:16) {#if selected_submission && selected_submission.student_id === client.student.id}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*assignment*/ ctx[3] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*assignment*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*assignment*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { client } = $$props;
    	let { _cache } = $$props;
    	let { selected_task } = $$props;
    	let { selected_submission } = $$props;
    	const writable_props = ["client", "_cache", "selected_task", "selected_submission"];

    	Object_1$4.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SelectTaskHFT> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SelectTaskHFT", $$slots, []);
    	const click_handler = () => $$invalidate(0, selected_task = null);

    	function submissions_1_selected_binding(value) {
    		selected_submission = value;
    		$$invalidate(1, selected_submission);
    	}

    	$$self.$set = $$props => {
    		if ("client" in $$props) $$invalidate(2, client = $$props.client);
    		if ("_cache" in $$props) $$invalidate(7, _cache = $$props._cache);
    		if ("selected_task" in $$props) $$invalidate(0, selected_task = $$props.selected_task);
    		if ("selected_submission" in $$props) $$invalidate(1, selected_submission = $$props.selected_submission);
    	};

    	$$self.$capture_state = () => ({
    		Submissions,
    		HFTSubmissionInfo,
    		Comments,
    		CommentInput,
    		Attachments,
    		HFTInfo,
    		client,
    		_cache,
    		selected_task,
    		selected_submission,
    		assignment,
    		attachments,
    		submissions,
    		comments
    	});

    	$$self.$inject_state = $$props => {
    		if ("client" in $$props) $$invalidate(2, client = $$props.client);
    		if ("_cache" in $$props) $$invalidate(7, _cache = $$props._cache);
    		if ("selected_task" in $$props) $$invalidate(0, selected_task = $$props.selected_task);
    		if ("selected_submission" in $$props) $$invalidate(1, selected_submission = $$props.selected_submission);
    		if ("assignment" in $$props) $$invalidate(3, assignment = $$props.assignment);
    		if ("attachments" in $$props) $$invalidate(4, attachments = $$props.attachments);
    		if ("submissions" in $$props) $$invalidate(5, submissions = $$props.submissions);
    		if ("comments" in $$props) $$invalidate(6, comments = $$props.comments);
    	};

    	let assignment;
    	let attachments;
    	let submissions;
    	let comments;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selected_task, _cache*/ 129) {
    			$$invalidate(3, assignment = selected_task
    			? _cache.assignments[selected_task.class_task_id]
    			: null);
    		}

    		if ($$self.$$.dirty & /*assignment, _cache*/ 136) {
    			$$invalidate(4, attachments = assignment
    			? Object.values(_cache.attachments).filter(attachment => assignment.attachment_ids.indexOf(attachment.id) !== -1)
    			: []);
    		}

    		if ($$self.$$.dirty & /*assignment, _cache*/ 136) {
    			$$invalidate(5, submissions = assignment
    			? Object.values(_cache.submissions).filter(submission => assignment.submission_ids.indexOf(submission.id) !== -1)
    			: []);
    		}

    		if ($$self.$$.dirty & /*selected_submission, _cache*/ 130) {
    			$$invalidate(6, comments = selected_submission
    			? Object.values(_cache.comments).filter(comment => selected_submission.comment_ids.indexOf(comment.id) !== -1)
    			: []);
    		}
    	};

    	return [
    		selected_task,
    		selected_submission,
    		client,
    		assignment,
    		attachments,
    		submissions,
    		comments,
    		_cache,
    		click_handler,
    		submissions_1_selected_binding
    	];
    }

    class SelectTaskHFT extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			client: 2,
    			_cache: 7,
    			selected_task: 0,
    			selected_submission: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectTaskHFT",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*client*/ ctx[2] === undefined && !("client" in props)) {
    			console.warn("<SelectTaskHFT> was created without expected prop 'client'");
    		}

    		if (/*_cache*/ ctx[7] === undefined && !("_cache" in props)) {
    			console.warn("<SelectTaskHFT> was created without expected prop '_cache'");
    		}

    		if (/*selected_task*/ ctx[0] === undefined && !("selected_task" in props)) {
    			console.warn("<SelectTaskHFT> was created without expected prop 'selected_task'");
    		}

    		if (/*selected_submission*/ ctx[1] === undefined && !("selected_submission" in props)) {
    			console.warn("<SelectTaskHFT> was created without expected prop 'selected_submission'");
    		}
    	}

    	get client() {
    		throw new Error("<SelectTaskHFT>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set client(value) {
    		throw new Error("<SelectTaskHFT>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get _cache() {
    		throw new Error("<SelectTaskHFT>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _cache(value) {
    		throw new Error("<SelectTaskHFT>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected_task() {
    		throw new Error("<SelectTaskHFT>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected_task(value) {
    		throw new Error("<SelectTaskHFT>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected_submission() {
    		throw new Error("<SelectTaskHFT>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected_submission(value) {
    		throw new Error("<SelectTaskHFT>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\QuizSubmissionInfo.svelte generated by Svelte v3.23.0 */

    const file$8 = "src\\components\\QuizSubmissionInfo.svelte";

    // (10:0) {#if submission}
    function create_if_block$5(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let br0;
    	let t0;
    	let span0;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*submission*/ ctx[0].id + "";
    	let t4;
    	let br1;
    	let t5;
    	let span2;
    	let t6;
    	let t7_value = /*submission*/ ctx[0].student_id + "";
    	let t7;
    	let br2;
    	let t8;
    	let span3;
    	let t9;
    	let t10_value = /*submission*/ ctx[0].student_name + "";
    	let t10;
    	let br3;
    	let t11;
    	let span4;
    	let t12;
    	let t13_value = /*submission*/ ctx[0].status + "";
    	let t13;
    	let br4;
    	let t14;
    	let span5;
    	let t15;
    	let t16_value = (/*submission*/ ctx[0].grade || "-") + "";
    	let t16;
    	let br5;
    	let t17;
    	let span6;
    	let t18;
    	let t19_value = (/*attempt1*/ ctx[1] || "0") + "";
    	let t19;
    	let t20;
    	let br6;
    	let t21;
    	let span7;
    	let t22;
    	let t23_value = (/*attempt2*/ ctx[2] || "0") + "";
    	let t23;
    	let t24;
    	let br7;
    	let t25;
    	let span8;
    	let t26;
    	let t27_value = (/*attempt3*/ ctx[3] || "0") + "";
    	let t27;
    	let t28;
    	let br8;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			br0 = element("br");
    			t0 = space();
    			span0 = element("span");
    			span0.textContent = "Student avatar";
    			t2 = space();
    			span1 = element("span");
    			t3 = text("ID: ");
    			t4 = text(t4_value);
    			br1 = element("br");
    			t5 = space();
    			span2 = element("span");
    			t6 = text("Student ID: ");
    			t7 = text(t7_value);
    			br2 = element("br");
    			t8 = space();
    			span3 = element("span");
    			t9 = text("Student name: ");
    			t10 = text(t10_value);
    			br3 = element("br");
    			t11 = space();
    			span4 = element("span");
    			t12 = text("Status: ");
    			t13 = text(t13_value);
    			br4 = element("br");
    			t14 = space();
    			span5 = element("span");
    			t15 = text("Score: ");
    			t16 = text(t16_value);
    			br5 = element("br");
    			t17 = space();
    			span6 = element("span");
    			t18 = text("Attempt 1: ");
    			t19 = text(t19_value);
    			t20 = text("%");
    			br6 = element("br");
    			t21 = space();
    			span7 = element("span");
    			t22 = text("Attempt 2: ");
    			t23 = text(t23_value);
    			t24 = text("%");
    			br7 = element("br");
    			t25 = space();
    			span8 = element("span");
    			t26 = text("Attempt 3: ");
    			t27 = text(t27_value);
    			t28 = text("%");
    			br8 = element("br");
    			attr_dev(img, "class", "avatar");
    			if (img.src !== (img_src_value = /*submission*/ ctx[0].student_avatar || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "avatar");
    			attr_dev(img, "width", "96");
    			attr_dev(img, "height", "96");
    			add_location(img, file$8, 12, 12, 695);
    			add_location(br0, file$8, 12, 163, 846);
    			add_location(span0, file$8, 13, 12, 864);
    			set_style(div0, "float", "right");
    			set_style(div0, "text-align", "right");
    			add_location(div0, file$8, 11, 8, 638);
    			add_location(span1, file$8, 15, 8, 917);
    			add_location(br1, file$8, 15, 40, 949);
    			add_location(span2, file$8, 16, 8, 963);
    			add_location(br2, file$8, 16, 56, 1011);
    			add_location(span3, file$8, 17, 8, 1025);
    			add_location(br3, file$8, 17, 60, 1077);
    			add_location(span4, file$8, 18, 8, 1091);
    			add_location(br4, file$8, 18, 48, 1131);
    			add_location(span5, file$8, 19, 8, 1145);
    			add_location(br5, file$8, 19, 53, 1190);
    			add_location(span6, file$8, 20, 8, 1204);
    			add_location(br6, file$8, 20, 50, 1246);
    			add_location(span7, file$8, 21, 8, 1260);
    			add_location(br7, file$8, 21, 50, 1302);
    			add_location(span8, file$8, 22, 8, 1316);
    			add_location(br8, file$8, 22, 50, 1358);
    			set_style(div1, "padding", "4px");
    			add_location(div1, file$8, 10, 4, 602);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, br0);
    			append_dev(div0, t0);
    			append_dev(div0, span0);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(div1, br1);
    			append_dev(div1, t5);
    			append_dev(div1, span2);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    			append_dev(div1, br2);
    			append_dev(div1, t8);
    			append_dev(div1, span3);
    			append_dev(span3, t9);
    			append_dev(span3, t10);
    			append_dev(div1, br3);
    			append_dev(div1, t11);
    			append_dev(div1, span4);
    			append_dev(span4, t12);
    			append_dev(span4, t13);
    			append_dev(div1, br4);
    			append_dev(div1, t14);
    			append_dev(div1, span5);
    			append_dev(span5, t15);
    			append_dev(span5, t16);
    			append_dev(div1, br5);
    			append_dev(div1, t17);
    			append_dev(div1, span6);
    			append_dev(span6, t18);
    			append_dev(span6, t19);
    			append_dev(span6, t20);
    			append_dev(div1, br6);
    			append_dev(div1, t21);
    			append_dev(div1, span7);
    			append_dev(span7, t22);
    			append_dev(span7, t23);
    			append_dev(span7, t24);
    			append_dev(div1, br7);
    			append_dev(div1, t25);
    			append_dev(div1, span8);
    			append_dev(span8, t26);
    			append_dev(span8, t27);
    			append_dev(span8, t28);
    			append_dev(div1, br8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*submission*/ 1 && img.src !== (img_src_value = /*submission*/ ctx[0].student_avatar || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*submission*/ 1 && t4_value !== (t4_value = /*submission*/ ctx[0].id + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*submission*/ 1 && t7_value !== (t7_value = /*submission*/ ctx[0].student_id + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*submission*/ 1 && t10_value !== (t10_value = /*submission*/ ctx[0].student_name + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*submission*/ 1 && t13_value !== (t13_value = /*submission*/ ctx[0].status + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*submission*/ 1 && t16_value !== (t16_value = (/*submission*/ ctx[0].grade || "-") + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*attempt1*/ 2 && t19_value !== (t19_value = (/*attempt1*/ ctx[1] || "0") + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*attempt2*/ 4 && t23_value !== (t23_value = (/*attempt2*/ ctx[2] || "0") + "")) set_data_dev(t23, t23_value);
    			if (dirty & /*attempt3*/ 8 && t27_value !== (t27_value = (/*attempt3*/ ctx[3] || "0") + "")) set_data_dev(t27, t27_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(10:0) {#if submission}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*submission*/ ctx[0] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*submission*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { submission } = $$props;
    	let { submission_questions } = $$props;
    	const writable_props = ["submission", "submission_questions"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QuizSubmissionInfo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("QuizSubmissionInfo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("submission" in $$props) $$invalidate(0, submission = $$props.submission);
    		if ("submission_questions" in $$props) $$invalidate(4, submission_questions = $$props.submission_questions);
    	};

    	$$self.$capture_state = () => ({
    		submission,
    		submission_questions,
    		attempt1,
    		attempt2,
    		attempt3
    	});

    	$$self.$inject_state = $$props => {
    		if ("submission" in $$props) $$invalidate(0, submission = $$props.submission);
    		if ("submission_questions" in $$props) $$invalidate(4, submission_questions = $$props.submission_questions);
    		if ("attempt1" in $$props) $$invalidate(1, attempt1 = $$props.attempt1);
    		if ("attempt2" in $$props) $$invalidate(2, attempt2 = $$props.attempt2);
    		if ("attempt3" in $$props) $$invalidate(3, attempt3 = $$props.attempt3);
    	};

    	let attempt1;
    	let attempt2;
    	let attempt3;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*submission_questions*/ 16) {
    			$$invalidate(1, attempt1 = Math.floor(submission_questions.filter(question => question.attempt1 && question.attempt1.correct).length / submission_questions.length * 100));
    		}

    		if ($$self.$$.dirty & /*submission_questions*/ 16) {
    			$$invalidate(2, attempt2 = Math.floor(submission_questions.filter(question => question.attempt2 && question.attempt2.correct).length / submission_questions.length * 100));
    		}

    		if ($$self.$$.dirty & /*submission_questions*/ 16) {
    			$$invalidate(3, attempt3 = Math.floor(submission_questions.filter(question => question.attempt3 && question.attempt3.correct).length / submission_questions.length * 100));
    		}
    	};

    	return [submission, attempt1, attempt2, attempt3, submission_questions];
    }

    class QuizSubmissionInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { submission: 0, submission_questions: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QuizSubmissionInfo",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*submission*/ ctx[0] === undefined && !("submission" in props)) {
    			console.warn("<QuizSubmissionInfo> was created without expected prop 'submission'");
    		}

    		if (/*submission_questions*/ ctx[4] === undefined && !("submission_questions" in props)) {
    			console.warn("<QuizSubmissionInfo> was created without expected prop 'submission_questions'");
    		}
    	}

    	get submission() {
    		throw new Error("<QuizSubmissionInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submission(value) {
    		throw new Error("<QuizSubmissionInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get submission_questions() {
    		throw new Error("<QuizSubmissionInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submission_questions(value) {
    		throw new Error("<QuizSubmissionInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Questions.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$3 } = globals;
    const file$7 = "src\\components\\Questions.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (27:16) {#each pool as question, i}
    function create_each_block$3(ctx) {
    	let tr;
    	let td0;
    	let button;
    	let t1;
    	let td1;
    	let t2_value = /*i*/ ctx[8] + 1 + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*question*/ ctx[6].description + "";
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*question*/ ctx[6], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			button = element("button");
    			button.textContent = "→";
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			add_location(button, file$7, 28, 28, 924);
    			add_location(td0, file$7, 28, 24, 920);
    			add_location(td1, file$7, 29, 24, 1012);
    			add_location(td2, file$7, 37, 24, 1585);
    			add_location(tr, file$7, 27, 20, 889);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, button);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*pool*/ 4 && t4_value !== (t4_value = /*question*/ ctx[6].description + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(27:16) {#each pool as question, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let label;
    	let t1;
    	let t2_value = /*pool*/ ctx[2].length + "";
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let t5;
    	let td1;
    	let t7;
    	let td2;
    	let t9;
    	let tbody;
    	let mounted;
    	let dispose;
    	let each_value = /*pool*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text("Filter (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			t4 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			t5 = space();
    			td1 = element("td");
    			td1.textContent = "#";
    			t7 = space();
    			td2 = element("td");
    			td2.textContent = "Question";
    			t9 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "name", "filter");
    			add_location(input, file$7, 12, 8, 396);
    			attr_dev(label, "for", "filter");
    			add_location(label, file$7, 13, 8, 447);
    			attr_dev(div0, "class", "selector-list-header");
    			add_location(div0, file$7, 11, 4, 352);
    			add_location(td0, file$7, 19, 20, 630);
    			add_location(td1, file$7, 20, 20, 661);
    			add_location(td2, file$7, 22, 20, 739);
    			add_location(tr, file$7, 18, 16, 604);
    			add_location(thead, file$7, 17, 12, 579);
    			add_location(tbody, file$7, 25, 12, 815);
    			add_location(table, file$7, 16, 8, 558);
    			attr_dev(div1, "class", "selector-list-table");
    			add_location(div1, file$7, 15, 4, 515);
    			attr_dev(div2, "class", "selector-list");
    			add_location(div2, file$7, 10, 0, 319);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*filter*/ ctx[1]);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			append_dev(label, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t5);
    			append_dev(tr, td1);
    			append_dev(tr, t7);
    			append_dev(tr, td2);
    			append_dev(table, t9);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*filter*/ 2 && input.value !== /*filter*/ ctx[1]) {
    				set_input_value(input, /*filter*/ ctx[1]);
    			}

    			if (dirty & /*pool*/ 4 && t2_value !== (t2_value = /*pool*/ ctx[2].length + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*pool, selected*/ 5) {
    				each_value = /*pool*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { questions } = $$props;
    	let { selected = null } = $$props;
    	let filter = "";
    	const writable_props = ["questions", "selected"];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Questions> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Questions", $$slots, []);

    	function input_input_handler() {
    		filter = this.value;
    		$$invalidate(1, filter);
    	}

    	const click_handler = question => $$invalidate(0, selected = question);

    	$$self.$set = $$props => {
    		if ("questions" in $$props) $$invalidate(3, questions = $$props.questions);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({ questions, selected, filter, pool });

    	$$self.$inject_state = $$props => {
    		if ("questions" in $$props) $$invalidate(3, questions = $$props.questions);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("filter" in $$props) $$invalidate(1, filter = $$props.filter);
    		if ("pool" in $$props) $$invalidate(2, pool = $$props.pool);
    	};

    	let pool;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filter, questions*/ 10) {
    			$$invalidate(2, pool = filter
    			? Object.values(questions).filter(question => question.description.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
    			: Object.values(questions));
    		}
    	};

    	return [selected, filter, pool, questions, input_input_handler, click_handler];
    }

    class Questions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { questions: 3, selected: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Questions",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*questions*/ ctx[3] === undefined && !("questions" in props)) {
    			console.warn("<Questions> was created without expected prop 'questions'");
    		}
    	}

    	get questions() {
    		throw new Error("<Questions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set questions(value) {
    		throw new Error("<Questions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Questions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Questions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\QuestionInfo.svelte generated by Svelte v3.23.0 */

    const file$6 = "src\\components\\QuestionInfo.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (8:0) {#if question}
    function create_if_block$4(ctx) {
    	let span0;
    	let t0;
    	let t1_value = /*question*/ ctx[0].id + "";
    	let t1;
    	let br;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*question*/ ctx[0].description + "";
    	let t4;
    	let t5;
    	let table;
    	let thead;
    	let td0;
    	let t7;
    	let td1;
    	let t9;
    	let td2;
    	let t11;
    	let tbody;
    	let each_value = /*question*/ ctx[0].options;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text("ID: ");
    			t1 = text(t1_value);
    			br = element("br");
    			t2 = space();
    			span1 = element("span");
    			t3 = text("Question: ");
    			t4 = text(t4_value);
    			t5 = space();
    			table = element("table");
    			thead = element("thead");
    			td0 = element("td");
    			td0.textContent = "#";
    			t7 = space();
    			td1 = element("td");
    			td1.textContent = "Attempts";
    			t9 = space();
    			td2 = element("td");
    			td2.textContent = "Option";
    			t11 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(span0, file$6, 8, 4, 190);
    			add_location(br, file$6, 8, 34, 220);
    			add_location(span1, file$6, 9, 4, 230);
    			add_location(td0, file$6, 12, 12, 319);
    			add_location(td1, file$6, 13, 12, 343);
    			add_location(td2, file$6, 14, 12, 374);
    			add_location(thead, file$6, 11, 8, 298);
    			add_location(tbody, file$6, 16, 8, 417);
    			attr_dev(table, "class", "svelte-1orupmp");
    			add_location(table, file$6, 10, 4, 281);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, td0);
    			append_dev(thead, t7);
    			append_dev(thead, td1);
    			append_dev(thead, t9);
    			append_dev(thead, td2);
    			append_dev(table, t11);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*question*/ 1 && t1_value !== (t1_value = /*question*/ ctx[0].id + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*question*/ 1 && t4_value !== (t4_value = /*question*/ ctx[0].description + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*question, submission_question, chars*/ 7) {
    				each_value = /*question*/ ctx[0].options;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(8:0) {#if question}",
    		ctx
    	});

    	return block;
    }

    // (22:24) {#if submission_question}
    function create_if_block_1$2(ctx) {
    	let t0_value = (/*submission_question*/ ctx[1].attempt1 && /*submission_question*/ ctx[1].attempt1.answer === /*option*/ ctx[3]
    	? "1"
    	: "") + "";

    	let t0;
    	let t1;

    	let t2_value = (/*submission_question*/ ctx[1].attempt2 && /*submission_question*/ ctx[1].attempt2.answer === /*option*/ ctx[3]
    	? "2"
    	: "") + "";

    	let t2;
    	let t3;

    	let t4_value = (/*submission_question*/ ctx[1].attempt3 && /*submission_question*/ ctx[1].attempt3.answer === /*option*/ ctx[3]
    	? "3"
    	: "") + "";

    	let t4;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*submission_question, question*/ 3 && t0_value !== (t0_value = (/*submission_question*/ ctx[1].attempt1 && /*submission_question*/ ctx[1].attempt1.answer === /*option*/ ctx[3]
    			? "1"
    			: "") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*submission_question, question*/ 3 && t2_value !== (t2_value = (/*submission_question*/ ctx[1].attempt2 && /*submission_question*/ ctx[1].attempt2.answer === /*option*/ ctx[3]
    			? "2"
    			: "") + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*submission_question, question*/ 3 && t4_value !== (t4_value = (/*submission_question*/ ctx[1].attempt3 && /*submission_question*/ ctx[1].attempt3.answer === /*option*/ ctx[3]
    			? "3"
    			: "") + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(22:24) {#if submission_question}",
    		ctx
    	});

    	return block;
    }

    // (18:12) {#each question.options as option, i}
    function create_each_block$2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*chars*/ ctx[2][/*i*/ ctx[5]] + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2;
    	let td2;
    	let t3_value = /*option*/ ctx[3] + "";
    	let t3;
    	let t4;
    	let tr_class_value;
    	let if_block = /*submission_question*/ ctx[1] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			if (if_block) if_block.c();
    			t2 = space();
    			td2 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			add_location(td0, file$6, 19, 20, 600);
    			add_location(td1, file$6, 20, 20, 641);
    			add_location(td2, file$6, 27, 20, 1139);

    			attr_dev(tr, "class", tr_class_value = "" + (null_to_empty(/*option*/ ctx[3] === /*question*/ ctx[0].correct_answer
    			? "option-correct"
    			: "option-wrong") + " svelte-1orupmp"));

    			add_location(tr, file$6, 18, 16, 493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			if (if_block) if_block.m(td1, null);
    			append_dev(tr, t2);
    			append_dev(tr, td2);
    			append_dev(td2, t3);
    			append_dev(tr, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (/*submission_question*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(td1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*question*/ 1 && t3_value !== (t3_value = /*option*/ ctx[3] + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*question*/ 1 && tr_class_value !== (tr_class_value = "" + (null_to_empty(/*option*/ ctx[3] === /*question*/ ctx[0].correct_answer
    			? "option-correct"
    			: "option-wrong") + " svelte-1orupmp"))) {
    				attr_dev(tr, "class", tr_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(18:12) {#each question.options as option, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let if_block = /*question*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*question*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { question } = $$props;
    	let { submission_question } = $$props;
    	let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    	const writable_props = ["question", "submission_question"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QuestionInfo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("QuestionInfo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("question" in $$props) $$invalidate(0, question = $$props.question);
    		if ("submission_question" in $$props) $$invalidate(1, submission_question = $$props.submission_question);
    	};

    	$$self.$capture_state = () => ({ question, submission_question, chars });

    	$$self.$inject_state = $$props => {
    		if ("question" in $$props) $$invalidate(0, question = $$props.question);
    		if ("submission_question" in $$props) $$invalidate(1, submission_question = $$props.submission_question);
    		if ("chars" in $$props) $$invalidate(2, chars = $$props.chars);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [question, submission_question, chars];
    }

    class QuestionInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { question: 0, submission_question: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QuestionInfo",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*question*/ ctx[0] === undefined && !("question" in props)) {
    			console.warn("<QuestionInfo> was created without expected prop 'question'");
    		}

    		if (/*submission_question*/ ctx[1] === undefined && !("submission_question" in props)) {
    			console.warn("<QuestionInfo> was created without expected prop 'submission_question'");
    		}
    	}

    	get question() {
    		throw new Error("<QuestionInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set question(value) {
    		throw new Error("<QuestionInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get submission_question() {
    		throw new Error("<QuestionInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submission_question(value) {
    		throw new Error("<QuestionInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\QuizInfo.svelte generated by Svelte v3.23.0 */

    const file$5 = "src\\components\\QuizInfo.svelte";

    // (5:0) {#if assignment}
    function create_if_block$3(ctx) {
    	let span0;
    	let t0;
    	let t1_value = /*assignment*/ ctx[0].id + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*assignment*/ ctx[0].title + "";
    	let t4;
    	let t5;
    	let span2;
    	let t6;
    	let t7_value = /*assignment*/ ctx[0].teacher_name + "";
    	let t7;
    	let t8;
    	let span3;
    	let t9;
    	let t10_value = /*assignment*/ ctx[0].class_group_name + "";
    	let t10;
    	let t11;
    	let span4;
    	let t12;
    	let t13_value = /*assignment*/ ctx[0].class_year + "";
    	let t13;
    	let t14;
    	let span5;
    	let t15;
    	let t16_value = /*assignment*/ ctx[0].type + "";
    	let t16;
    	let t17;
    	let span6;
    	let t18;
    	let t19_value = new Date(/*assignment*/ ctx[0].issued_on).toLocaleDateString() + "";
    	let t19;
    	let t20;
    	let span7;
    	let t21;
    	let t22_value = new Date(/*assignment*/ ctx[0].due_on).toLocaleDateString() + "";
    	let t22;
    	let t23;
    	let span8;
    	let t24;
    	let t25_value = /*assignment*/ ctx[0].question_ids.length + "";
    	let t25;
    	let t26;
    	let span9;
    	let t27;
    	let t28_value = /*assignment*/ ctx[0].random_order + "";
    	let t28;
    	let t29;
    	let span10;
    	let t30;
    	let t31_value = /*assignment*/ ctx[0].questions_time_limit + "";
    	let t31;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = text("ID: ");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text("Title: ");
    			t4 = text(t4_value);
    			t5 = space();
    			span2 = element("span");
    			t6 = text("Teacher: ");
    			t7 = text(t7_value);
    			t8 = space();
    			span3 = element("span");
    			t9 = text("Group: ");
    			t10 = text(t10_value);
    			t11 = space();
    			span4 = element("span");
    			t12 = text("Year: ");
    			t13 = text(t13_value);
    			t14 = space();
    			span5 = element("span");
    			t15 = text("Type: ");
    			t16 = text(t16_value);
    			t17 = space();
    			span6 = element("span");
    			t18 = text("Issued: ");
    			t19 = text(t19_value);
    			t20 = space();
    			span7 = element("span");
    			t21 = text("Due: ");
    			t22 = text(t22_value);
    			t23 = space();
    			span8 = element("span");
    			t24 = text("Questions: ");
    			t25 = text(t25_value);
    			t26 = space();
    			span9 = element("span");
    			t27 = text("Random order: ");
    			t28 = text(t28_value);
    			t29 = space();
    			span10 = element("span");
    			t30 = text("Time limit: ");
    			t31 = text(t31_value);
    			add_location(span0, file$5, 5, 4, 73);
    			add_location(span1, file$5, 6, 4, 111);
    			add_location(span2, file$5, 7, 4, 155);
    			add_location(span3, file$5, 8, 4, 208);
    			add_location(span4, file$5, 9, 4, 263);
    			add_location(span5, file$5, 10, 4, 311);
    			add_location(span6, file$5, 11, 4, 353);
    			add_location(span7, file$5, 12, 4, 433);
    			add_location(span8, file$5, 13, 4, 507);
    			add_location(span9, file$5, 14, 4, 569);
    			add_location(span10, file$5, 15, 4, 627);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, span3, anchor);
    			append_dev(span3, t9);
    			append_dev(span3, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, span4, anchor);
    			append_dev(span4, t12);
    			append_dev(span4, t13);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, span5, anchor);
    			append_dev(span5, t15);
    			append_dev(span5, t16);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, span6, anchor);
    			append_dev(span6, t18);
    			append_dev(span6, t19);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, span7, anchor);
    			append_dev(span7, t21);
    			append_dev(span7, t22);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, span8, anchor);
    			append_dev(span8, t24);
    			append_dev(span8, t25);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, span9, anchor);
    			append_dev(span9, t27);
    			append_dev(span9, t28);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, span10, anchor);
    			append_dev(span10, t30);
    			append_dev(span10, t31);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*assignment*/ 1 && t1_value !== (t1_value = /*assignment*/ ctx[0].id + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*assignment*/ 1 && t4_value !== (t4_value = /*assignment*/ ctx[0].title + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*assignment*/ 1 && t7_value !== (t7_value = /*assignment*/ ctx[0].teacher_name + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*assignment*/ 1 && t10_value !== (t10_value = /*assignment*/ ctx[0].class_group_name + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*assignment*/ 1 && t13_value !== (t13_value = /*assignment*/ ctx[0].class_year + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*assignment*/ 1 && t16_value !== (t16_value = /*assignment*/ ctx[0].type + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*assignment*/ 1 && t19_value !== (t19_value = new Date(/*assignment*/ ctx[0].issued_on).toLocaleDateString() + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*assignment*/ 1 && t22_value !== (t22_value = new Date(/*assignment*/ ctx[0].due_on).toLocaleDateString() + "")) set_data_dev(t22, t22_value);
    			if (dirty & /*assignment*/ 1 && t25_value !== (t25_value = /*assignment*/ ctx[0].question_ids.length + "")) set_data_dev(t25, t25_value);
    			if (dirty & /*assignment*/ 1 && t28_value !== (t28_value = /*assignment*/ ctx[0].random_order + "")) set_data_dev(t28, t28_value);
    			if (dirty & /*assignment*/ 1 && t31_value !== (t31_value = /*assignment*/ ctx[0].questions_time_limit + "")) set_data_dev(t31, t31_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(span4);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(span5);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(span6);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(span7);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(span8);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(span9);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(span10);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(5:0) {#if assignment}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let if_block = /*assignment*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*assignment*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { assignment } = $$props;
    	const writable_props = ["assignment"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QuizInfo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("QuizInfo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("assignment" in $$props) $$invalidate(0, assignment = $$props.assignment);
    	};

    	$$self.$capture_state = () => ({ assignment });

    	$$self.$inject_state = $$props => {
    		if ("assignment" in $$props) $$invalidate(0, assignment = $$props.assignment);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [assignment];
    }

    class QuizInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { assignment: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QuizInfo",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*assignment*/ ctx[0] === undefined && !("assignment" in props)) {
    			console.warn("<QuizInfo> was created without expected prop 'assignment'");
    		}
    	}

    	get assignment() {
    		throw new Error("<QuizInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set assignment(value) {
    		throw new Error("<QuizInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\SelectTaskQuiz.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$2 } = globals;
    const file$4 = "src\\pages\\SelectTaskQuiz.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (26:0) {#if assignment}
    function create_if_block$2(ctx) {
    	let div15;
    	let div2;
    	let div0;
    	let div0_class_value;
    	let t0;
    	let div1;
    	let a;
    	let br0;
    	let t2;
    	let html_tag;
    	let raw_value = /*selected_task*/ ctx[0].description + "";
    	let br1;
    	let t3;
    	let t4;
    	let div7;
    	let div3;
    	let span0;
    	let t6;
    	let updating_selected;
    	let t7;
    	let div6;
    	let div4;
    	let span1;
    	let t9;
    	let div5;
    	let t10;
    	let div9;
    	let div8;
    	let span2;
    	let t12;
    	let t13;
    	let div14;
    	let div11;
    	let div10;
    	let span3;
    	let t15;
    	let t16;
    	let div13;
    	let div12;
    	let span4;
    	let t18;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*selected_task*/ ctx[0].class_task_type === "Quiz" && create_if_block_3(ctx);
    	let each_value = /*assignment*/ ctx[4].web_links;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	function questions_1_selected_binding(value) {
    		/*questions_1_selected_binding*/ ctx[11].call(null, value);
    	}

    	let questions_1_props = { questions: /*questions*/ ctx[6] };

    	if (/*selected_question*/ ctx[1] !== void 0) {
    		questions_1_props.selected = /*selected_question*/ ctx[1];
    	}

    	const questions_1 = new Questions({ props: questions_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(questions_1, "selected", questions_1_selected_binding));

    	const questioninfo = new QuestionInfo({
    			props: {
    				question: /*selected_question*/ ctx[1],
    				submission_question: /*submission_question*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const quizinfo = new QuizInfo({
    			props: { assignment: /*assignment*/ ctx[4] },
    			$$inline: true
    		});

    	let if_block1 = /*submission*/ ctx[5] && create_if_block_2$1(ctx);
    	let if_block2 = /*submission*/ ctx[5] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			a = element("a");
    			a.textContent = "Back";
    			br0 = element("br");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div7 = element("div");
    			div3 = element("div");
    			span0 = element("span");
    			span0.textContent = "Questions";
    			t6 = space();
    			create_component(questions_1.$$.fragment);
    			t7 = space();
    			div6 = element("div");
    			div4 = element("div");
    			span1 = element("span");
    			span1.textContent = "Selected";
    			t9 = space();
    			div5 = element("div");
    			create_component(questioninfo.$$.fragment);
    			t10 = space();
    			div9 = element("div");
    			div8 = element("div");
    			span2 = element("span");
    			span2.textContent = "Information";
    			t12 = space();
    			create_component(quizinfo.$$.fragment);
    			t13 = space();
    			div14 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			span3 = element("span");
    			span3.textContent = "Submission";
    			t15 = space();
    			if (if_block1) if_block1.c();
    			t16 = space();
    			div13 = element("div");
    			div12 = element("div");
    			span4 = element("span");
    			span4.textContent = "Comments";
    			t18 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div0, "class", div0_class_value = "page-content-title task-title task-title-" + /*selected_task*/ ctx[0].class_task_type.toLowerCase());
    			add_location(div0, file$4, 28, 12, 1601);
    			attr_dev(a, "href", "##");
    			add_location(a, file$4, 34, 16, 2001);
    			add_location(br0, file$4, 34, 75, 2060);
    			html_tag = new HtmlTag(br1);
    			add_location(br1, file$4, 35, 49, 2115);
    			attr_dev(div1, "id", "task-description");
    			attr_dev(div1, "class", "svelte-139622w");
    			add_location(div1, file$4, 33, 12, 1956);
    			attr_dev(div2, "class", "page-section column svelte-139622w");
    			attr_dev(div2, "id", "section-description");
    			add_location(div2, file$4, 27, 8, 1529);
    			add_location(span0, file$4, 43, 16, 2453);
    			attr_dev(div3, "class", "page-content-title");
    			add_location(div3, file$4, 42, 12, 2403);
    			add_location(span1, file$4, 48, 20, 2679);
    			attr_dev(div4, "class", "page-content-title");
    			add_location(div4, file$4, 47, 16, 2625);
    			set_style(div5, "overflow", "auto");
    			add_location(div5, file$4, 50, 16, 2742);
    			attr_dev(div6, "class", "page-content");
    			add_location(div6, file$4, 46, 12, 2581);
    			attr_dev(div7, "class", "page-section column svelte-139622w");
    			attr_dev(div7, "id", "section-questions");
    			add_location(div7, file$4, 41, 8, 2333);
    			add_location(span2, file$4, 57, 16, 3050);
    			attr_dev(div8, "class", "page-content-title");
    			add_location(div8, file$4, 56, 12, 3000);
    			attr_dev(div9, "class", "page-section column svelte-139622w");
    			attr_dev(div9, "id", "section-information");
    			add_location(div9, file$4, 55, 8, 2928);
    			add_location(span3, file$4, 64, 20, 3321);
    			attr_dev(div10, "class", "page-content-title");
    			add_location(div10, file$4, 63, 16, 3267);
    			attr_dev(div11, "class", "page-content");
    			add_location(div11, file$4, 62, 12, 3223);
    			add_location(span4, file$4, 72, 20, 3636);
    			attr_dev(div12, "class", "page-content-title");
    			add_location(div12, file$4, 71, 16, 3582);
    			attr_dev(div13, "class", "page-content");
    			add_location(div13, file$4, 70, 12, 3538);
    			attr_dev(div14, "class", "page-section svelte-139622w");
    			attr_dev(div14, "id", "section-submissions");
    			add_location(div14, file$4, 61, 8, 3158);
    			attr_dev(div15, "class", "page svelte-139622w");
    			attr_dev(div15, "id", "page-selected-quiz");
    			add_location(div15, file$4, 26, 1, 1477);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, div2);
    			append_dev(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, a);
    			append_dev(div1, br0);
    			append_dev(div1, t2);
    			html_tag.m(raw_value, div1);
    			append_dev(div1, br1);
    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div15, t4);
    			append_dev(div15, div7);
    			append_dev(div7, div3);
    			append_dev(div3, span0);
    			append_dev(div7, t6);
    			mount_component(questions_1, div7, null);
    			append_dev(div7, t7);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, span1);
    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			mount_component(questioninfo, div5, null);
    			append_dev(div15, t10);
    			append_dev(div15, div9);
    			append_dev(div9, div8);
    			append_dev(div8, span2);
    			append_dev(div9, t12);
    			mount_component(quizinfo, div9, null);
    			append_dev(div15, t13);
    			append_dev(div15, div14);
    			append_dev(div14, div11);
    			append_dev(div11, div10);
    			append_dev(div10, span3);
    			append_dev(div11, t15);
    			if (if_block1) if_block1.m(div11, null);
    			append_dev(div14, t16);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, span4);
    			append_dev(div13, t18);
    			if (if_block2) if_block2.m(div13, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*selected_task*/ ctx[0].class_task_type === "Quiz") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty & /*selected_task*/ 1 && div0_class_value !== (div0_class_value = "page-content-title task-title task-title-" + /*selected_task*/ ctx[0].class_task_type.toLowerCase())) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if ((!current || dirty & /*selected_task*/ 1) && raw_value !== (raw_value = /*selected_task*/ ctx[0].description + "")) html_tag.p(raw_value);

    			if (dirty & /*assignment*/ 16) {
    				each_value = /*assignment*/ ctx[4].web_links;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const questions_1_changes = {};
    			if (dirty & /*questions*/ 64) questions_1_changes.questions = /*questions*/ ctx[6];

    			if (!updating_selected && dirty & /*selected_question*/ 2) {
    				updating_selected = true;
    				questions_1_changes.selected = /*selected_question*/ ctx[1];
    				add_flush_callback(() => updating_selected = false);
    			}

    			questions_1.$set(questions_1_changes);
    			const questioninfo_changes = {};
    			if (dirty & /*selected_question*/ 2) questioninfo_changes.question = /*selected_question*/ ctx[1];
    			if (dirty & /*submission_question*/ 4) questioninfo_changes.submission_question = /*submission_question*/ ctx[2];
    			questioninfo.$set(questioninfo_changes);
    			const quizinfo_changes = {};
    			if (dirty & /*assignment*/ 16) quizinfo_changes.assignment = /*assignment*/ ctx[4];
    			quizinfo.$set(quizinfo_changes);

    			if (/*submission*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*submission*/ 32) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div11, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*submission*/ ctx[5]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*submission*/ 32) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div13, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(questions_1.$$.fragment, local);
    			transition_in(questioninfo.$$.fragment, local);
    			transition_in(quizinfo.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(questions_1.$$.fragment, local);
    			transition_out(questioninfo.$$.fragment, local);
    			transition_out(quizinfo.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			destroy_component(questions_1);
    			destroy_component(questioninfo);
    			destroy_component(quizinfo);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(26:0) {#if assignment}",
    		ctx
    	});

    	return block;
    }

    // (30:16) {#if selected_task.class_task_type === "Quiz"}
    function create_if_block_3(ctx) {
    	let a;
    	let span;
    	let t_value = /*assignment*/ ctx[4].title + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$4, 30, 97, 1864);
    			attr_dev(a, "href", a_href_value = "https://www.satchelone.com/quizzes/" + /*assignment*/ ctx[4].id);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$4, 30, 20, 1787);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*assignment*/ 16 && t_value !== (t_value = /*assignment*/ ctx[4].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*assignment*/ 16 && a_href_value !== (a_href_value = "https://www.satchelone.com/quizzes/" + /*assignment*/ ctx[4].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(30:16) {#if selected_task.class_task_type === \\\"Quiz\\\"}",
    		ctx
    	});

    	return block;
    }

    // (37:16) {#each assignment.web_links as web_link}
    function create_each_block$1(ctx) {
    	let a;
    	let t_value = /*web_link*/ ctx[12].url + "";
    	let t;
    	let a_href_value;
    	let br;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			br = element("br");
    			attr_dev(a, "href", a_href_value = /*web_link*/ ctx[12].url);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$4, 37, 20, 2199);
    			add_location(br, file$4, 37, 79, 2258);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*assignment*/ 16 && t_value !== (t_value = /*web_link*/ ctx[12].url + "")) set_data_dev(t, t_value);

    			if (dirty & /*assignment*/ 16 && a_href_value !== (a_href_value = /*web_link*/ ctx[12].url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(37:16) {#each assignment.web_links as web_link}",
    		ctx
    	});

    	return block;
    }

    // (67:16) {#if submission}
    function create_if_block_2$1(ctx) {
    	let current;

    	const quizsubmissioninfo = new QuizSubmissionInfo({
    			props: {
    				submission: /*submission*/ ctx[5],
    				submission_questions: /*submission_questions*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(quizsubmissioninfo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(quizsubmissioninfo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const quizsubmissioninfo_changes = {};
    			if (dirty & /*submission*/ 32) quizsubmissioninfo_changes.submission = /*submission*/ ctx[5];
    			if (dirty & /*submission_questions*/ 8) quizsubmissioninfo_changes.submission_questions = /*submission_questions*/ ctx[3];
    			quizsubmissioninfo.$set(quizsubmissioninfo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(quizsubmissioninfo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(quizsubmissioninfo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(quizsubmissioninfo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(67:16) {#if submission}",
    		ctx
    	});

    	return block;
    }

    // (75:16) {#if submission}
    function create_if_block_1$1(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let current;

    	const comments_1 = new Comments({
    			props: {
    				comments: /*comments*/ ctx[7],
    				submission: /*submission*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const commentinput = new CommentInput({
    			props: { submission: /*submission*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(comments_1.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(commentinput.$$.fragment);
    			attr_dev(div0, "class", "scroll");
    			set_style(div0, "flex", "1 1 0");
    			add_location(div0, file$4, 75, 20, 3737);
    			set_style(div1, "flex-direction", "column");
    			set_style(div1, "flex", "1 1 0");
    			add_location(div1, file$4, 78, 20, 3888);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(comments_1, div0, null);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(commentinput, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const comments_1_changes = {};
    			if (dirty & /*comments*/ 128) comments_1_changes.comments = /*comments*/ ctx[7];
    			if (dirty & /*submission*/ 32) comments_1_changes.submission = /*submission*/ ctx[5];
    			comments_1.$set(comments_1_changes);
    			const commentinput_changes = {};
    			if (dirty & /*submission*/ 32) commentinput_changes.submission = /*submission*/ ctx[5];
    			commentinput.$set(commentinput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(comments_1.$$.fragment, local);
    			transition_in(commentinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(comments_1.$$.fragment, local);
    			transition_out(commentinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(comments_1);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_component(commentinput);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(75:16) {#if submission}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*assignment*/ ctx[4] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*assignment*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*assignment*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { client } = $$props;
    	let { _cache } = $$props;
    	let { selected_task } = $$props;
    	let selected_question;
    	const writable_props = ["client", "_cache", "selected_task"];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SelectTaskQuiz> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SelectTaskQuiz", $$slots, []);
    	const click_handler = () => $$invalidate(0, selected_task = null);

    	function questions_1_selected_binding(value) {
    		selected_question = value;
    		$$invalidate(1, selected_question);
    	}

    	$$self.$set = $$props => {
    		if ("client" in $$props) $$invalidate(8, client = $$props.client);
    		if ("_cache" in $$props) $$invalidate(9, _cache = $$props._cache);
    		if ("selected_task" in $$props) $$invalidate(0, selected_task = $$props.selected_task);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		QuizSubmissionInfo,
    		Comments,
    		CommentInput,
    		Questions,
    		QuestionInfo,
    		QuizInfo,
    		client,
    		_cache,
    		selected_task,
    		selected_question,
    		submission_question,
    		submission_questions,
    		assignment,
    		submission,
    		questions,
    		comments
    	});

    	$$self.$inject_state = $$props => {
    		if ("client" in $$props) $$invalidate(8, client = $$props.client);
    		if ("_cache" in $$props) $$invalidate(9, _cache = $$props._cache);
    		if ("selected_task" in $$props) $$invalidate(0, selected_task = $$props.selected_task);
    		if ("selected_question" in $$props) $$invalidate(1, selected_question = $$props.selected_question);
    		if ("submission_question" in $$props) $$invalidate(2, submission_question = $$props.submission_question);
    		if ("submission_questions" in $$props) $$invalidate(3, submission_questions = $$props.submission_questions);
    		if ("assignment" in $$props) $$invalidate(4, assignment = $$props.assignment);
    		if ("submission" in $$props) $$invalidate(5, submission = $$props.submission);
    		if ("questions" in $$props) $$invalidate(6, questions = $$props.questions);
    		if ("comments" in $$props) $$invalidate(7, comments = $$props.comments);
    	};

    	let submission_question;
    	let assignment;
    	let submission;
    	let questions;
    	let comments;
    	let submission_questions;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selected_task, _cache*/ 513) {
    			$$invalidate(4, assignment = selected_task
    			? _cache.assignments[selected_task.class_task_id]
    			: null);
    		}

    		if ($$self.$$.dirty & /*assignment, _cache, client*/ 784) {
    			$$invalidate(5, submission = assignment
    			? Object.values(_cache.submissions).filter(submission => submission.student_id === client.student.id)[0]
    			: null);
    		}

    		if ($$self.$$.dirty & /*submission, _cache, assignment*/ 560) {
    			$$invalidate(3, submission_questions = submission
    			? Object.values(_cache.submission_questions).filter(question => assignment.question_ids.indexOf(question.quiz_question_id) !== -1)
    			: []);
    		}

    		if ($$self.$$.dirty & /*submission_questions, selected_question*/ 10) {
    			$$invalidate(2, submission_question = submission_questions && selected_question
    			? submission_questions.filter(question => question.quiz_question_id === selected_question.id)[0]
    			: null);
    		}

    		if ($$self.$$.dirty & /*assignment, _cache*/ 528) {
    			$$invalidate(6, questions = assignment
    			? Object.values(_cache.questions).filter(question => assignment.question_ids.indexOf(question.id) !== -1)
    			: []);
    		}

    		if ($$self.$$.dirty & /*submission, _cache*/ 544) {
    			$$invalidate(7, comments = submission
    			? Object.values(_cache.comments).filter(comment => submission.comment_ids.indexOf(comment.id) !== -1)
    			: []);
    		}
    	};

    	return [
    		selected_task,
    		selected_question,
    		submission_question,
    		submission_questions,
    		assignment,
    		submission,
    		questions,
    		comments,
    		client,
    		_cache,
    		click_handler,
    		questions_1_selected_binding
    	];
    }

    class SelectTaskQuiz extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { client: 8, _cache: 9, selected_task: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectTaskQuiz",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*client*/ ctx[8] === undefined && !("client" in props)) {
    			console.warn("<SelectTaskQuiz> was created without expected prop 'client'");
    		}

    		if (/*_cache*/ ctx[9] === undefined && !("_cache" in props)) {
    			console.warn("<SelectTaskQuiz> was created without expected prop '_cache'");
    		}

    		if (/*selected_task*/ ctx[0] === undefined && !("selected_task" in props)) {
    			console.warn("<SelectTaskQuiz> was created without expected prop 'selected_task'");
    		}
    	}

    	get client() {
    		throw new Error("<SelectTaskQuiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set client(value) {
    		throw new Error("<SelectTaskQuiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get _cache() {
    		throw new Error("<SelectTaskQuiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _cache(value) {
    		throw new Error("<SelectTaskQuiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected_task() {
    		throw new Error("<SelectTaskQuiz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected_task(value) {
    		throw new Error("<SelectTaskQuiz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SelectTasks.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$1 } = globals;
    const file$3 = "src\\components\\SelectTasks.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[24] = i;
    	return child_ctx;
    }

    // (70:16) {#each pool as task, i}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let input;
    	let input_checked_value;
    	let input_disabled_value;
    	let t0;
    	let td1;
    	let t1_value = new Date(/*task*/ ctx[22].due_on).toLocaleDateString() + "";
    	let t1;
    	let t2;
    	let td2;
    	let t3_value = /*task*/ ctx[22].class_group_name + "";
    	let t3;
    	let t4;
    	let td3;
    	let t5_value = /*task*/ ctx[22].subject + "";
    	let t5;
    	let t6;
    	let td4;
    	let t7_value = /*task*/ ctx[22].teacher_name + "";
    	let t7;
    	let t8;
    	let td5;
    	let t9_value = /*task*/ ctx[22].class_task_title + "";
    	let t9;
    	let t10;
    	let tr_class_value;
    	let mounted;
    	let dispose;

    	function change_handler_1(...args) {
    		return /*change_handler_1*/ ctx[21](/*task*/ ctx[22], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			input = element("input");
    			t0 = space();
    			td1 = element("td");
    			t1 = text(t1_value);
    			t2 = space();
    			td2 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			td3 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			td4 = element("td");
    			t7 = text(t7_value);
    			t8 = space();
    			td5 = element("td");
    			t9 = text(t9_value);
    			t10 = space();
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = /*selected_tasks*/ ctx[9][/*task*/ ctx[22].id];
    			input.disabled = input_disabled_value = /*max*/ ctx[1] && /*selected*/ ctx[0].length >= /*max*/ ctx[1] && !/*selected_tasks*/ ctx[9][/*task*/ ctx[22].id];
    			add_location(input, file$3, 71, 28, 3310);
    			add_location(td0, file$3, 71, 24, 3306);
    			add_location(td1, file$3, 77, 24, 3714);
    			add_location(td2, file$3, 78, 24, 3793);
    			add_location(td3, file$3, 79, 24, 3851);
    			add_location(td4, file$3, 80, 24, 3900);
    			add_location(td5, file$3, 81, 24, 3954);
    			attr_dev(tr, "class", tr_class_value = "task-" + /*task*/ ctx[22].class_task_type.toLowerCase() + " svelte-1d36sq");
    			add_location(tr, file$3, 70, 20, 3226);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, input);
    			append_dev(tr, t0);
    			append_dev(tr, td1);
    			append_dev(td1, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td2);
    			append_dev(td2, t3);
    			append_dev(tr, t4);
    			append_dev(tr, td3);
    			append_dev(td3, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td4);
    			append_dev(td4, t7);
    			append_dev(tr, t8);
    			append_dev(tr, td5);
    			append_dev(td5, t9);
    			append_dev(tr, t10);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", change_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*selected_tasks, pool*/ 768 && input_checked_value !== (input_checked_value = /*selected_tasks*/ ctx[9][/*task*/ ctx[22].id])) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*max, selected, selected_tasks, pool*/ 771 && input_disabled_value !== (input_disabled_value = /*max*/ ctx[1] && /*selected*/ ctx[0].length >= /*max*/ ctx[1] && !/*selected_tasks*/ ctx[9][/*task*/ ctx[22].id])) {
    				prop_dev(input, "disabled", input_disabled_value);
    			}

    			if (dirty & /*pool*/ 256 && t1_value !== (t1_value = new Date(/*task*/ ctx[22].due_on).toLocaleDateString() + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*pool*/ 256 && t3_value !== (t3_value = /*task*/ ctx[22].class_group_name + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*pool*/ 256 && t5_value !== (t5_value = /*task*/ ctx[22].subject + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*pool*/ 256 && t7_value !== (t7_value = /*task*/ ctx[22].teacher_name + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*pool*/ 256 && t9_value !== (t9_value = /*task*/ ctx[22].class_task_title + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*pool*/ 256 && tr_class_value !== (tr_class_value = "task-" + /*task*/ ctx[22].class_task_type.toLowerCase() + " svelte-1d36sq")) {
    				attr_dev(tr, "class", tr_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(70:16) {#each pool as task, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let fieldset;
    	let legend;
    	let t0;
    	let t1_value = /*pool*/ ctx[8].length + "";
    	let t1;
    	let t2;
    	let t3;
    	let input0;
    	let t4;
    	let label0;
    	let br0;
    	let t6;
    	let input1;
    	let t7;
    	let label1;
    	let br1;
    	let t9;
    	let input2;
    	let t10;
    	let label2;
    	let br2;
    	let br3;
    	let t12;
    	let input3;
    	let t13;
    	let label3;
    	let t15;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let br4;
    	let br5;
    	let t19;
    	let input4;
    	let t20;
    	let label4;
    	let t22;
    	let div1;
    	let table;
    	let thead;
    	let tr;
    	let td0;
    	let button;
    	let t24;
    	let td1;
    	let t26;
    	let td2;
    	let t28;
    	let td3;
    	let t30;
    	let td4;
    	let t32;
    	let td5;
    	let t34;
    	let tbody;
    	let mounted;
    	let dispose;
    	let each_value = /*pool*/ ctx[8];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			fieldset = element("fieldset");
    			legend = element("legend");
    			t0 = text("Filter (");
    			t1 = text(t1_value);
    			t2 = text(")");
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label0 = element("label");
    			label0.textContent = "Filter";
    			br0 = element("br");
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			label1 = element("label");
    			label1.textContent = "Match description?";
    			br1 = element("br");
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			label2 = element("label");
    			label2.textContent = "Class group";
    			br2 = element("br");
    			br3 = element("br");
    			t12 = space();
    			input3 = element("input");
    			t13 = space();
    			label3 = element("label");
    			label3.textContent = "Subject";
    			t15 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "All";
    			option1 = element("option");
    			option1.textContent = "Homeworks";
    			option2 = element("option");
    			option2.textContent = "Flexible Tasks";
    			br4 = element("br");
    			br5 = element("br");
    			t19 = space();
    			input4 = element("input");
    			t20 = space();
    			label4 = element("label");
    			label4.textContent = "Teacher";
    			t22 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			td0 = element("td");
    			button = element("button");
    			button.textContent = "X";
    			t24 = space();
    			td1 = element("td");
    			td1.textContent = "Due on";
    			t26 = space();
    			td2 = element("td");
    			td2.textContent = "Class group";
    			t28 = space();
    			td3 = element("td");
    			td3.textContent = "Subject";
    			t30 = space();
    			td4 = element("td");
    			td4.textContent = "Teacher";
    			t32 = space();
    			td5 = element("td");
    			td5.textContent = "Title";
    			t34 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(legend, file$3, 43, 12, 1708);
    			attr_dev(input0, "name", "filter");
    			add_location(input0, file$3, 44, 12, 1761);
    			attr_dev(label0, "for", "filter");
    			add_location(label0, file$3, 44, 53, 1802);
    			add_location(br0, file$3, 44, 87, 1836);
    			attr_dev(input1, "type", "checkbox");
    			attr_dev(input1, "name", "description");
    			add_location(input1, file$3, 45, 12, 1854);
    			attr_dev(label1, "for", "description");
    			add_location(label1, file$3, 45, 82, 1924);
    			add_location(br1, file$3, 45, 133, 1975);
    			attr_dev(input2, "name", "class-group");
    			add_location(input2, file$3, 46, 12, 1993);
    			attr_dev(label2, "for", "class-group");
    			add_location(label2, file$3, 46, 64, 2045);
    			add_location(br2, file$3, 46, 108, 2089);
    			add_location(br3, file$3, 46, 112, 2093);
    			attr_dev(input3, "name", "subject");
    			add_location(input3, file$3, 47, 12, 2111);
    			attr_dev(label3, "for", "subject");
    			add_location(label3, file$3, 47, 56, 2155);
    			option0.selected = true;
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file$3, 49, 16, 2310);
    			option1.__value = "Homework";
    			option1.value = option1.__value;
    			add_location(option1, file$3, 50, 16, 2373);
    			option2.__value = "FlexibleTask";
    			option2.value = option2.__value;
    			add_location(option2, file$3, 51, 16, 2434);
    			add_location(select, file$3, 48, 12, 2205);
    			add_location(br4, file$3, 52, 21, 2509);
    			add_location(br5, file$3, 52, 25, 2513);
    			attr_dev(input4, "name", "teacher");
    			add_location(input4, file$3, 53, 12, 2531);
    			attr_dev(label4, "for", "teacher");
    			add_location(label4, file$3, 53, 56, 2575);
    			add_location(fieldset, file$3, 42, 8, 1684);
    			attr_dev(div0, "class", "selector-list-header");
    			add_location(div0, file$3, 41, 4, 1640);
    			add_location(button, file$3, 60, 24, 2769);
    			add_location(td0, file$3, 60, 20, 2765);
    			add_location(td1, file$3, 61, 20, 2928);
    			add_location(td2, file$3, 62, 20, 2965);
    			add_location(td3, file$3, 63, 20, 3007);
    			add_location(td4, file$3, 64, 20, 3045);
    			add_location(td5, file$3, 65, 20, 3083);
    			add_location(tr, file$3, 59, 16, 2739);
    			add_location(thead, file$3, 58, 12, 2714);
    			add_location(tbody, file$3, 68, 12, 3156);
    			add_location(table, file$3, 57, 8, 2693);
    			attr_dev(div1, "class", "selector-list-table");
    			add_location(div1, file$3, 56, 4, 2650);
    			attr_dev(div2, "class", "selector-list");
    			add_location(div2, file$3, 40, 0, 1607);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, fieldset);
    			append_dev(fieldset, legend);
    			append_dev(legend, t0);
    			append_dev(legend, t1);
    			append_dev(legend, t2);
    			append_dev(fieldset, t3);
    			append_dev(fieldset, input0);
    			set_input_value(input0, /*title*/ ctx[2]);
    			append_dev(fieldset, t4);
    			append_dev(fieldset, label0);
    			append_dev(fieldset, br0);
    			append_dev(fieldset, t6);
    			append_dev(fieldset, input1);
    			input1.checked = /*description*/ ctx[3];
    			append_dev(fieldset, t7);
    			append_dev(fieldset, label1);
    			append_dev(fieldset, br1);
    			append_dev(fieldset, t9);
    			append_dev(fieldset, input2);
    			set_input_value(input2, /*class_group*/ ctx[4]);
    			append_dev(fieldset, t10);
    			append_dev(fieldset, label2);
    			append_dev(fieldset, br2);
    			append_dev(fieldset, br3);
    			append_dev(fieldset, t12);
    			append_dev(fieldset, input3);
    			set_input_value(input3, /*subject*/ ctx[5]);
    			append_dev(fieldset, t13);
    			append_dev(fieldset, label3);
    			append_dev(fieldset, t15);
    			append_dev(fieldset, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(fieldset, br4);
    			append_dev(fieldset, br5);
    			append_dev(fieldset, t19);
    			append_dev(fieldset, input4);
    			set_input_value(input4, /*teacher*/ ctx[7]);
    			append_dev(fieldset, t20);
    			append_dev(fieldset, label4);
    			append_dev(div2, t22);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, td0);
    			append_dev(td0, button);
    			append_dev(tr, t24);
    			append_dev(tr, td1);
    			append_dev(tr, t26);
    			append_dev(tr, td2);
    			append_dev(tr, t28);
    			append_dev(tr, td3);
    			append_dev(tr, t30);
    			append_dev(tr, td4);
    			append_dev(tr, t32);
    			append_dev(tr, td5);
    			append_dev(table, t34);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[14]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[15]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[16]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[17]),
    					listen_dev(select, "blur", /*blur_handler*/ ctx[13], false, false, false),
    					listen_dev(select, "change", /*change_handler*/ ctx[18], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[19]),
    					listen_dev(button, "click", /*click_handler*/ ctx[20], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pool*/ 256 && t1_value !== (t1_value = /*pool*/ ctx[8].length + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*title*/ 4 && input0.value !== /*title*/ ctx[2]) {
    				set_input_value(input0, /*title*/ ctx[2]);
    			}

    			if (dirty & /*description*/ 8) {
    				input1.checked = /*description*/ ctx[3];
    			}

    			if (dirty & /*class_group*/ 16 && input2.value !== /*class_group*/ ctx[4]) {
    				set_input_value(input2, /*class_group*/ ctx[4]);
    			}

    			if (dirty & /*subject*/ 32 && input3.value !== /*subject*/ ctx[5]) {
    				set_input_value(input3, /*subject*/ ctx[5]);
    			}

    			if (dirty & /*teacher*/ 128 && input4.value !== /*teacher*/ ctx[7]) {
    				set_input_value(input4, /*teacher*/ ctx[7]);
    			}

    			if (dirty & /*pool, Date, selected_tasks, max, selected*/ 771) {
    				each_value = /*pool*/ ctx[8];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { tasks } = $$props;
    	let { selected } = $$props;
    	let { max = 0 } = $$props;
    	let title = "";
    	let regex = false;
    	let description = false;
    	let class_group = "";
    	let subject = "";
    	let type = "";
    	let teacher = "";
    	let pool = [];

    	function update() {
    		$$invalidate(8, pool = Object.values(tasks).filter(task => task.class_task_type === "Homework" || task.class_task_type === "FlexibleTask"));

    		if (title) {
    			if (description) {
    				$$invalidate(8, pool = pool.filter(task => (task.class_task_title.toLowerCase() + (task.description
    				? " " + task.description.toLowerCase()
    				: "")).indexOf(title.toLowerCase()) !== -1));
    			} else {
    				$$invalidate(8, pool = pool.filter(task => task.class_task_title.toLowerCase().indexOf(title.toLowerCase()) !== -1));
    			}
    		}

    		$$invalidate(8, pool = class_group
    		? pool.filter(task => task.class_group_name.toLowerCase().indexOf(class_group.toLowerCase()) !== -1)
    		: pool);

    		$$invalidate(8, pool = subject
    		? pool.filter(task => task.subject.toLowerCase().indexOf(subject.toLowerCase()) !== -1)
    		: pool);

    		$$invalidate(8, pool = type
    		? pool.filter(task => task.class_task_type === type)
    		: pool);

    		$$invalidate(8, pool = teacher
    		? pool.filter(task => task.teacher_name.toLowerCase().indexOf(teacher.toLowerCase()) !== -1)
    		: pool);

    		pool.sort((a, b) => a.due_on - b.due_on);
    	}

    	let selected_tasks = {};
    	const writable_props = ["tasks", "selected", "max"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SelectTasks> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SelectTasks", $$slots, []);

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function input0_input_handler() {
    		title = this.value;
    		$$invalidate(2, title);
    	}

    	function input1_change_handler() {
    		description = this.checked;
    		$$invalidate(3, description);
    	}

    	function input2_input_handler() {
    		class_group = this.value;
    		$$invalidate(4, class_group);
    	}

    	function input3_input_handler() {
    		subject = this.value;
    		$$invalidate(5, subject);
    	}

    	const change_handler = e => $$invalidate(6, type = e.target.options[e.target.selectedIndex].value);

    	function input4_input_handler() {
    		teacher = this.value;
    		$$invalidate(7, teacher);
    	}

    	const click_handler = () => {
    		for (var task in selected_tasks) delete selected_tasks[task];
    		$$invalidate(9, selected_tasks);
    	};

    	const change_handler_1 = (task, e) => {
    		e.target.checked
    		? $$invalidate(9, selected_tasks[task.id] = task, selected_tasks)
    		: $$invalidate(9, selected_tasks[task.id] = null, selected_tasks);
    	};

    	$$self.$set = $$props => {
    		if ("tasks" in $$props) $$invalidate(10, tasks = $$props.tasks);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("max" in $$props) $$invalidate(1, max = $$props.max);
    	};

    	$$self.$capture_state = () => ({
    		tasks,
    		selected,
    		max,
    		title,
    		regex,
    		description,
    		class_group,
    		subject,
    		type,
    		teacher,
    		pool,
    		update,
    		selected_tasks
    	});

    	$$self.$inject_state = $$props => {
    		if ("tasks" in $$props) $$invalidate(10, tasks = $$props.tasks);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("max" in $$props) $$invalidate(1, max = $$props.max);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("regex" in $$props) $$invalidate(11, regex = $$props.regex);
    		if ("description" in $$props) $$invalidate(3, description = $$props.description);
    		if ("class_group" in $$props) $$invalidate(4, class_group = $$props.class_group);
    		if ("subject" in $$props) $$invalidate(5, subject = $$props.subject);
    		if ("type" in $$props) $$invalidate(6, type = $$props.type);
    		if ("teacher" in $$props) $$invalidate(7, teacher = $$props.teacher);
    		if ("pool" in $$props) $$invalidate(8, pool = $$props.pool);
    		if ("selected_tasks" in $$props) $$invalidate(9, selected_tasks = $$props.selected_tasks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*tasks, title, description, class_group, subject, type, teacher*/ 1276) {
    			if (tasks || title || regex || description || class_group || subject || type || teacher || 1) update();
    		}

    		if ($$self.$$.dirty & /*selected_tasks*/ 512) {
    			$$invalidate(0, selected = Object.values(selected_tasks).filter(task => task));
    		}
    	};

    	return [
    		selected,
    		max,
    		title,
    		description,
    		class_group,
    		subject,
    		type,
    		teacher,
    		pool,
    		selected_tasks,
    		tasks,
    		regex,
    		update,
    		blur_handler,
    		input0_input_handler,
    		input1_change_handler,
    		input2_input_handler,
    		input3_input_handler,
    		change_handler,
    		input4_input_handler,
    		click_handler,
    		change_handler_1
    	];
    }

    class SelectTasks extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { tasks: 10, selected: 0, max: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectTasks",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tasks*/ ctx[10] === undefined && !("tasks" in props)) {
    			console.warn("<SelectTasks> was created without expected prop 'tasks'");
    		}

    		if (/*selected*/ ctx[0] === undefined && !("selected" in props)) {
    			console.warn("<SelectTasks> was created without expected prop 'selected'");
    		}
    	}

    	get tasks() {
    		throw new Error("<SelectTasks>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tasks(value) {
    		throw new Error("<SelectTasks>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<SelectTasks>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<SelectTasks>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<SelectTasks>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<SelectTasks>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SubmissionQueryInformation.svelte generated by Svelte v3.23.0 */

    const file$2 = "src\\components\\SubmissionQueryInformation.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let span0;
    	let t0;
    	let t1_value = /*submissions*/ ctx[0].length + "";
    	let t1;
    	let br0;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*resolved*/ ctx[1].length + "";
    	let t4;
    	let t5;
    	let t6_value = (Math.floor(/*resolved*/ ctx[1].length / /*submissions*/ ctx[0].length * 100) || 0) + "";
    	let t6;
    	let t7;
    	let br1;
    	let t8;
    	let span2;
    	let t9;
    	let t10_value = /*completed*/ ctx[2].length + "";
    	let t10;
    	let t11;
    	let t12_value = (Math.floor(/*completed*/ ctx[2].length / /*resolved*/ ctx[1].length * 100) || 0) + "";
    	let t12;
    	let t13;
    	let br2;
    	let t14;
    	let span3;
    	let t15;
    	let t16_value = /*late*/ ctx[3].length + "";
    	let t16;
    	let t17;
    	let t18_value = (Math.floor(/*late*/ ctx[3].length / /*completed*/ ctx[2].length * 100) || 0) + "";
    	let t18;
    	let t19;
    	let br3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text("Total submissions: ");
    			t1 = text(t1_value);
    			br0 = element("br");
    			t2 = space();
    			span1 = element("span");
    			t3 = text("Of which resolved: ");
    			t4 = text(t4_value);
    			t5 = text(" (");
    			t6 = text(t6_value);
    			t7 = text("%)");
    			br1 = element("br");
    			t8 = space();
    			span2 = element("span");
    			t9 = text("Of which submitted: ");
    			t10 = text(t10_value);
    			t11 = text(" (");
    			t12 = text(t12_value);
    			t13 = text("%)");
    			br2 = element("br");
    			t14 = space();
    			span3 = element("span");
    			t15 = text("Of which late: ");
    			t16 = text(t16_value);
    			t17 = text(" (");
    			t18 = text(t18_value);
    			t19 = text("%)");
    			br3 = element("br");
    			add_location(span0, file$2, 9, 4, 352);
    			add_location(br0, file$2, 9, 56, 404);
    			add_location(span1, file$2, 10, 4, 414);
    			add_location(br1, file$2, 10, 118, 528);
    			add_location(span2, file$2, 11, 4, 538);
    			add_location(br2, file$2, 11, 118, 652);
    			add_location(span3, file$2, 12, 4, 662);
    			add_location(br3, file$2, 12, 104, 762);
    			add_location(div, file$2, 8, 0, 341);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			append_dev(span1, t6);
    			append_dev(span1, t7);
    			append_dev(div, br1);
    			append_dev(div, t8);
    			append_dev(div, span2);
    			append_dev(span2, t9);
    			append_dev(span2, t10);
    			append_dev(span2, t11);
    			append_dev(span2, t12);
    			append_dev(span2, t13);
    			append_dev(div, br2);
    			append_dev(div, t14);
    			append_dev(div, span3);
    			append_dev(span3, t15);
    			append_dev(span3, t16);
    			append_dev(span3, t17);
    			append_dev(span3, t18);
    			append_dev(span3, t19);
    			append_dev(div, br3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*submissions*/ 1 && t1_value !== (t1_value = /*submissions*/ ctx[0].length + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*resolved*/ 2 && t4_value !== (t4_value = /*resolved*/ ctx[1].length + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*resolved, submissions*/ 3 && t6_value !== (t6_value = (Math.floor(/*resolved*/ ctx[1].length / /*submissions*/ ctx[0].length * 100) || 0) + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*completed*/ 4 && t10_value !== (t10_value = /*completed*/ ctx[2].length + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*completed, resolved*/ 6 && t12_value !== (t12_value = (Math.floor(/*completed*/ ctx[2].length / /*resolved*/ ctx[1].length * 100) || 0) + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*late*/ 8 && t16_value !== (t16_value = /*late*/ ctx[3].length + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*late, completed*/ 12 && t18_value !== (t18_value = (Math.floor(/*late*/ ctx[3].length / /*completed*/ ctx[2].length * 100) || 0) + "")) set_data_dev(t18, t18_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { submissions } = $$props;
    	const writable_props = ["submissions"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SubmissionQueryInformation> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SubmissionQueryInformation", $$slots, []);

    	$$self.$set = $$props => {
    		if ("submissions" in $$props) $$invalidate(0, submissions = $$props.submissions);
    	};

    	$$self.$capture_state = () => ({ submissions, resolved, completed, late });

    	$$self.$inject_state = $$props => {
    		if ("submissions" in $$props) $$invalidate(0, submissions = $$props.submissions);
    		if ("resolved" in $$props) $$invalidate(1, resolved = $$props.resolved);
    		if ("completed" in $$props) $$invalidate(2, completed = $$props.completed);
    		if ("late" in $$props) $$invalidate(3, late = $$props.late);
    	};

    	let resolved;
    	let completed;
    	let late;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*submissions*/ 1) {
    			$$invalidate(1, resolved = submissions.filter(submission => submission.status));
    		}

    		if ($$self.$$.dirty & /*resolved*/ 2) {
    			$$invalidate(2, completed = resolved.filter(submission => submission.status === "submitted" || submission.status === "submitted-late"));
    		}

    		if ($$self.$$.dirty & /*completed*/ 4) {
    			$$invalidate(3, late = completed.filter(submission => submission.status === "submitted-late"));
    		}
    	};

    	return [submissions, resolved, completed, late];
    }

    class SubmissionQueryInformation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { submissions: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubmissionQueryInformation",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*submissions*/ ctx[0] === undefined && !("submissions" in props)) {
    			console.warn("<SubmissionQueryInformation> was created without expected prop 'submissions'");
    		}
    	}

    	get submissions() {
    		throw new Error("<SubmissionQueryInformation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submissions(value) {
    		throw new Error("<SubmissionQueryInformation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function querySubmissions(client, tasks) {
        return new Promise((resolve, reject) => {
            const homework_ids = tasks.filter(task => task.class_task_type === "Homework").map(task => task.id);
            const flexible_task_ids = tasks.filter(task => task.class_task_type === "FlexibleTask").map(task => task.id);
            const homework_submission_ids = [];
            const flexible_task_submission_ids = [];

            const information = {
                submissions: [],
                tasks: []
            };

            client.getHomeworks(homework_ids).then(homeworks => {
                information.tasks.push(...homeworks);
                
                homeworks.map(homework => homework.submission_ids).forEach(submissions => {
                    homework_submission_ids.push(...submissions);
                });
            }).catch(console.log).finally(() => {
                client.getFlexibleTasks(flexible_task_ids).then(flexible_tasks => {
                    information.tasks.push(...flexible_tasks);
                    
                    flexible_tasks.map(flexible_task => flexible_task.submission_ids).forEach(submissions => {
                        flexible_task_submission_ids.push(...submissions);
                    });
                }).catch(console.log).finally(() => {
                    client.getHomeworkSubmissions(homework_submission_ids).then(submissions => {
                        information.submissions.push(...submissions);
                    }).catch(console.log).finally(() => {
                        client.getFlexibleTaskSubmissions(flexible_task_submission_ids).then(submissions => {
                            information.submissions.push(...submissions);
                        }).catch(console.log).finally(() => {
                            resolve(information);
                        });
                    });
                });
            });
        });
    }

    /* src\pages\QuerySubmissions.svelte generated by Svelte v3.23.0 */
    const file$1 = "src\\pages\\QuerySubmissions.svelte";

    // (40:12) {#if information}
    function create_if_block$1(ctx) {
    	let current;

    	const submissionqueryinformation = new SubmissionQueryInformation({
    			props: {
    				submissions: /*information*/ ctx[4].submissions
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(submissionqueryinformation.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(submissionqueryinformation, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const submissionqueryinformation_changes = {};
    			if (dirty & /*information*/ 16) submissionqueryinformation_changes.submissions = /*information*/ ctx[4].submissions;
    			submissionqueryinformation.$set(submissionqueryinformation_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(submissionqueryinformation.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(submissionqueryinformation.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(submissionqueryinformation, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(40:12) {#if information}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div8;
    	let div1;
    	let div0;
    	let span0;
    	let t1;
    	let a;
    	let t3;
    	let updating_selected;
    	let t4;
    	let div7;
    	let div4;
    	let div2;
    	let span1;
    	let t6;
    	let div3;
    	let button;
    	let t7;
    	let t8_value = /*selected_tasks*/ ctx[3].length + "";
    	let t8;
    	let t9;
    	let t10_value = (/*selected_tasks*/ ctx[3].length === 1 ? "" : "s") + "";
    	let t10;
    	let t11;
    	let button_disabled_value;
    	let t12;
    	let div6;
    	let div5;
    	let span2;
    	let t14;
    	let current;
    	let mounted;
    	let dispose;

    	function selecttasks_selected_binding(value) {
    		/*selecttasks_selected_binding*/ ctx[6].call(null, value);
    	}

    	let selecttasks_props = {
    		tasks: /*_cache*/ ctx[1].tasks,
    		max: "10"
    	};

    	if (/*selected_tasks*/ ctx[3] !== void 0) {
    		selecttasks_props.selected = /*selected_tasks*/ ctx[3];
    	}

    	const selecttasks = new SelectTasks({ props: selecttasks_props, $$inline: true });
    	binding_callbacks.push(() => bind(selecttasks, "selected", selecttasks_selected_binding));
    	let if_block = /*information*/ ctx[4] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Select Tasks";
    			t1 = space();
    			a = element("a");
    			a.textContent = "Back";
    			t3 = space();
    			create_component(selecttasks.$$.fragment);
    			t4 = space();
    			div7 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "Query";
    			t6 = space();
    			div3 = element("div");
    			button = element("button");
    			t7 = text("Query ");
    			t8 = text(t8_value);
    			t9 = text(" Task");
    			t10 = text(t10_value);
    			t11 = text("..");
    			t12 = space();
    			div6 = element("div");
    			div5 = element("div");
    			span2 = element("span");
    			span2.textContent = "Submissions";
    			t14 = space();
    			if (if_block) if_block.c();
    			add_location(span0, file$1, 16, 12, 555);
    			attr_dev(div0, "class", "page-content-title");
    			add_location(div0, file$1, 15, 8, 509);
    			attr_dev(a, "href", "##");
    			add_location(a, file$1, 18, 8, 606);
    			attr_dev(div1, "class", "page-section column svelte-truino");
    			attr_dev(div1, "id", "section-tasks");
    			add_location(div1, file$1, 14, 4, 447);
    			add_location(span1, file$1, 24, 16, 916);
    			attr_dev(div2, "class", "page-content-title");
    			add_location(div2, file$1, 23, 12, 866);
    			button.disabled = button_disabled_value = /*selected_tasks*/ ctx[3].length === 0;
    			add_location(button, file$1, 27, 16, 991);
    			add_location(div3, file$1, 26, 12, 968);
    			attr_dev(div4, "class", "page-content");
    			add_location(div4, file$1, 22, 8, 826);
    			add_location(span2, file$1, 37, 16, 1450);
    			attr_dev(div5, "class", "page-content-title");
    			add_location(div5, file$1, 36, 12, 1400);
    			attr_dev(div6, "class", "page-content");
    			add_location(div6, file$1, 35, 8, 1360);
    			attr_dev(div7, "class", "page-section svelte-truino");
    			attr_dev(div7, "id", "section-query");
    			add_location(div7, file$1, 21, 4, 771);
    			attr_dev(div8, "class", "page svelte-truino");
    			attr_dev(div8, "id", "page-query-submissions");
    			add_location(div8, file$1, 13, 0, 395);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(div1, t1);
    			append_dev(div1, a);
    			append_dev(div1, t3);
    			mount_component(selecttasks, div1, null);
    			append_dev(div8, t4);
    			append_dev(div8, div7);
    			append_dev(div7, div4);
    			append_dev(div4, div2);
    			append_dev(div2, span1);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, t7);
    			append_dev(button, t8);
    			append_dev(button, t9);
    			append_dev(button, t10);
    			append_dev(button, t11);
    			append_dev(div7, t12);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, span2);
    			append_dev(div6, t14);
    			if (if_block) if_block.m(div6, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button, "click", /*click_handler_1*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const selecttasks_changes = {};
    			if (dirty & /*_cache*/ 2) selecttasks_changes.tasks = /*_cache*/ ctx[1].tasks;

    			if (!updating_selected && dirty & /*selected_tasks*/ 8) {
    				updating_selected = true;
    				selecttasks_changes.selected = /*selected_tasks*/ ctx[3];
    				add_flush_callback(() => updating_selected = false);
    			}

    			selecttasks.$set(selecttasks_changes);
    			if ((!current || dirty & /*selected_tasks*/ 8) && t8_value !== (t8_value = /*selected_tasks*/ ctx[3].length + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*selected_tasks*/ 8) && t10_value !== (t10_value = (/*selected_tasks*/ ctx[3].length === 1 ? "" : "s") + "")) set_data_dev(t10, t10_value);

    			if (!current || dirty & /*selected_tasks*/ 8 && button_disabled_value !== (button_disabled_value = /*selected_tasks*/ ctx[3].length === 0)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (/*information*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*information*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div6, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selecttasks.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selecttasks.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			destroy_component(selecttasks);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { _cache } = $$props;
    	let { client } = $$props;
    	let { query_submissions } = $$props;
    	let selected_tasks = [];
    	let information = null;
    	const writable_props = ["_cache", "client", "query_submissions"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QuerySubmissions> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("QuerySubmissions", $$slots, []);
    	const click_handler = () => $$invalidate(0, query_submissions = false);

    	function selecttasks_selected_binding(value) {
    		selected_tasks = value;
    		$$invalidate(3, selected_tasks);
    	}

    	const click_handler_1 = () => querySubmissions(client, selected_tasks).then(info => $$invalidate(4, information = info));

    	$$self.$set = $$props => {
    		if ("_cache" in $$props) $$invalidate(1, _cache = $$props._cache);
    		if ("client" in $$props) $$invalidate(2, client = $$props.client);
    		if ("query_submissions" in $$props) $$invalidate(0, query_submissions = $$props.query_submissions);
    	};

    	$$self.$capture_state = () => ({
    		SelectTasks,
    		SubmissionQueryInformation,
    		querySubmissions,
    		_cache,
    		client,
    		query_submissions,
    		selected_tasks,
    		information
    	});

    	$$self.$inject_state = $$props => {
    		if ("_cache" in $$props) $$invalidate(1, _cache = $$props._cache);
    		if ("client" in $$props) $$invalidate(2, client = $$props.client);
    		if ("query_submissions" in $$props) $$invalidate(0, query_submissions = $$props.query_submissions);
    		if ("selected_tasks" in $$props) $$invalidate(3, selected_tasks = $$props.selected_tasks);
    		if ("information" in $$props) $$invalidate(4, information = $$props.information);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		query_submissions,
    		_cache,
    		client,
    		selected_tasks,
    		information,
    		click_handler,
    		selecttasks_selected_binding,
    		click_handler_1
    	];
    }

    class QuerySubmissions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			_cache: 1,
    			client: 2,
    			query_submissions: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QuerySubmissions",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*_cache*/ ctx[1] === undefined && !("_cache" in props)) {
    			console.warn("<QuerySubmissions> was created without expected prop '_cache'");
    		}

    		if (/*client*/ ctx[2] === undefined && !("client" in props)) {
    			console.warn("<QuerySubmissions> was created without expected prop 'client'");
    		}

    		if (/*query_submissions*/ ctx[0] === undefined && !("query_submissions" in props)) {
    			console.warn("<QuerySubmissions> was created without expected prop 'query_submissions'");
    		}
    	}

    	get _cache() {
    		throw new Error("<QuerySubmissions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _cache(value) {
    		throw new Error("<QuerySubmissions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get client() {
    		throw new Error("<QuerySubmissions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set client(value) {
    		throw new Error("<QuerySubmissions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get query_submissions() {
    		throw new Error("<QuerySubmissions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query_submissions(value) {
    		throw new Error("<QuerySubmissions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (185:2) {:else}
    function create_else_block_1(ctx) {
    	let updating_selected_task;
    	let current;

    	function pagemaindash_selected_task_binding(value) {
    		/*pagemaindash_selected_task_binding*/ ctx[14].call(null, value);
    	}

    	let pagemaindash_props = {
    		client: /*client*/ ctx[4],
    		_cache: /*_cache*/ ctx[0]
    	};

    	if (/*selected_task*/ ctx[1] !== void 0) {
    		pagemaindash_props.selected_task = /*selected_task*/ ctx[1];
    	}

    	const pagemaindash = new MainDash({
    			props: pagemaindash_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(pagemaindash, "selected_task", pagemaindash_selected_task_binding));
    	pagemaindash.$on("select_task", /*select_task*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(pagemaindash.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pagemaindash, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pagemaindash_changes = {};
    			if (dirty & /*_cache*/ 1) pagemaindash_changes._cache = /*_cache*/ ctx[0];

    			if (!updating_selected_task && dirty & /*selected_task*/ 2) {
    				updating_selected_task = true;
    				pagemaindash_changes.selected_task = /*selected_task*/ ctx[1];
    				add_flush_callback(() => updating_selected_task = false);
    			}

    			pagemaindash.$set(pagemaindash_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagemaindash.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pagemaindash.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pagemaindash, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(185:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (183:2) {#if query_submissions}
    function create_if_block_2(ctx) {
    	let updating_query_submissions;
    	let current;

    	function pagequerysubmissions_query_submissions_binding(value) {
    		/*pagequerysubmissions_query_submissions_binding*/ ctx[13].call(null, value);
    	}

    	let pagequerysubmissions_props = {
    		client: /*client*/ ctx[4],
    		_cache: /*_cache*/ ctx[0]
    	};

    	if (/*query_submissions*/ ctx[3] !== void 0) {
    		pagequerysubmissions_props.query_submissions = /*query_submissions*/ ctx[3];
    	}

    	const pagequerysubmissions = new QuerySubmissions({
    			props: pagequerysubmissions_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(pagequerysubmissions, "query_submissions", pagequerysubmissions_query_submissions_binding));

    	const block = {
    		c: function create() {
    			create_component(pagequerysubmissions.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pagequerysubmissions, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pagequerysubmissions_changes = {};
    			if (dirty & /*_cache*/ 1) pagequerysubmissions_changes._cache = /*_cache*/ ctx[0];

    			if (!updating_query_submissions && dirty & /*query_submissions*/ 8) {
    				updating_query_submissions = true;
    				pagequerysubmissions_changes.query_submissions = /*query_submissions*/ ctx[3];
    				add_flush_callback(() => updating_query_submissions = false);
    			}

    			pagequerysubmissions.$set(pagequerysubmissions_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagequerysubmissions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pagequerysubmissions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pagequerysubmissions, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(183:2) {#if query_submissions}",
    		ctx
    	});

    	return block;
    }

    // (176:1) {#if selected_task}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*selected_task*/ ctx[1].class_task_type === "Quiz") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(176:1) {#if selected_task}",
    		ctx
    	});

    	return block;
    }

    // (179:2) {:else}
    function create_else_block(ctx) {
    	let updating_selected_task;
    	let updating_selected_submission;
    	let current;

    	function pageselecttaskhft_selected_task_binding(value) {
    		/*pageselecttaskhft_selected_task_binding*/ ctx[11].call(null, value);
    	}

    	function pageselecttaskhft_selected_submission_binding(value) {
    		/*pageselecttaskhft_selected_submission_binding*/ ctx[12].call(null, value);
    	}

    	let pageselecttaskhft_props = {
    		client: /*client*/ ctx[4],
    		_cache: /*_cache*/ ctx[0]
    	};

    	if (/*selected_task*/ ctx[1] !== void 0) {
    		pageselecttaskhft_props.selected_task = /*selected_task*/ ctx[1];
    	}

    	if (/*selected_submission*/ ctx[2] !== void 0) {
    		pageselecttaskhft_props.selected_submission = /*selected_submission*/ ctx[2];
    	}

    	const pageselecttaskhft = new SelectTaskHFT({
    			props: pageselecttaskhft_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(pageselecttaskhft, "selected_task", pageselecttaskhft_selected_task_binding));
    	binding_callbacks.push(() => bind(pageselecttaskhft, "selected_submission", pageselecttaskhft_selected_submission_binding));

    	const block = {
    		c: function create() {
    			create_component(pageselecttaskhft.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pageselecttaskhft, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pageselecttaskhft_changes = {};
    			if (dirty & /*_cache*/ 1) pageselecttaskhft_changes._cache = /*_cache*/ ctx[0];

    			if (!updating_selected_task && dirty & /*selected_task*/ 2) {
    				updating_selected_task = true;
    				pageselecttaskhft_changes.selected_task = /*selected_task*/ ctx[1];
    				add_flush_callback(() => updating_selected_task = false);
    			}

    			if (!updating_selected_submission && dirty & /*selected_submission*/ 4) {
    				updating_selected_submission = true;
    				pageselecttaskhft_changes.selected_submission = /*selected_submission*/ ctx[2];
    				add_flush_callback(() => updating_selected_submission = false);
    			}

    			pageselecttaskhft.$set(pageselecttaskhft_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pageselecttaskhft.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pageselecttaskhft.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pageselecttaskhft, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(179:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (177:2) {#if selected_task.class_task_type === "Quiz"}
    function create_if_block_1(ctx) {
    	let updating_selected_task;
    	let current;

    	function pageselecttaskquiz_selected_task_binding(value) {
    		/*pageselecttaskquiz_selected_task_binding*/ ctx[10].call(null, value);
    	}

    	let pageselecttaskquiz_props = {
    		client: /*client*/ ctx[4],
    		_cache: /*_cache*/ ctx[0]
    	};

    	if (/*selected_task*/ ctx[1] !== void 0) {
    		pageselecttaskquiz_props.selected_task = /*selected_task*/ ctx[1];
    	}

    	const pageselecttaskquiz = new SelectTaskQuiz({
    			props: pageselecttaskquiz_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(pageselecttaskquiz, "selected_task", pageselecttaskquiz_selected_task_binding));

    	const block = {
    		c: function create() {
    			create_component(pageselecttaskquiz.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pageselecttaskquiz, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pageselecttaskquiz_changes = {};
    			if (dirty & /*_cache*/ 1) pageselecttaskquiz_changes._cache = /*_cache*/ ctx[0];

    			if (!updating_selected_task && dirty & /*selected_task*/ 2) {
    				updating_selected_task = true;
    				pageselecttaskquiz_changes.selected_task = /*selected_task*/ ctx[1];
    				add_flush_callback(() => updating_selected_task = false);
    			}

    			pageselecttaskquiz.$set(pageselecttaskquiz_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pageselecttaskquiz.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pageselecttaskquiz.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pageselecttaskquiz, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(177:2) {#if selected_task.class_task_type === \\\"Quiz\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*selected_task*/ ctx[1]) return 0;
    		if (/*query_submissions*/ ctx[3]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "svelte-1wo917i");
    			add_location(main, file, 174, 0, 4882);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const smhw = require("node-smhw");
    	const { ipcRenderer } = require("electron");
    	const storage = require("electron-json-storage");
    	const client = new smhw.Client();

    	const _cache = {
    		class_groups: {},
    		employees: {},
    		teachers: {},
    		own_teachers: {},
    		users: {},
    		tasks: {},
    		submissions: {},
    		comments: {},
    		assignments: {},
    		attachments: {},
    		questions: {},
    		submission_questions: {}
    	};

    	let selected_task = null;
    	let selected_submission;

    	function select_task() {
    		console.log("Selected task.");

    		if (selected_task) {
    			selected_assignment = null;

    			if (selected_task.class_task_type === "Quiz") {
    				selected_task.getAssignment().then(assignment => {
    					console.log("Got assignment.", assignment);

    					assignment.getQuestions().then(questions => {
    						console.log("Got questions.", questions);

    						assignment.getSubmission().then(submission => {
    							console.log("Got submission.", submission);

    							submission.getComments().then(comments => {
    								console.log("Got comments.", comments);

    								submission.getQuestions().then(questions => {
    									console.log("Got submission questions.", questions);

    									questions.forEach(question => {
    										$$invalidate(0, _cache.submission_questions[question.id] = question, _cache);
    									});
    								}).catch(console.log);

    								comments.forEach(comment => {
    									$$invalidate(0, _cache.comments[comment.id] = comment, _cache);
    								});
    							}).catch(console.log);

    							$$invalidate(0, _cache.submissions[submission.id] = submission, _cache);
    						}).catch(console.log);

    						questions.forEach(question => {
    							$$invalidate(0, _cache.questions[question.id] = question, _cache);
    						});
    					}).catch(console.log);

    					$$invalidate(0, _cache.assignments[assignment.id] = assignment, _cache);
    				}).catch(console.log);
    			} else {
    				selected_task.getAssignment().then(assignment => {
    					console.log("Got assignment.", assignment);
    					$$invalidate(0, _cache.assignments[assignment.id] = assignment, _cache);

    					assignment.getSubmissions().then(submissions => {
    						console.log("Got submissions.", submissions);
    						$$invalidate(2, selected_submission = submissions.filter(submission => submission.student_id === client.student.id)[0] || null);

    						submissions.forEach(submission => {
    							$$invalidate(0, _cache.submissions[submission.id] = submission, _cache);
    						});
    					}).catch(console.log).finally(() => {
    						assignment.getAttachments().then(attachments => {
    							console.log("Got attachments.", attachments);

    							attachments.forEach(attachment => {
    								$$invalidate(0, _cache.attachments[attachment.id] = attachment, _cache);
    							});
    						}).catch(console.log).finally(() => {
    							assignment.getSubmissionComments().then(comments => {
    								console.log("Got comments.", comments);

    								comments.forEach(comment => {
    									$$invalidate(0, _cache.comments[comment.id] = comment, _cache);
    								});
    							});
    						});
    					});
    				}).catch(console.log);
    			}
    		}
    	}

    	storage.get("auth", (err, auth) => {
    		if (err) {
    			console.log(err);
    			return;
    		}

    		client.login(auth).then(() => {
    			console.log("Logged in.");

    			client.student.getClassGroups().then(class_groups => {
    				console.log("Got class groups.", class_groups);

    				client.school.getEmployees().then(employees => {
    					console.log("Got employees.", employees);

    					client.getTasks().then(tasks => {
    						console.log("Got tasks.", tasks);

    						client.getUsers(Object.values(_cache.own_teachers).map(teacher => teacher.id)).then(users => {
    							console.log("Got users.", users);

    							users.forEach(user => {
    								$$invalidate(0, _cache.users[user.id] = user, _cache);
    							});
    						});

    						tasks.forEach(task => {
    							$$invalidate(0, _cache.tasks[task.id] = task, _cache);
    						});
    					});

    					employees.forEach(employee => {
    						$$invalidate(0, _cache.employees[employee.id] = employee, _cache);
    					});
    				});

    				class_groups.forEach(class_group => {
    					$$invalidate(0, _cache.class_groups[class_group.id] = class_group, _cache);
    				});
    			});
    		});
    	});

    	let query_submissions = false;

    	ipcRenderer.on("query-submissions", function () {
    		$$invalidate(3, query_submissions = true);
    		$$invalidate(1, selected_task = null);
    		selected_assignment = null;
    	});

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function pageselecttaskquiz_selected_task_binding(value) {
    		selected_task = value;
    		$$invalidate(1, selected_task);
    	}

    	function pageselecttaskhft_selected_task_binding(value) {
    		selected_task = value;
    		$$invalidate(1, selected_task);
    	}

    	function pageselecttaskhft_selected_submission_binding(value) {
    		selected_submission = value;
    		$$invalidate(2, selected_submission);
    	}

    	function pagequerysubmissions_query_submissions_binding(value) {
    		query_submissions = value;
    		$$invalidate(3, query_submissions);
    	}

    	function pagemaindash_selected_task_binding(value) {
    		selected_task = value;
    		$$invalidate(1, selected_task);
    	}

    	$$self.$capture_state = () => ({
    		PageMainDash: MainDash,
    		PageSelectTaskHFT: SelectTaskHFT,
    		PageSelectTaskQuiz: SelectTaskQuiz,
    		PageQuerySubmissions: QuerySubmissions,
    		smhw,
    		ipcRenderer,
    		storage,
    		client,
    		_cache,
    		selected_task,
    		selected_submission,
    		select_task,
    		query_submissions,
    		selected_assignment
    	});

    	$$self.$inject_state = $$props => {
    		if ("selected_task" in $$props) $$invalidate(1, selected_task = $$props.selected_task);
    		if ("selected_submission" in $$props) $$invalidate(2, selected_submission = $$props.selected_submission);
    		if ("query_submissions" in $$props) $$invalidate(3, query_submissions = $$props.query_submissions);
    		if ("selected_assignment" in $$props) selected_assignment = $$props.selected_assignment;
    	};

    	let selected_assignment;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*_cache*/ 1) {
    			{
    				Object.values(_cache.employees).forEach(employee => {
    					if (employee.employee_type === "teacher") {
    						$$invalidate(0, _cache.teachers[employee.id] = employee, _cache);

    						if (Object.values(_cache.class_groups).filter(class_group => class_group.teacher_ids.indexOf(employee.id) !== -1)[0]) {
    							$$invalidate(0, _cache.own_teachers[employee.id] = employee, _cache);
    						}
    					}
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*selected_task, _cache*/ 3) {
    			selected_assignment = selected_task
    			? _cache.assignments[selected_task.id] || null
    			: null;
    		}
    	};

    	return [
    		_cache,
    		selected_task,
    		selected_submission,
    		query_submissions,
    		client,
    		select_task,
    		selected_assignment,
    		smhw,
    		ipcRenderer,
    		storage,
    		pageselecttaskquiz_selected_task_binding,
    		pageselecttaskhft_selected_task_binding,
    		pageselecttaskhft_selected_submission_binding,
    		pagequerysubmissions_query_submissions_binding,
    		pagemaindash_selected_task_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
