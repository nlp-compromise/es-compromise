(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.esCompromise = factory());
})(this, (function () { 'use strict';

  const methods$o = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  const model$6 = {
    one: {},
    two: {},
    three: {},
  };
  const compute$7 = {};
  const hooks = [];

  var tmpWrld = { methods: methods$o, model: model$6, compute: compute$7, hooks };

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input, options) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && Object.hasOwn(compute, input)) {
        compute[input](this, options);
      }
      // allow a list of methods
      else if (Array.isArray(input)) {
        input.forEach(name => {
          if (Object.hasOwn(world.compute, name)) {
            compute[name](this, options);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this, options);
      } else {
        console.warn('no compute:', input); // eslint-disable-line
      }
      return this
    },
  };

  // wrappers for loops in javascript arrays

  const forEach = function (cb) {
    const ptrs = this.fullPointer;
    ptrs.forEach((ptr, i) => {
      const view = this.update([ptr]);
      cb(view, i);
    });
    return this
  };

  const map = function (cb, empty) {
    const ptrs = this.fullPointer;
    const res = ptrs.map((ptr, i) => {
      const view = this.update([ptr]);
      const out = cb(view, i);
      // if we returned nothing, return a view
      if (out === undefined) {
        return this.none()
      }
      return out
    });
    if (res.length === 0) {
      return empty || this.update([])
    }
    // return an array of values, or View objects?
    // user can return either from their callback
    if (res[0] !== undefined) {
      // array of strings
      if (typeof res[0] === 'string') {
        return res
      }
      // array of objects
      if (typeof res[0] === 'object' && (res[0] === null || !res[0].isView)) {
        return res
      }
    }
    // return a View object
    let all = [];
    res.forEach(ptr => {
      all = all.concat(ptr.fullPointer);
    });
    return this.toView(all)
  };

  const filter = function (cb) {
    let ptrs = this.fullPointer;
    ptrs = ptrs.filter((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    });
    const res = this.update(ptrs);
    return res
  };

  const find = function (cb) {
    const ptrs = this.fullPointer;
    const found = ptrs.find((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    const ptrs = this.fullPointer;
    return ptrs.some((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    })
  };

  const random = function (n = 1) {
    let ptrs = this.fullPointer;
    let r = Math.floor(Math.random() * ptrs.length);
    //prevent it from going over the end
    if (r + n > this.length) {
      r = this.length - n;
      r = r < 0 ? 0 : r;
    }
    ptrs = ptrs.slice(r, r + n);
    return this.update(ptrs)
  };
  var loops = { forEach, map, filter, find, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** return individual terms*/
    terms: function (n) {
      const m = this.match('.');
      // this is a bit faster than .match('.') 
      // let ptrs = []
      // this.docs.forEach((terms) => {
      //   terms.forEach((term) => {
      //     let [y, x] = term.index || []
      //     ptrs.push([y, x, x + 1])
      //   })
      // })
      // let m = this.update(ptrs)
      return typeof n === 'number' ? m.eq(n) : m
    },

    /** */
    groups: function (group) {
      if (group || group === 0) {
        return this.update(this._groups[group] || [])
      }
      // return an object of Views
      const res = {};
      Object.keys(this._groups).forEach(k => {
        res[k] = this.update(this._groups[k]);
      });
      // this._groups = null
      return res
    },
    /** */
    eq: function (n) {
      let ptr = this.pointer;
      if (!ptr) {
        ptr = this.docs.map((_doc, i) => [i]);
      }
      if (ptr[n]) {
        return this.update([ptr[n]])
      }
      return this.none()
    },
    /** */
    first: function () {
      return this.eq(0)
    },
    /** */
    last: function () {
      const n = this.fullPointer.length - 1;
      return this.eq(n)
    },

    /** grab term[0] for every match */
    firstTerms: function () {
      return this.match('^.')
    },

    /** grab the last term for every match  */
    lastTerms: function () {
      return this.match('.$')
    },

    /** */
    slice: function (min, max) {
      let pntrs = this.pointer || this.docs.map((_o, n) => [n]);
      pntrs = pntrs.slice(min, max);
      return this.update(pntrs)
    },

    /** return a view of the entire document */
    all: function () {
      return this.update().toView()
    },
    /**  */
    fullSentences: function () {
      const ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
      return this.update(ptrs).toView()
    },
    /** return a view of no parts of the document */
    none: function () {
      return this.update([])
    },

    /** are these two views looking at the same words? */
    isDoc: function (b) {
      if (!b || !b.isView) {
        return false
      }
      const aPtr = this.fullPointer;
      const bPtr = b.fullPointer;
      if (!aPtr.length === bPtr.length) {
        return false
      }
      // ensure pointers are the same
      return aPtr.every((ptr, i) => {
        if (!bPtr[i]) {
          return false
        }
        // ensure [n, start, end] are all the same
        return ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2]
      })
    },

    /** how many seperate terms does the document have? */
    wordCount: function () {
      return this.docs.reduce((count, terms) => {
        count += terms.filter(t => t.text !== '').length;
        return count
      }, 0)
    },

    // is the pointer the full sentence?
    isFull: function () {
      const ptrs = this.pointer;
      if (!ptrs) {
        return true
      }
      // must start at beginning
      if (ptrs.length === 0 || ptrs[0][0] !== 0) {
        return false
      }
      let wantTerms = 0;
      let haveTerms = 0;
      this.document.forEach(terms => wantTerms += terms.length);
      this.docs.forEach(terms => haveTerms += terms.length);
      return wantTerms === haveTerms
      // for (let i = 0; i < ptrs.length; i += 1) {
      //   let [n, start, end] = ptrs[i]
      //   // it's not the start
      //   if (n !== i || start !== 0) {
      //     return false
      //   }
      //   // it's too short
      //   if (document[n].length > end) {
      //     return false
      //   }
      // }
      // return true
    },

    // return the nth elem of a doc
    getNth: function (n) {
      if (typeof n === 'number') {
        return this.eq(n)
      } else if (typeof n === 'string') {
        return this.if(n)
      }
      return this
    }

  };
  utils.group = utils.groups;
  utils.fullSentence = utils.fullSentences;
  utils.sentence = utils.fullSentences;
  utils.lastTerm = utils.lastTerms;
  utils.firstTerm = utils.firstTerms;

  const methods$n = { ...utils, ...fns$4, ...loops };

  // aliases
  methods$n.get = methods$n.eq;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      const props = [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
        ['viewType', 'View'],
      ];
      props.forEach(a => {
        Object.defineProperty(this, a[0], {
          value: a[1],
          writable: true,
        });
      });
      this.ptrs = pointer;
    }
    /* getters:  */
    get docs() {
      let docs = this.document;
      if (this.ptrs) {
        docs = tmpWrld.methods.one.getDoc(this.ptrs, this.document);
      }
      return docs
    }
    get pointer() {
      return this.ptrs
    }
    get methods() {
      return this.world.methods
    }
    get model() {
      return this.world.model
    }
    get hooks() {
      return this.world.hooks
    }
    get isView() {
      return true //this comes in handy sometimes
    }
    // is the view not-empty?
    get found() {
      return this.docs.length > 0
    }
    // how many matches we have
    get length() {
      return this.docs.length
    }
    // return a more-hackable pointer
    get fullPointer() {
      const { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      const pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
        // eslint-disable-next-line prefer-const
        let [n, start, end, id, endId] = a;
        start ||= 0;
        end ||= (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n]?.[start]) {
          id ||= document[n][start].id;
          if (document[n][end - 1]) {
            endId ||= document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      const m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer?.length > 0) {
        // only keep cache if it's a full-sentence
        const cache = [];
        pointer.forEach((ptr, i) => {
          const [n, start, end] = ptr;
          if (ptr.length === 1) {
            cache[i] = this._cache[n];
          } else if (start === 0 && this.document[n].length === end) {
            cache[i] = this._cache[n];
          }
        });
        if (cache.length > 0) {
          m._cache = cache;
        }
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      return new View(this.document, pointer || this.pointer)
    }
    fromText(input) {
      const { methods } = this;
      //assume ./01-tokenize is installed
      const document = methods.one.tokenize.fromString(input, this.world);
      const doc = new View(document);
      doc.world = this.world;
      doc.compute(['normal', 'freeze', 'lexicon']);
      if (this.world.compute.preTagger) {
        doc.compute('preTagger');
      }
      doc.compute('unfreeze');
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0); //node 17: structuredClone(document);
      document = document.map(terms => {
        return terms.map(term => {
          term = { ...term };
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      const m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, methods$n);

  var version$1 = '14.19.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  const isUnsafeKey = key => key === '__proto__' || key === 'constructor' || key === 'prototype';

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$6(plugin)) {
      for (const key in plugin) {
        // prevent prototype pollution
        if (isUnsafeKey(key)) {
          continue
        }
        if (isObject$6(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
        } else {
          Object.assign(model, { [key]: plugin[key] });
        }
      }
    }
    return model
  }
  // const merged = mergeDeep({ a: 1 }, { b: { c: { d: { e: 12345 } } } })
  // console.dir(merged, { depth: 5 })

  // vroom
  function mergeQuick(model, plugin) {
    for (const key in plugin) {
      if (isUnsafeKey(key)) continue
      model[key] ||= {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  const addIrregulars = function (model, conj) {
    const m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      // verb forms
      if (conj[k].pastTense) {
        if (m.toPast) {
          m.toPast.ex[k] = conj[k].pastTense;
        }
        if (m.fromPast) {
          m.fromPast.ex[conj[k].pastTense] = k;
        }
      }
      if (conj[k].presentTense) {
        if (m.toPresent) {
          m.toPresent.ex[k] = conj[k].presentTense;
        }
        if (m.fromPresent) {
          m.fromPresent.ex[conj[k].presentTense] = k;
        }
      }
      if (conj[k].gerund) {
        if (m.toGerund) {
          m.toGerund.ex[k] = conj[k].gerund;
        }
        if (m.fromGerund) {
          m.fromGerund.ex[conj[k].gerund] = k;
        }
      }
      // adjective forms
      if (conj[k].comparative) {
        if (m.toComparative) {
          m.toComparative.ex[k] = conj[k].comparative;
        }
        if (m.fromComparative) {
          m.fromComparative.ex[conj[k].comparative] = k;
        }
      }
      if (conj[k].superlative) {
        if (m.toSuperlative) {
          m.toSuperlative.ex[k] = conj[k].superlative;
        }
        if (m.fromSuperlative) {
          m.fromSuperlative.ex[conj[k].superlative] = k;
        }
      }
    });
  };

  const extend = function (plugin, world, View, nlp) {
    // support array of plugins
    if (Array.isArray(plugin)) {
      plugin.forEach(p => extend(p, world, View, nlp));
      return
    }
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
    }
    if (plugin.irregulars) {
      addIrregulars(model, plugin.irregulars);
    }
    // shallow-merge compute
    if (plugin.compute) {
      Object.assign(compute, plugin.compute);
    }
    // append new hooks
    if (hooks) {
      world.hooks = hooks.concat(plugin.hooks || []);
    }
    // assign new class methods
    if (plugin.api) {
      plugin.api(View);
    }
    if (plugin.lib) {
      Object.keys(plugin.lib).forEach(k => (nlp[k] = plugin.lib[k]));
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.frozen) {
      nlp.addWords(plugin.frozen, true);
    }
    if (plugin.mutate) {
      plugin.mutate(world, nlp);
    }
  };

  // Shared CLI colors and styles.
  const color = code => s => '\x1b[' + code + 'm' + s + '\x1b[0m';

  const green = color(32);
  const red = color(31);
  const blue = color(34);
  const magenta = color(35);
  const cyan = color(36);
  const yellow = color(33);
  const black = color(30);
  const white = color(37);
  const dim = color(2);
  const i$1 = color(3);
  const b = color(1);
  const ul = color(4);
  const grey = color(90);

  var cli$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    b: b,
    black: black,
    blue: blue,
    cyan: cyan,
    dim: dim,
    green: green,
    grey: grey,
    i: i$1,
    magenta: magenta,
    red: red,
    ul: ul,
    white: white,
    yellow: yellow
  });

  const env = globalThis.process?.env ?? globalThis.env ?? {};
  const debug$3 = { tags: Boolean(env.DEBUG_TAGS) };

  // Capture only the requested terms, and only while tracing.
  const before$1 = term => {
    if (debug$3.tags && (!debug$3.word || debug$3.word === (term.normal || term.text || term.implicit || '').toLowerCase())) {
      return [...term.tags]
    }
    return null
  };

  // Show actual changes, including conflict removals.
  const log = (term, previous, reason = '') => {
    if (!previous) {
      return
    }
    const added = [...term.tags].filter(tag => !previous.includes(tag));
    const removed = previous.filter(tag => !term.tags.has(tag));
    if (!added.length && !removed.length) {
      return
    }
    const text = term.text || term.implicit || '';
    const index = term.index?.join(':') || '?';
    const prefix = debug$3.prefix || '   ';
    if (debug$3.rule !== reason) {
      const headingPrefix = debug$3.prefix ? prefix.replace('│  ', '│ ') : '  ';
      console.log(`${headingPrefix}${dim(white((reason || 'tag change') + ':'))}`); // eslint-disable-line no-console
      debug$3.rule = reason;
    }
    const print = (tags, sign, color) => {
      if (!tags.length) {
        return
      }
      const word = color(`'${text}'`);
      const changes = tags.map(tag => color(`#${tag}`)).join(' ');
      console.log(`${prefix}${color(sign)} ${word} ${dim(index.padEnd(9))} ${changes}`); // eslint-disable-line no-console
    };
    print(removed, '−', red);
    print(added, '+', green);
  };

  debug$3.before = before$1;
  debug$3.log = log;

  // Install only while verbose matching is enabled; restore the original hot path.
  const matchDebug = (world, options) => {
    const one = world.methods.one;
    const match = one.match;
    const parse = one.parseMatch;
    const sources = new WeakMap();
    const word = options.word?.toLowerCase();
    const includesWord = terms =>
      !word || terms.some(term => (term.normal || term.text || term.implicit || '').toLowerCase() === word);

    const parseLogged = function (...args) {
      const regs = parse.apply(this, args);
      sources.set(regs, String(args[0]));
      return regs
    };
    const matchLogged = function (docs, todo, cache) {
      const result = match.call(this, docs, todo, cache);
      const pattern = todo.match || sources.get(todo.regs) || '[parsed pattern]';
      if (options.pattern !== undefined && pattern !== options.pattern) {
        return result
      }
      if (word && !docs.some(includesWord)) {
        return result
      }
      const matches = result.ptrs
        .map(([n, start, end]) => docs[n].slice(start, end))
        .filter(includesWord);
      if (word && result.ptrs.length && !matches.length) {
        return result
      }
      debug$3.rule = undefined;
      const status = result.ptrs.length ? green('✓') : red('✗');
      const spans = matches.map(terms => {
        const text = terms.map(term => term.text || term.implicit).join(' ');
        return `${green("'" + text + "'")} ${dim(terms[0]?.index?.join(':') || '?')}`
      }).join(', ');
      const rule = pattern.length > 80 ? pattern.slice(0, 79) + '…' : pattern;
      const words = spans ? spans + '  ' : ' ---         ';
      console.log(`${debug$3.prefix || '   '}${status} ${words}${dim(i$1(rule))}`); // eslint-disable-line no-console
      return result
    };
    one.parseMatch = parseLogged;
    one.match = matchLogged;
    return () => {
      // Do not overwrite a plugin's replacement installed during tracing.
      if (one.parseMatch === parseLogged) {
        one.parseMatch = parse;
      }
      if (one.match === matchLogged) {
        one.match = match;
      }
    }
  };

  const colorSpec = doc => {
    return doc.docs
      .map((terms, index) => {
        const plain = terms
          .map(t => t.pre + t.text + t.post)
          .join('')
          .trim();
        const text = dim("'" + plain + "'");
        const spec = doc.update([[index]]).out('spec');
        return text + grey(i$1(spec.slice(plain.length)))
      })
      .join('\n')
  };

  // Trace the actual pipeline once, including the initial tokenized document.
  const hooksDebug = headings => (doc, hooks) => {
    const width = Math.max('tokenize'.length, ...hooks.map(hook => hook.length));
    const snapshot = (hook, nested = false) => {
      const output = colorSpec(doc);
      output.split('\n').forEach((line, index, lines) => {
        if (nested) {
          const branch = index === lines.length - 1 ? ' ╰─' : '│ ';
          console.log(`  ${dim(branch)} ${line}`); // eslint-disable-line no-console
          return
        }
        const label = (index === 0 ? hook : '').padEnd(width);
        console.log(`  ${dim(label)}  ${line}`); // eslint-disable-line no-console
      });
    };
    snapshot('tokenize');
    hooks.forEach(hook => {
      const nested = headings;
      const prefix = debug$3.prefix;
      const rule = debug$3.rule;
      debug$3.rule = undefined;
      if (nested) {
        console.log(`  ${blue(b(ul(hook + ':')))}`); // eslint-disable-line no-console
        debug$3.prefix = dim('   │  ');
      }
      // Restore the log prefix even when a plugin hook throws.
      try {
        doc.compute(hook);
        snapshot(hook, nested);
      } finally {
        debug$3.prefix = prefix;
        debug$3.rule = rule;
      }
    });
  };

  let restoreMatch;

  /** log the decision-making to console */
  const verbose = function (set = true, options = {}) {
    restoreMatch?.();
    restoreMatch = undefined;
    if (set === 'match' || set === true) {
      restoreMatch = matchDebug(this._world, options);
    }
    const env = globalThis.process?.env ?? globalThis.env ?? {}; //use window, in browser
    debug$3.hooks = set === 'hooks' || set === true ? hooksDebug(set === true) : undefined;
    debug$3.word = options.word?.toLowerCase();
    debug$3.contractions = set === 'contractions' || set === true;
    debug$3.rule = undefined;
    debug$3.tags = set === 'tagger' || set === true;
    env.DEBUG_TAGS = debug$3.tags ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    return this
  };

  const isObject$5 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (Array.isArray(term.tags)) {
          term.tags = new Set(term.tags);
        }
        return term
      })
    })
  };

  // interpret an array-of-arrays
  const preTokenized = function (arr) {
    return arr.map((a) => {
      return a.map(str => {
        return {
          text: str,
          normal: str,//cleanup
          pre: '',
          post: ' ',
          tags: new Set()
        }
      })
    })
  };

  const inputs = function (input, View, world) {
    const { methods } = world;
    const doc = new View([]);
    doc.world = world;
    // support a number
    if (typeof input === 'number') {
      input = String(input);
    }
    // return empty doc
    if (!input) {
      return doc
    }
    // parse a string
    if (typeof input === 'string') {
      const document = methods.one.tokenize.fromString(input, world);
      return new View(document)
    }
    // handle compromise View
    if (isObject$5(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (Array.isArray(input)) {
      // pre-tokenized array-of-arrays 
      if (Array.isArray(input[0])) {
        const document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      const document = fromJson(input);
      return new View(document)
    }
    return doc
  };

  const world = { ...tmpWrld };

  const nlp = function nlp(input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
    if (input) {
      if (debug$3.hooks) {
        debug$3.hooks(doc, world.hooks);
      } else {
        doc.compute(world.hooks);
      }
    }
    return doc
  };
  Object.defineProperty(nlp, '_world', {
    value: world,
    writable: true,
  });

  /** don't run the POS-tagger */
  nlp.tokenize = function (input, lex) {
    const { compute } = this._world;
    // add user-given words to lexicon
    if (lex) {
      nlp.addWords(lex);
    }
    // run the tokenizer
    const doc = inputs(input, View, world);
    // give contractions a shot, at least
    if (debug$3.hooks) {
      debug$3.hooks(doc, compute.contractions ? ['alias', 'normal', 'machine', 'contractions'] : []);
    } else if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };

  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend(plugin, this._world, View, this);
    return this
  };
  nlp.extend = nlp.plugin;

  /** reach-into compromise internals */
  nlp.world = function () {
    return this._world
  };
  nlp.model = function () {
    return this._world.model
  };
  nlp.methods = function () {
    return this._world.methods
  };
  nlp.hooks = function () {
    return this._world.hooks
  };

  // log the decision-making to console
  nlp.verbose = verbose;
  // current library release version
  nlp.version = version$1;

  const createCache = function (document) {
    const cache = document.map(terms => {
      const items = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          items.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          items.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          items.add(term.implicit);
        }
        if (term.machine) {
          items.add(term.machine);
        }
        if (term.root) {
          items.add(term.root);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => items.add(str));
        }
        term.tags.forEach(tag => {
          items.add('#' + tag);
        });
      });
      return items
    });
    return cache
  };

  var methods$m = {
    one: {
      cacheDoc: createCache,
    },
  };

  const methods$l = {
    /** */
    cache: function () {
      this._cache = this.methods.one.cacheDoc(this.document);
      return this
    },
    /** */
    uncache: function () {
      this._cache = null;
      return this
    },
  };
  const addAPI$3 = function (View) {
    Object.assign(View.prototype, methods$l);
  };

  var compute$6 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: addAPI$3,
    compute: compute$6,
    methods: methods$m,
  };

  var caseFns = {
    /** */
    toLowerCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toLowerCase();
      });
      return this
    },
    /** */
    toUpperCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toUpperCase();
      });
      return this
    },
    /** */
    toTitleCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
      });
      return this
    },
    /** */
    toCamelCase: function () {
      this.docs.forEach(terms => {
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
          }
          if (i !== terms.length - 1) {
            t.post = '';
          }
        });
      });
      return this
    },
  };

  // case logic
  const isTitleCase$1 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase$1 = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase$1 = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      parent.splice(index, 0, ...child);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    const lastTerm = terms.at(-1);
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // sentence-ending punctuation should move in append
  const movePunct = (source, end, needle) => {
    const juicy = /[-.?!,;:)–—'"]/g;
    const wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    const post = wasLast.post;
    if (juicy.test(post)) {
      const punct = post.match(juicy).join(''); //not perfect
      const last = needle.at(-1);
      last.post = punct + last.post;
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };


  const moveTitleCase = function (home, start, needle) {
    const from = home[start];
    // should we bother?
    if (start !== 0 || !isTitleCase$1(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase$1(needle[0].text);
    // should we un-titlecase the old word?
    const old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase$1(old.text) && old.text.length > 1) {
      old.text = toLowerCase$1(old.text);
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document) {
    const [n, start, end] = ptr;
    // introduce spaces appropriately
    if (start === 0) {
      // at start - need space in insert
      endSpace(needle);
    } else if (end === document[n].length) {
      // at end - need space in home
      endSpace(needle);
    } else {
      // in middle - need space in home and insert
      endSpace(needle);
      endSpace([home[ptr[1]]]);
    }
    moveTitleCase(home, start, needle);
    // movePunct(home, end, needle)
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document) {
    const [n, , end] = ptr;
    const total = (document[n] || []).length;
    if (end < total) {
      // are we in the middle?
      // add trailing space on self
      movePunct(home, end, needle);
      endSpace(needle);
    } else if (total === end) {
      // are we at the end?
      // add a space to predecessor
      endSpace(home);
      // very end, move period
      movePunct(home, end, needle);
      // is there another sentence after?
      if (document[n + 1]) {
        needle.at(-1).post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle.at(-1).id;
  };

  /*
  unique & ordered term ids, based on time & term index

  Base 36 (numbers+ascii)
    3 digit 4,600
    2 digit 1,200
    1 digit 36

    TTT|NNN|II|R

  TTT -> 46 terms since load
  NNN -> 46 thousand sentences (>1 inf-jest)
  II  -> 1,200 words in a sentence (nuts)
  R   -> 1-36 random number 

  novels: 
    avg 80,000 words
      15 words per sentence
    5,000 sentences

  Infinite Jest:
    36,247 sentences
    https://en.wikipedia.org/wiki/List_of_longest_novels

  collisions are more-likely after
      46 seconds have passed,
    and 
      after 46-thousand sentences

  */
  let index$1 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$1 += 1;

    //don't overflow index
    index$1 = index$1 > 46655 ? 0 : index$1;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$1.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    let tx = i.toString(36);
    tx = tx.length < 2 ? '0' + tx : tx; //pad2
    id += tx;

    // 1 digit random number
    const r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$1 = function (m) {
    if (m.has('@hasContraction') && typeof m.contractions === 'function') {
      //&& m.after('^.').has('@hasContraction')
      const more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map(term => {
      term.id = toId(term);
      return term
    });
    return terms
  };

  const getTerms = function (input, world) {
    const { methods } = world;
    // create our terms from a string
    if (typeof input === 'string') {
      return methods.one.tokenize.fromString(input, world)[0] //assume one sentence
    }
    //allow a view object
    if (typeof input === 'object' && input.isView) {
      return input.clone().docs[0] || [] //assume one sentence
    }
    //allow an array of terms, too
    if (Array.isArray(input)) {
      return Array.isArray(input[0]) ? input[0] : input
    }
    return []
  };

  const insert = function (input, view, prepend) {
    const { document, world } = view;
    view.uncache();
    // insert words at end of each doc
    const ptrs = view.fullPointer;
    const selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      const ptr = m.fullPointer[0];
      const [n] = ptr;
      // add-in the words
      const home = document[n];
      let terms = getTerms(input, world);
      // are we inserting nothing?
      if (terms.length === 0) {
        return
      }
      terms = addIds$2(terms);
      if (prepend) {
        expand$1(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document);
      } else {
        expand$1(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document);
      }
      // harden the pointer
      if (document[n]?.[ptr[1]]) {
        ptr[3] = document[n][ptr[1]].id;
      }
      // change self backwards by len
      selfPtrs[i] = ptr;
      // extend the pointer
      ptr[2] += terms.length;
      ptrs[i] = ptr;
    });
    const doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    doc.compute(['id', 'index', 'freeze', 'lexicon']);
    if (doc.world.compute.preTagger) {
      doc.compute('preTagger');
    }
    doc.compute('unfreeze');
    return doc
  };

  const fns$3 = {
    insertAfter: function (input) {
      return insert(input, this, false)
    },
    insertBefore: function (input) {
      return insert(input, this, true)
    },
  };
  fns$3.append = fns$3.insertAfter;
  fns$3.prepend = fns$3.insertBefore;
  fns$3.insert = fns$3.insertAfter;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  // case logic
  const isTitleCase = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn, keep) {
    main.forEach(m => {
      const out = fn(m);
      m.replaceWith(out, keep);
    });
    return main
  };

  // support 'foo $0' replacements
  const subDollarSign = function (input, main) {
    if (typeof input !== 'string') {
      return input
    }
    const groups = main.groups();
    input = input.replace(dollarStub, a => {
      const num = a.replace(/\$/, '');
      if (Object.hasOwn(groups, num)) {
        return groups[num].text()
      }
      return a
    });
    return input
  };

  fns$2.replaceWith = function (input, keep = {}) {
    let ptrs = this.fullPointer;
    // support keep-all option
    if (keep === true) {
      keep = {
        tags: true,
        case: true,
        possessives: true,
      };
    }
    const main = this;
    this.uncache();
    if (typeof input === 'function') {
      return replaceByFn(main, input, keep)
    }
    const terms = main.docs[0];
    if (!terms) return main
    const isOriginalPossessive = keep.possessives && terms.at(-1).tags.has('Possessive');
    const isOriginalTitleCase = keep.case && isTitleCase(terms[0].text);
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    const original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    const originalPre = original.docs[0][0].pre;
    const originalPost = original.docs[0].at(-1).post;
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      const more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.

    // keep "John's"
    if (isOriginalPossessive) {
      const tmp = main.docs[0];
      const term = tmp.at(-1);
      if (!term.tags.has('Possessive')) {
        term.text += "'s";
        term.normal += "'s";
        term.tags.add('Possessive');
      }
    }

    // try to keep some pre-punctuation
    if (originalPre && main.docs[0]) {
      main.docs[0][0].pre = originalPre;
    }
    // try to keep any post-punctuation
    if (originalPost && main.docs[0]) {
      const lastOne = main.docs[0].at(-1);
      if (!lastOne.post.trim()) {
        lastOne.post = originalPost;
      }
    }
    // what should we return?
    const m = main.toView(ptrs).compute(['index', 'freeze', 'lexicon']);
    if (m.world.compute.preTagger) {
      m.compute('preTagger');
    }
    m.compute('unfreeze');
    // replace any old tags
    if (keep.tags) {
      // truncate old tags to only touch new terms
      oldTags = oldTags.slice(0, input.wordCount());
      m.terms().forEach((term, i) => {
        term.tagSafe(oldTags[i]);
      });
    }

    if (!m.docs[0] || !m.docs[0][0]) return m

    // try to co-erce case, too
    if (keep.case) {
      const transformCase = isOriginalTitleCase ? toTitleCase : toLowerCase;
      m.docs[0][0].text = transformCase(m.docs[0][0].text);
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && !input) {
      return this.replaceWith(match, keep)
    }
    const m = this.match(match);
    if (!m.found) {
      return this
    }
    this.soften();
    return m.replaceWith(input, keep)
  };

  // Remove only the first qualifying run, matching String.replace without /g.
  const removeRunBefore = (str, run, following) => {
    let i = 0;
    while (i < str.length) {
      if (!run.includes(str[i])) {
        i++;
        continue
      }
      const start = i;
      while (i < str.length && run.includes(str[i])) i++;
      if (i < str.length && following.includes(str[i])) {
        return str.slice(0, start) + str.slice(i)
      }
    }
    return str
  };

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    const last = terms.length - 1;
    const from = terms[last];
    const to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = removeRunBefore(to.post, ' ', '.?!,;:');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = removeRunBefore(to.post, ',;:', '.?!');
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots) {
    nots.forEach(ptr => {
      const [n, start, end] = ptr;
      const len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (end === document[n].length && end > 1) {
        repairPunct(document[n], len);
      }
      document[n].splice(start, len); // replaces len terms at index start
    });
    // remove any now-empty sentences
    // (foreach + splice = 'mutable filter')
    for (let i = document.length - 1; i >= 0; i -= 1) {
      if (document[i].length === 0) {
        document.splice(i, 1);
        // remove any trailing whitespace before our removed sentence
        if (i === document.length && document[i - 1]) {
          const terms = document[i - 1];
          const lastTerm = terms.at(-1);
          if (lastTerm) {
            lastTerm.post = lastTerm.post.trimEnd();
          }
        }
        // repair any downstream indexes
        // for (let k = i; k < document.length; k += 1) {
        //   document[k].forEach(term => term.index[0] -= 1)
        // }
      }
    }
    return document
  };

  const fixPointers$1 = function (ptrs, gonePtrs) {
    ptrs = ptrs.map(ptr => {
      const [n] = ptr;
      if (!gonePtrs[n]) {
        return ptr
      }
      gonePtrs[n].forEach(no => {
        const len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        }
      });
      return ptr
    });

    // decrement any pointers after a now-empty pointer
    ptrs.forEach((ptr, i) => {
      // is the pointer now empty?
      if (ptr[1] === 0 && ptr[2] == 0) {
        // go down subsequent pointers
        for (let n = i + 1; n < ptrs.length; n += 1) {
          ptrs[n][0] -= 1;
          if (ptrs[n][0] < 0) {
            ptrs[n][0] = 0;
          }
        }
      }
    });
    // remove any now-empty pointers
    ptrs = ptrs.filter(ptr => ptr[2] - ptr[1] > 0);

    // remove old hard-pointers
    ptrs = ptrs.map((ptr) => {
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    return ptrs
  };

  const methods$k = {
    /** */
    remove: function (reg) {
      const { indexN } = this.methods.one.pointer;
      this.uncache();
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a match, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      const isFull = !self.ptrs;
      // is it part of a contraction?
      if (not.has('@hasContraction') && not.contractions) {
        const more = not.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      const nots = not.fullPointer.reverse();
      // remove them from the actual document)
      const document = pluckOut(this.document, nots);
      // repair our pointers
      const gonePtrs = indexN(nots);
      ptrs = fixPointers$1(ptrs, gonePtrs);
      // clean up our original inputs
      self.ptrs = ptrs;
      self.document = document;
      self.compute('index');
      // if we started zoomed-out, try to end zoomed-out
      if (isFull) {
        self.ptrs = undefined;
      }
      if (!reg) {
        this.ptrs = [];
        return self.none()
      }
      const res = self.toView(ptrs); //return new document
      return res
    },
  };

  // aliases
  methods$k.delete = methods$k.remove;

  const methods$j = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      this.docs.forEach(terms => {
        const term = terms[0];
        if (concat === true) {
          term.pre += str;
        } else {
          term.pre = str;
        }
      });
      return this
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        const last = this.docs.at(-1);
        return last.at(-1).post
      }
      this.docs.forEach(terms => {
        const term = terms.at(-1);
        if (concat === true) {
          term.post += str;
        } else {
          term.post = str;
        }
      });
      return this
    },

    /** remove whitespace from start/end */
    trim: function () {
      if (!this.found) {
        return this
      }
      const docs = this.docs;
      const start = docs[0][0];
      start.pre = start.pre.trimStart();
      const last = docs.at(-1);
      const end = last.at(-1);
      end.post = end.post.trimEnd();
      return this
    },

    /** connect words with hyphen, and remove whitespace */
    hyphenate: function () {
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.pre = '';
          }
          if (terms[i + 1]) {
            t.post = '-';
          }
        });
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-–—]/;
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach(t => {
          if (hasHyphen.test(t.post)) {
            t.post = ' ';
          }
        });
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      start ||= `"`;
      end ||= `"`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms.at(-1);
        last.post = end + last.post;
      });
      return this
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      start ||= `(`;
      end ||= `)`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms.at(-1);
        last.post = end + last.post;
      });
      return this
    },
  };

  // aliases
  methods$j.deHyphenate = methods$j.dehyphenate;
  methods$j.toQuotation = methods$j.toQuotations;

  /** alphabetical order */
  const alpha = (a, b) => {
    if (a.normal < b.normal) {
      return -1
    }
    if (a.normal > b.normal) {
      return 1
    }
    return 0
  };

  /** count the # of characters of each match */
  const length = (a, b) => {
    const left = a.normal.trim().length;
    const right = b.normal.trim().length;
    if (left < right) {
      return 1
    }
    if (left > right) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const wordCount$1 = (a, b) => {
    if (a.words < b.words) {
      return 1
    }
    if (a.words > b.words) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const sequential = (a, b) => {
    if (a[0] < b[0]) {
      return 1
    }
    if (a[0] > b[0]) {
      return -1
    }
    return a[1] > b[1] ? 1 : -1
  };

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    const counts = Object.create(null);
    arr.forEach(o => {
      counts[o.normal] ??= 0;
      counts[o.normal] += 1;
    });
    // sort by freq
    arr.sort((a, b) => {
      const left = counts[a.normal];
      const right = counts[b.normal];
      if (left < right) {
        return 1
      }
      if (left > right) {
        return -1
      }
      return 0
    });
    return arr
  };

  var methods$i = { alpha, length, wordCount: wordCount$1, sequential, byFreq };

  // aliases
  const seqNames = new Set(['index', 'sequence', 'seq', 'sequential', 'chron', 'chronological']);
  const freqNames = new Set(['freq', 'frequency', 'topk', 'repeats']);
  const alphaNames = new Set(['alpha', 'alphabetical']);

  // support function as parameter
  const customSort = function (view, fn) {
    let ptrs = view.fullPointer;
    ptrs = ptrs.sort((a, b) => {
      a = view.update([a]);
      b = view.update([b]);
      return fn(a, b)
    });
    view.ptrs = ptrs; //mutate original
    return view
  };

  /** re-arrange the order of the matches (in place) */
  const sort = function (input) {
    const { docs, pointer } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input ||= 'alpha';
    const ptrs = pointer || docs.map((_d, n) => [n]);
    let arr = docs.map((terms, n) => {
      return {
        index: n,
        words: terms.length,
        normal: terms.map(t => t.machine || t.normal || '').join(' '),
        pointer: ptrs[n],
      }
    });
    // 'chronological' sorting
    if (seqNames.has(input)) {
      input = 'sequential';
    }
    // alphabetical sorting
    if (alphaNames.has(input)) {
      input = 'alpha';
    }
    // sort by frequency
    if (freqNames.has(input)) {
      arr = methods$i.byFreq(arr);
      return this.update(arr.map(o => o.pointer))
    }
    // apply sort method on each phrase
    if (typeof methods$i[input] === 'function') {
      arr = arr.sort(methods$i[input]);
      return this.update(arr.map(o => o.pointer))
    }
    return this
  };

  /** reverse the order of the matches, but not the words or index */
  const reverse$1 = function () {
    let ptrs = this.pointer || this.docs.map((_d, n) => [n]);
    ptrs = [].concat(ptrs);
    ptrs = ptrs.reverse();
    if (this._cache) {
      this._cache = this._cache.reverse();
    }
    return this.update(ptrs)
  };

  /** remove any duplicate matches */
  const unique = function () {
    const already = new Set();
    const res = this.filter(m => {
      const txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$1, sort };

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs.at(-1);
      const last = end.at(-1);
      if (/ /.test(last.post) === false) {
        last.post += ' ';
      }
    }
    homeDocs = homeDocs.concat(inputDocs);
    return homeDocs
  };

  const combineViews = function (home, input) {
    // is it a view from the same document?
    if (home.document === input.document) {
      const ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    const ptrs = input.fullPointer;
    ptrs.forEach(a => {
      a[0] += home.document.length;
    });
    home.document = combineDocs(home.document, input.docs);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      // parse and splice-in new terms
      if (typeof input === 'string') {
        const more = this.fromText(input);
        // easy concat
        if (!this.found || !this.ptrs) {
          this.document = this.document.concat(more.document);
        } else {
          // if we are in the middle, this is actually a splice operation
          const ptrs = this.fullPointer;
          const at = ptrs.at(-1)[0];
          this.document.splice(at, 0, ...more.document);
        }
        // put the docs
        return this.all().compute('index')
      }
      // plop some view objects together
      if (typeof input === 'object' && input.isView) {
        return combineViews(this, input)
      }
      // assume it's an array of terms
      if (Array.isArray(input)) {
        const docs = combineDocs(this.document, input);
        this.document = docs;
        return this.all()
      }
      return this
    },
  };

  // add indexes to pointers
  const harden = function () {
    this.ptrs = this.fullPointer;
    return this
  };
  // remove indexes from pointers
  const soften = function () {
    let ptr = this.ptrs;
    if (!ptr || ptr.length === 0) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$h = { ...caseFns, ...fns$3, ...fns$2, ...methods$k, ...methods$j, ...sort$1, ...concat, ...harden$1 };

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$h);
  };

  const compute$5 = {
    id: function (view) {
      const docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          const term = docs[n][i];
          term.id ||= toId(term);
        }
      }
    }
  };

  var change = {
    api: addAPI$2,
    compute: compute$5,
  };

  var contractions$2 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'arent', out: ['are', 'not'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
    { word: "can't", out: ['can', 'not'] },
    { word: "shan't", out: ['should', 'not'] },
    { word: "won't", out: ['will', 'not'] },
    { word: "that's", out: ['that', 'is'] },
    { word: "what's", out: ['what', 'is'] },
    { word: "let's", out: ['let', 'us'] },
    // { word: "there's", out: ['there', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gimme', out: ['give', 'me'] },
    { word: 'outta', out: ['out', 'of'] },
    { word: 'tryna', out: ['trying', 'to'] },
    { word: 'gtg', out: ['got', 'to', 'go'] },
    { word: 'im', out: ['i', 'am'] },
    { word: 'imma', out: ['I', 'will'] },
    { word: 'imo', out: ['in', 'my', 'opinion'] },
    { word: 'irl', out: ['in', 'real', 'life'] },
    { word: 'ive', out: ['i', 'have'] },
    { word: 'rn', out: ['right', 'now'] },
    { word: 'tbh', out: ['to', 'be', 'honest'] },
    { word: 'wanna', out: ['want', 'to'] },
    { word: `c'mere`, out: ['come', 'here'] },
    { word: `c'mon`, out: ['come', 'on'] },
    // shoulda, coulda
    { word: 'shoulda', out: ['should', 'have'] },
    { word: 'coulda', out: ['coulda', 'have'] },
    { word: 'woulda', out: ['woulda', 'have'] },
    { word: 'musta', out: ['must', 'have'] },

    { word: "tis", out: ['it', 'is'] },
    { word: "twas", out: ['it', 'was'] },
    { word: `y'know`, out: ['you', 'know'] },
    { word: "ne'er", out: ['never'] },
    { word: "o'er", out: ['over'] },
    // contraction-part mappings
    { after: 'll', out: ['will'] },
    { after: 've', out: ['have'] },
    { after: 're', out: ['are'] },
    { after: 'm', out: ['am'] },
    // french contractions
    { before: 'c', out: ['ce'] },
    { before: 'm', out: ['me'] },
    { before: 'n', out: ['ne'] },
    { before: 'qu', out: ['que'] },
    { before: 's', out: ['se'] },
    { before: 't', out: ['tu'] }, // t'aime

    // missing apostrophes
    { word: 'shouldnt', out: ['should', 'not'] },
    { word: 'couldnt', out: ['could', 'not'] },
    { word: 'wouldnt', out: ['would', 'not'] },
    { word: 'hasnt', out: ['has', 'not'] },
    { word: 'wasnt', out: ['was', 'not'] },
    { word: 'isnt', out: ['is', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },
  ];

  // number suffixes that are not units
  const t = true;
  var numberSuffixes = {
    'st': t,
    'nd': t,
    'rd': t,
    'th': t,
    'am': t,
    'pm': t,
    'max': t,
    '°': t,
    's': t, // 1990s
    'e': t, // 18e - french/spanish ordinal
    'er': t, //french 1er
    'ère': t, //''
    'ème': t, //french 2ème
  };

  var model$5 = {
    one: {
      contractions: contractions$2,
      numberSuffixes
    }
  };

  // Log decisions before splicing replaces the original term.
  const contractionDebug = (term, expansion) => {
    if (!debug$3.contractions || (debug$3.word && debug$3.word !== (term.normal || term.text).toLowerCase())) {
      return
    }
    debug$3.rule = undefined;
    const result = expansion ? '[' + expansion.map(word => yellow(`'${word}'`)).join(', ') + ']' : 'possessive (kept)';
    console.log(`${debug$3.prefix || '   '}${yellow(JSON.stringify(term.text))} →  ${result}`); // eslint-disable-line no-console
  };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    const [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word, i) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
      word.index = [n, w + i];
      return word
    });
    if (words[0]) {
      // move whitespace over
      words[0].pre = document[n][w].pre;
      words[words.length - 1].post = document[n][w].post;
      // add the text/normal to the first term
      words[0].text = document[n][w].text;
      words[0].normal = document[n][w].normal; // move tags too?
    }
    // do the splice
    document[n].splice(w, 1, ...words);
  };

  const hasContraction$1 = /'/;
  //look for a past-tense verb
  // const hasPastTense = (terms, i) => {
  //   let after = terms.slice(i + 1, i + 3)
  //   return after.some(t => t.tags.has('PastTense'))
  // }
  // he'd walked -> had
  // how'd -> did
  // he'd go -> would

  const alwaysDid = new Set([
    'what',
    'how',
    'when',
    'where',
    'why',
  ]);

  // after-words
  const useWould = new Set([
    'be',
    'go',
    'start',
    'think',
    'need',
  ]);

  const useHad = new Set([
    'been',
    'gone'
  ]);
  // they'd gone
  // they'd go


  // he'd been
  //    he had been
  //    he would been

  const _apostropheD = function (terms, i) {
    const before = terms[i].normal.split(hasContraction$1)[0];

    // what'd, how'd
    if (alwaysDid.has(before)) {
      return [before, 'did']
    }
    if (terms[i + 1]) {
      // they'd gone
      if (useHad.has(terms[i + 1].normal)) {
        return [before, 'had']
      }
      // they'd go
      if (useWould.has(terms[i + 1].normal)) {
        return [before, 'would']
      }
    }
    return null
    //   if (hasPastTense(terms, i) === true) {
    //     return [before, 'had']
    //   }
    //   // had/would/did
    //   return [before, 'would']
  };

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    const before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  const hasContraction = /'/;
  const isFeminine = /(e|é|aison|sion|tion)$/;
  const isMasculine = /(age|isme|acle|ege|oire)$/;
  // l'amour
  const preL = (terms, i) => {
    // le/la
    const after = terms[i].normal.split(hasContraction)[1];
    // quick french gender disambig (rough)
    if (after && after.endsWith('e')) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    const after = terms[i].normal.split(hasContraction)[1];
    // quick guess for noun-agreement (rough)
    if (after && isFeminine.test(after) && !isMasculine.test(after)) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => {
    const after = terms[i].normal.split(hasContraction)[1];
    return ['je', after]
  };

  var french = {
    preJ,
    preL,
    preD,
  };

  const isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
  const phoneNum = /^[0-9]{3}-[0-9]{4}$/;

  const numberRange = function (terms, i) {
    const term = terms[i];
    let parts = term.text.match(isRange);
    if (parts !== null) {
      // 123-1234 is a phone number, not a number-range
      if (term.tags.has('PhoneNumber') === true || phoneNum.test(term.text)) {
        return null
      }
      return [parts[1], 'to', parts[2]]
    } else {
      parts = term.text.match(timeRange);
      if (parts !== null) {
        return [parts[1], 'to', parts[4]]
      }
    }
    return null
  };

  const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/; //(must be lowercase)

  const numberUnit = function (terms, i, world) {
    const notUnit = world.model.one.numberSuffixes || {};
    const term = terms[i];
    const parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      const unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (Object.hasOwn(notUnit, unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view, start, len) {
    const tmp = view.update();
    tmp.document = [terms];
    // offer to re-tag neighbours, too
    let end = start + len;
    if (start > 0) {
      start -= 1;
    }
    if (terms[end]) {
      end += 1;
    }
    tmp.ptrs = [[0, start, end]];
  };

  const byEnd = {
    // ain't
    t: (terms, i) => apostropheT(terms, i),
    // how'd
    d: (terms, i) => _apostropheD(terms, i),
  };

  const byStart = {
    // j'aime
    j: (terms, i) => french.preJ(terms, i),
    // l'amour
    l: (terms, i) => french.preL(terms, i),
    // d'amerique
    d: (terms, i) => french.preD(terms, i),
  };

  // pull-apart known contractions from model
  const knownOnes = function (list, term, before, after) {
    for (let i = 0; i < list.length; i += 1) {
      const o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before && after && after.length > 2) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  const toDocs = function (words, view, term) {
    contractionDebug(term, words);
    const doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    return doc.docs[0]
  };

  // there's is usually [there, is]
  // but can be 'there has' for 'there has (..) been'
  const thereHas = function (terms, i) {
    for (let k = i + 1; k < 5; k += 1) {
      if (!terms[k]) {
        break
      }
      if (terms[k].normal === 'been') {
        return ['there', 'has']
      }
    }
    return ['there', 'is']
  };

  //really easy ones
  const contractions$1 = view => {
    const { world, document } = view;
    const { model, methods } = world;
    const list = model.one.contractions || [];
    // let units = new Set(model.one.units || [])
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          const res = terms[i].normal.split(byApostrophe);
          before = res[0];
          after = res[1];
        }
        // any known-ones, like 'dunno'?
        let words = knownOnes(list, terms[i], before, after);
        // ['foo', 's']
        if (!words && Object.hasOwn(byEnd, after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && Object.hasOwn(byStart, before)) {
          words = byStart[before](terms, i);
        }
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view, terms[i]);
          insertContraction(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = toDocs(words, view, terms[i]);
            insertContraction(document, [n, i], words);
            methods.one.setTag(words, 'NumberRange', world); //add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit(terms, i, world);
        if (words) {
          words = toDocs(words, view, terms[i]);
          insertContraction(document, [n, i], words);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
    });
  };

  var compute$4 = { contractions: contractions$1 };

  const plugin = {
    model: model$5,
    compute: compute$4,
    hooks: ['contractions'],
  };

  const freeze$1 = function (view) {
    const world = view.world;
    const { model, methods } = view.world;
    const setTag = methods.one.setTag;
    const { frozenLex } = model.one;
    const multi = model.one._multiCache || {};

    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        // basic lexicon lookup
        const t = terms[i];
        const word = t.machine || t.normal;

        // test a multi-word
        if (multi[word] !== undefined && terms[i + 1]) {
          const end = i + multi[word] - 1;
          for (let k = end; k > i; k -= 1) {
            const words = terms.slice(i, k + 1);
            const str = words.map(term => term.machine || term.normal).join(' ');
            // lookup frozen lexicon
            if (Object.hasOwn(frozenLex, str) === true) {
              setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
              words.forEach(term => (term.frozen = true));
              continue
            }
          }
        }
        // test single word
        if (frozenLex[word] !== undefined && Object.hasOwn(frozenLex, word)) {
          setTag([t], frozenLex[word], world, false, '1-freeze-lexicon');
          t.frozen = true;
          continue
        }
      }
    });
  };

  const unfreeze = function (view) {
    view.docs.forEach(ts => {
      ts.forEach(term => {
        delete term.frozen;
      });
    });
    return view
  };
  var compute$3 = { frozen: freeze$1, freeze: freeze$1, unfreeze };

  /* eslint-disable no-console */

  const debug$2 = function (view) {
    view.docs.forEach(terms => {
      console.log(blue('\n  ╭─────────'));
      terms.forEach(t => {
        let str = `  ${i$1(dim('│'))}  `;
        const txt = t.implicit || t.text || '-';
        if (t.frozen === true) {
          str += `${blue(txt)} ❄️`;
        } else {
          str += i$1(dim(txt));
        }
        console.log(str);
      });
    });
  };

  var freeze = {
    // add .compute('freeze')
    compute: compute$3,

    mutate: world => {
      const methods = world.methods.one;
      // add @isFrozen method
      methods.termMethods.isFrozen = term => term.frozen === true;
      // adds `.debug('frozen')`
      methods.debug.freeze = debug$2;
      methods.debug.frozen = debug$2;
    },

    api: function (View) {
      // set all terms to reject any desctructive tags
      View.prototype.freeze = function () {
        this.docs.forEach(ts => {
          ts.forEach(term => {
            term.frozen = true;
          });
        });
        return this
      };
      // reset all terms to allow  any desctructive tags
      View.prototype.unfreeze = function () {
        this.compute('unfreeze');
      };
      // return all frozen terms
      View.prototype.isFrozen = function () {
        return this.match('@isFrozen+')
      };
    },
    // run it in init
    hooks: ['freeze'],
  };

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const multiWord = function (terms, start_i, world) {
    const { model, methods } = world;
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const { lexicon } = model.one || {};
    const t = terms[start_i];
    const word = t.machine || t.normal;

    // found a word to scan-ahead on
    if (multi[word] !== undefined && terms[start_i + 1]) {
      const end = start_i + multi[word] - 1;
      for (let i = end; i > start_i; i -= 1) {
        const words = terms.slice(start_i, i + 1);
        if (words.length <= 1) {
          return false
        }
        const str = words.map(term => term.machine || term.normal).join(' ');
        // lookup regular lexicon
        if (Object.hasOwn(lexicon, str) === true) {
          const tag = lexicon[str];
          // 'is off-white' is not the phrasal verb 'is off'.
          if (tag && tag.includes('PhrasalVerb') && words[words.length - 1].post === '-') {
            continue
          }
          setTag(words, tag, world, false, '1-multi-lexicon');
          // special case for phrasal-verbs - 2nd word is a #Particle
          if (tag && tag.length === 2 && (tag[0] === 'PhrasalVerb' || tag[1] === 'PhrasalVerb')) {
            setTag([words[1]], 'Particle', world, false, '1-phrasal-particle');
          }
          return true
        }
      }
      return false
    }
    return null
  };

  const prefix$1 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const { lexicon } = model.one;

    // basic lexicon lookup
    const t = terms[i];
    const word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && Object.hasOwn(lexicon, word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // '#gojetsgo' can be in the lexicon with its hash
    if (t.machine && Object.hasOwn(lexicon, t.normal)) {
      setTag([t], lexicon[t.normal], world, false, '1-lexicon-normal');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      const found = t.alias.find(str => Object.hasOwn(lexicon, str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$1.test(word) === true) {
      const stem = word.replace(prefix$1, '');
      if (Object.hasOwn(lexicon, stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
          return true
        }
      }
    }
    return null
  };

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const lexicon$4 = function (view) {
    const world = view.world;
    // loop through our terms
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found ||= multiWord(terms, i, world);
          // lookup known words
          found ||= checkLexicon(terms, i, world);
        }
      }
    });
  };

  var compute$2 = {
    lexicon: lexicon$4,
  };

  // derive clever things from our lexicon key-value pairs
  const expand = function (words) {
    // const { methods, model } = world
    const lex = {};
    // console.log('start:', Object.keys(lex).length)
    const _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      const tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
      // cache multi-word terms
      const split = word.split(/ /);
      if (split.length > 1) {
        // prefer longer ones
        if (_multi[split[0]] === undefined || split.length > _multi[split[0]]) {
          _multi[split[0]] = split.length;
        }
      }
      lex[word] ||= tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };

  var methods$g = {
    one: {
      expandLexicon: expand,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords$1 = function (words, isFrozen = false) {
    const world = this.world();
    const { methods, model } = world;
    if (!words) {
      return
    }
    // normalize tag vals
    Object.keys(words).forEach(k => {
      if (typeof words[k] === 'string' && words[k].startsWith('#')) {
        words[k] = words[k].replace(/^#/, '');
      }
    });
    // these words go into a seperate lexicon
    if (isFrozen === true) {
      const { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one._multiCache, _multi);
      Object.assign(model.one.frozenLex, lex);
      return
    }
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      const { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    }
    // do basic ./one version
    const { lex, _multi } = methods.one.expandLexicon(words, world);
    Object.assign(model.one.lexicon, lex);
    Object.assign(model.one._multiCache, _multi);
  };

  var lib$5 = { addWords: addWords$1 };

  const model$4 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
      frozenLex: {}, //2nd lexicon
    },
  };

  var lexicon$3 = {
    model: model$4,
    methods: methods$g,
    compute: compute$2,
    lib: lib$5,
    hooks: ['lexicon'],
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$1 = function (phrase, world) {
    const { methods, model } = world;
    const terms = methods.one.tokenize.splitTerms(phrase, model).map(t => methods.one.tokenize.splitWhitespace(t, model));
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    const goNext = [{}];
    const endAs = [null];
    const failTo = [0];

    const xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      const words = tokenize$1(phrase, world);
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (goNext[curr] && Object.hasOwn(goNext[curr], word)) {
          curr = goNext[curr][word];
        } else {
          n++;
          goNext[curr][word] = n;
          goNext[n] = {};
          curr = n;
          endAs[n] = null;
        }
      }
      endAs[curr] = [words.length];
    });
    // f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
    for (const word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length > 0) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      const keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        const word = keys[i];
        const s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !Object.hasOwn(goNext[n], word)) {
          n = failTo[n];
        }
        if (Object.hasOwn(goNext, n)) {
          const fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] ||= [];
            endAs[s] = endAs[s].concat(endAs[fs]);
          }
        } else {
          failTo[s] = 0;
        }
      }
    }
    return { goNext, endAs, failTo }
  };

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    const results = [];
    for (let i = 0; i < terms.length; i++) {
      const word = terms[i][opts.form] || terms[i].normal;
      // main match-logic loop:
      while (n > 0 && (trie.goNext[n] === undefined || !Object.hasOwn(trie.goNext[n], word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!Object.hasOwn(trie.goNext[n], word)) {
        continue
      }
      n = trie.goNext[n][word];
      if (trie.endAs[n]) {
        const arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          const len = arr[o];
          const term = terms[i - len + 1];
          const [no, start] = term.index;
          results.push([no, start, start + len, term.id]);
        }
      }
    }
    return results
  };

  const cacheMiss = function (words, cache) {
    for (let i = 0; i < words.length; i += 1) {
      if (cache.has(words[i]) === true) {
        return false
      }
    }
    return true
  };

  const scan = function (view, trie, opts) {
    let results = [];
    opts.form ||= 'normal';
    const docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    const firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      const terms = docs[i];
      const found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$6 (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      const trie = isObject$4(input) ? input : buildTrie(input, this.world);
      let res = scan(this, trie, opts);
      res = res.settle();
      return res
    };
  }

  // chop-off tail of redundant vals at end of array
  const truncate = (list, val) => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] !== val) {
        list = list.slice(0, i + 1);
        return list
      }
    }
    return list
  };

  // prune trie a bit
  const compress = function (trie) {
    trie.goNext = trie.goNext.map(o => {
      if (Object.keys(o).length === 0) {
        return undefined
      }
      return o
    });
    // chop-off tail of undefined vals in goNext array
    trie.goNext = truncate(trie.goNext, undefined);
    // chop-off tail of zeros in failTo array
    trie.failTo = truncate(trie.failTo, 0);
    // chop-off tail of nulls in endAs array
    trie.endAs = truncate(trie.endAs, null);
    return trie
  };

  /** pre-compile a list of matches to lookup */
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    buildTrie: function (input) {
      const trie = buildTrie(input, this.world());
      return compress(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup = {
    api: api$6,
    lib: lib$4
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      const n = ptr[0];
      if (parent[n]) {
        ptr[0] = parent[n][0]; //n
        ptr[1] += parent[n][1]; //start
        ptr[2] += parent[n][1]; //end
      }
    });
    return ptrs
  };

  // make match-result relative to whole document
  const fixPointers = function (res, parent) {
    let { ptrs } = res;
    const { byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  // turn any matchable input intp a list of matches
  const parseRegs = function (regs, opts, world) {
    const one = world.methods.one;
    if (typeof regs === 'number') {
      regs = String(regs);
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, world);
      regs = one.parseMatch(regs, opts, world);
    }
    return regs
  };

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$3(val) && val.isView === true;

  const isNet = val => val && isObject$3(val) && val.isNet === true;

  const match$1 = function (regs, group, opts) {
    const one = this.methods.one;
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.settle()
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group };
    const res = one.match(this.docs, todo, this._cache);
    const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    const view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const matchOne = function (regs, group, opts) {
    const one = this.methods.one;
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const res = one.match(this.docs, todo, this._cache);
    const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    const view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      const ptrs = this.intersection(regs).fullPointer;
      return ptrs.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.found
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const ptrs = one.match(this.docs, todo, this._cache).ptrs;
    return ptrs.length > 0
  };

  // 'if'
  const ifFn = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      const m = this.sweep(regs, { tagger: false }).view.settle();
      return this.if(m) //recurse with result
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    let ptrs = this.fullPointer;
    const cache = this._cache || [];
    ptrs = ptrs.filter((ptr, i) => {
      const m = this.update([ptr]);
      const res = one.match(m.docs, todo, cache[i]).ptrs;
      return res.length > 0
    });
    const view = this.update(ptrs);
    // try and reconstruct the cache
    if (this._cache) {
      view._cache = ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  const ifNo = function (regs, group, opts) {
    const { methods } = this;
    const one = methods.one;
    // support a view object as input
    if (isView(regs)) {
      return this.filter(m => !m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      const m = this.sweep(regs, { tagger: false }).view.settle();
      return this.ifNo(m)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    const cache = this._cache || [];
    const view = this.filter((m, i) => {
      const todo = { regs, group, justOne: true };
      const ptrs = one.match(m.docs, todo, cache[i]).ptrs;
      return ptrs.length === 0
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$2 = { matchOne, match: match$1, has, if: ifFn, ifNo };

  const before = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    const pre = [];
    const byN = indexN(this.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest match in the sentence
      const first = byN[k].sort((a, b) => (a[1] > b[1] ? 1 : -1))[0];
      if (first[1] > 0) {
        pre.push([first[0], 0, first[1]]);
      }
    });
    const preWords = this.toView(pre);
    if (!regs) {
      return preWords
    }
    return preWords.match(regs, group, opts)
  };

  const after = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    const post = [];
    const byN = indexN(this.fullPointer);
    const document = this.document;
    Object.keys(byN).forEach(k => {
      // check only the latest match in the sentence
      const last = byN[k].sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
      const [n, , end] = last;
      if (end < document[n].length) {
        post.push([n, end, document[n].length]);
      }
    });
    const postWords = this.toView(post);
    if (!regs) {
      return postWords
    }
    return postWords.match(regs, group, opts)
  };

  const growLeft = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[regs.length - 1].end = true; // ensure matches are beside us ←
    const ptrs = this.fullPointer;
    this.forEach((m, n) => {
      const more = m.before(regs, group);
      if (more.found) {
        const terms = more.terms();
        ptrs[n][1] -= terms.length;
        ptrs[n][3] = terms.docs[0][0].id;
      }
    });
    return this.update(ptrs)
  };

  const growRight = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[0].start = true; // ensure matches are beside us →
    const ptrs = this.fullPointer;
    this.forEach((m, n) => {
      const more = m.after(regs, group);
      if (more.found) {
        const terms = more.terms();
        ptrs[n][2] += terms.length;
        ptrs[n][4] = null; //remove end-id
      }
    });
    return this.update(ptrs)
  };

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround = { before, after, growLeft, growRight, grow };

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const getDoc$2 = (reg, view, group) => {
    if (typeof reg === 'string' || Array.isArray(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    const [n, start, end] = ptr;
    if (view.document[n]?.[start]) {
      ptr[3] ||= view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] ||= view.document[n][end - 1].id;
      }
    }
    return ptr
  };

  const methods$f = {};
  // [before], [match], [after]
  methods$f.splitOn = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      res.push(o.match);
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before], [match after]
  methods$f.splitBefore = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    // repair matches to favor [match, after]
    // - instead of [before, match]
    for (let i = 0; i < all.length; i += 1) {
      // move a before to a preceding after
      if (!all[i].after && all[i + 1]?.before) {
        // ensure it's from the same original sentence
        if (all[i].match && all[i].match[0] === all[i + 1].before[0]) {
          all[i].after = all[i + 1].before;
          delete all[i + 1].before;
        }
      }
    }

    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      // a, [x, b]
      if (o.match && o.after) {
        res.push(combine(o.match, o.after));
      } else {
        // a, [x], b
        res.push(o.match);
      }
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before match], [after]
  methods$f.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      if (o.before && o.match) {
        res.push(combine(o.before, o.match));
      } else {
        res.push(o.before);
        res.push(o.match);
      }
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };
  methods$f.split = methods$f.splitAfter;

  // check if two pointers are perfectly consecutive
  const isNeighbour = function (ptrL, ptrR) {
    // validate
    if (!ptrL || !ptrR) {
      return false
    }
    // same sentence
    if (ptrL[0] !== ptrR[0]) {
      return false
    }
    // ensure R starts where L ends
    return ptrL[2] === ptrR[1]
  };

  // join two neighbouring words, if they both match
  const mergeIf = function (doc, lMatch, rMatch) {
    const world = doc.world;
    const parseMatch = world.methods.one.parseMatch;
    lMatch ||= '.$'; //defaults
    rMatch ||= '^.';
    const leftMatch = parseMatch(lMatch, {}, world);
    const rightMatch = parseMatch(rMatch, {}, world);
    // ensure end-requirement to left-match, start-requiremnts to right match
    leftMatch[leftMatch.length - 1].end = true;
    rightMatch[0].start = true;
    // let's get going.
    const ptrs = doc.fullPointer;
    const res = [ptrs[0]];
    for (let i = 1; i < ptrs.length; i += 1) {
      const ptrL = res[res.length - 1];
      const ptrR = ptrs[i];
      const left = doc.update([ptrL]);
      const right = doc.update([ptrR]);
      // should we marge left+right?
      if (isNeighbour(ptrL, ptrR) && left.has(leftMatch) && right.has(rightMatch)) {
        // merge right ptr into existing result
        res[res.length - 1] = [ptrL[0], ptrL[1], ptrR[2], ptrL[3], ptrR[4]];
      } else {
        res.push(ptrR);
      }
    }
    // return new pointers
    return doc.update(res)
  };

  const methods$e = {
    //  merge only if conditions are met
    joinIf: function (lMatch, rMatch) {
      return mergeIf(this, lMatch, rMatch)
    },
    // merge all neighbouring matches
    join: function () {
      return mergeIf(this)
    },
  };

  const methods$d = { ...match$2, ...lookaround, ...methods$f, ...methods$e };
  // aliases
  methods$d.lookBehind = methods$d.before;
  methods$d.lookBefore = methods$d.before;

  methods$d.lookAhead = methods$d.after;
  methods$d.lookAfter = methods$d.after;

  methods$d.notIf = methods$d.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$d);
  };

  // Split parenthesized match blocks without retrying long rejected prefixes or
  // bodies. Preserve the original grammar, including its greedy capture header.
  const prefix = new Set('!~[^');
  const suffix = new Set('?]+*$~');
  const whitespace$1 = /\s/;

  const splitGroups = str => {
    if (!str.includes('(') || !str.includes(')')) return [str]
    const length = str.length;
    const afterSuffix = new Uint32Array(length + 1);
    const bodyEnd = new Uint32Array(length);
    const captureEnd = new Uint32Array(length);
    afterSuffix[length] = length;
    let close = -1;
    let capture = 0;
    for (let i = length - 1; i >= 0; i--) {
      afterSuffix[i] = suffix.has(str[i]) ? afterSuffix[i + 1] : i;
      if (str[i] === ')') close = i;
      if (str[i] === '(' && close >= i + 3 && str[close - 1] !== '\\') {
        const end = afterSuffix[close + 1];
        if (end === length || whitespace$1.test(str[end])) bodyEnd[i] = end;
      }
      // The optional <...> header cannot cross another '<', and prefers the
      // rightmost '>' which is followed by a valid parenthesized block.
      if (str[i] === '<') {
        captureEnd[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture && bodyEnd[i + 1]) {
        capture = bodyEnd[i + 1];
      }
    }
    const parts = [];
    let previous = 0;
    let i = 0;
    while (i < length) {
      const start = i;
      while (i < length && prefix.has(str[i])) i++;
      const end = str[i] === '<' ? captureEnd[i] : bodyEnd[i];
      if (end) {
        parts.push(str.slice(previous, start), str.slice(start, end));
        // The old delimiter consumes one following whitespace character.
        i = end < length ? end + 1 : end;
        previous = i;
      } else if (i === start) {
        i++;
      }
    }
    parts.push(str.slice(previous));
    return parts
  };

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
  // okay
  const byWord = / /g;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?\(/.test(str) && /\)[?\]+*$~]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };

  const cleanUp = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt) {
    // parse by /regex/ first
    const arr = txt.split(bySlashes);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isReg(str)) {
        res.push(str);
        return
      }
      res = res.concat(splitGroups(str));
    });
    res = cleanUp(res);
    // split by spaces, now
    let final = [];
    res.forEach(str => {
      if (isBlock(str)) {
        final.push(str);
      } else if (isReg(str)) {
        final.push(str);
      } else {
        final = final.concat(str.split(byWord));
      }
    });
    final = cleanUp(final);
    return final
  };

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-–—]\p{Letter}/u
  const captureName = /^<\s*([^\s>]+)\s*>/;
  /* break-down a match expression into this:
  {
    word:'',
    tag:'',
    regex:'',

    start:false,
    end:false,
    negative:false,
    anything:false,
    greedy:false,
    optional:false,

    named:'',
    choices:[],
  }
  */
  const titleCase$1 = str => str.charAt(0).toUpperCase() + str.substring(1);
  const end = (str) => str.charAt(str.length - 1);
  const start = (str) => str.charAt(0);
  const stripStart = (str) => str.substring(1);
  const stripEnd = (str) => str.substring(0, str.length - 1);

  const stripBoth = function (str) {
    str = stripStart(str);
    str = stripEnd(str);
    return str
  };
  //
  const parseToken = function (w, opts, aliases) {
    const obj = {};
    //collect any flags (do it twice)
    for (let i = 0; i < 2; i += 1) {
      //end-flag
      if (end(w) === '$') {
        obj.end = true;
        w = stripEnd(w);
      }
      //front-flag
      if (start(w) === '^') {
        obj.start = true;
        w = stripStart(w);
      }
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
      }
      //capture group (this one can span multiple-terms)
      if (start(w) === '[' || end(w) === ']') {
        obj.group = null;
        if (start(w) === '[') {
          obj.groupStart = true;
        }
        if (end(w) === ']') {
          obj.groupEnd = true;
        }
        w = w.replace(/^\[/, '');
        w = w.replace(/\]$/, '');
        // Use capture group name
        if (start(w) === '<') {
          const res = captureName.exec(w);
          if (!res) {
            throw new SyntaxError('Invalid named capture: expected [<name> ...]')
          }
          if (res.length >= 2) {
            obj.group = res[1];
            w = w.replace(res[0], '');
          }
        }
      }
      //back-flags
      if (end(w) === '+') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (w !== '*' && end(w) === '*' && w !== '\\*') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (start(w) === '~' && end(w) === '~' && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy ?? 0.85;
        if (/\(/.test(w) === false) {
          obj.word = w;
          return obj
        }
      }

      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      // support foo{1,9}
      if (hasMinMax.test(w) === true) {
        w = w.replace(hasMinMax, (_a, b, c) => {
          if (c === undefined) {
            // '{3}'	Exactly three times
            obj.min = Number(b);
            obj.max = Number(b);
          } else {
            c = c.replace(/, */, '');
            if (b === undefined) {
              // '{,9}' implied zero min
              obj.min = 0;
              obj.max = Number(c);
            } else {
              // '{2,4}' Two to four times
              obj.min = Number(b);
              // '{3,}' Three or more times
              obj.max = Number(c || 999);
            }
          }
          // use same method as '+'
          obj.greedy = true;
          // 0 as min means the same as '?'
          if (!obj.min) {
            obj.optional = true;
          }
          return ''
        });
      }

      //wrapped-flags
      if (start(w) === '(' && end(w) === ')') {
        // support (one && two)
        if (andSign.test(w)) {
          obj.choices = w.split(andSign);
          obj.operator = 'and';
        } else {
          obj.choices = w.split('|');
          obj.operator = 'or';
        }
        //remove '(' and ')'
        obj.choices[0] = stripStart(obj.choices[0]);
        const last = obj.choices.length - 1;
        obj.choices[last] = stripEnd(obj.choices[last]);
        // clean up the results
        obj.choices = obj.choices.map(s => s.trim());
        obj.choices = obj.choices.filter(s => s);
        //recursion alert!
        obj.choices = obj.choices.map(str => {
          return str.split(/ /g).map(s => parseToken(s, opts, aliases))
        });
        w = '';
      }

      //root/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        // obj.sense = w
        obj.root = w;
        if (/\//.test(w)) {
          const split = obj.root.split(/\//);
          obj.root = split[0];
          obj.pos = split[1];
          if (obj.pos === 'adj') {
            obj.pos = 'Adjective';
          }
          // titlecase
          obj.pos = obj.pos.charAt(0).toUpperCase() + obj.pos.substr(1).toLowerCase();
          // add sense-number too
          if (split[2] !== undefined) {
            obj.sense = split[2];
          }
        }
        return obj
      }
      //chunks
      if (start(w) === '<' && end(w) === '>') {
        w = stripBoth(w);
        obj.chunk = titleCase$1(w);
        obj.greedy = true;
        return obj
      }
      if (start(w) === '%' && end(w) === '%') {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    //do the actual token content
    if (start(w) === '#') {
      const name = stripStart(w);
      obj.tag = aliases?.[name];
      if (!obj.tag) {
        obj.tag = titleCase$1(name);
        obj.tag = aliases?.[obj.tag] || obj.tag;
      }
      return obj
    }
    //dynamic function on a term object
    if (start(w) === '@') {
      obj.method = stripStart(w);
      return obj
    }
    if (w === '.') {
      obj.anything = true;
      return obj
    }
    //support alone-astrix
    if (w === '*') {
      obj.anything = true;
      obj.greedy = true;
      obj.optional = true;
      return obj
    }
    if (w) {
      //somehow handle encoded-chars?
      w = w.replace('\\*', '*');
      w = w.replace('\\.', '.');
      if (opts.caseSensitive) {
        obj.use = 'text';
      } else {
        w = w.toLowerCase();
      }
      obj.word = w;
    }
    return obj
  };

  // Text recognition, rather than full email/URL validation. Share these rules with
  // the tagger so hyphens in recognized addresses survive tokenization.
  const email = /^[\w.!#$%&'*+/=?^`{|}~-]+@(?:[\w-]+\.)+[a-z]{2,}$/i;
  const explicitUrl = /^(?:https?:(?:\/\/)?|www\.)(?:[a-z0-9-]+\.)+[a-z]{2,}(?::[0-9]+)?(?:[/?#]\S*)?$/i;
  const bareUrl = /^(?:[a-z0-9-]+\.)+(?:com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)(?::[0-9]+)?(?:[/?#]\S*)?$/i;

  const isWebToken = function (str) {
    if (!str.includes('.')) {
      return false
    }
    let start = 0;
    let end = str.length;
    while (start < end && /[\s("'“‘<]/.test(str[start])) start++;
    while (end > start && /[\s).,!?:;"'”’>]/.test(str[end - 1])) end--;
    const text = str.slice(start, end);
    return email.test(text) || explicitUrl.test(text) || bareUrl.test(text)
  };

  const hasHyphen$1 = function (str, model) {
    const parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    if (isWebToken(str)) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
    //dont split 're-do'
    if (Object.hasOwn(prefixes, parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (Object.hasOwn(suffixes, parts[1])) {
      return false
    }
    //letter-number 'aug-20'
    const reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str) === true) {
      return true
    }
    //number-letter '20-aug'
    const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
    if (reg2.test(str) === true) {
      return true
    }
    return false
  };

  const splitHyphens$1 = function (word) {
    const arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-–—]/);
    let whichDash = '-';
    const found = word.match(/[-–—]/);
    if (found && found[0]) {
      whichDash = found;
    }
    for (let o = 0; o < hyphens.length; o++) {
      if (o === hyphens.length - 1) {
        arr.push(hyphens[o]);
      } else {
        arr.push(hyphens[o] + whichDash);
      }
    }
    return arr
  };

  // match 're-do' -> ['re','do']
  // split them the same way the tokenizer does - 'x-ray' stays one word
  const splitHyphens = function (regs, world) {
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      const reg = regs[i];
      if (reg.word && hasHyphen$1(reg.word, world.model)) {
        let words = reg.word.split(/[-–—]/g);
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          const obj = { ...reg };
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };

  // add all conjugations of this verb
  const addVerbs = function (token, world) {
    const { all } = world.methods.two.transform.verb || {};
    const str = token.root;
    if (!all) {
      return []
    }
    return all(str, world.model)
  };

  // add all inflections of this noun
  const addNoun = function (token, world) {
    const { all } = world.methods.two.transform.noun || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // add all inflections of this adjective
  const addAdjective = function (token, world) {
    const { all } = world.methods.two.transform.adjective || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    regs = regs.map(token => {
      // a reg to convert '{foo}'
      if (token.root) {
        // check if compromise/two is loaded
        if (world.methods.two && world.methods.two.transform) {
          let choices = [];
          // have explicitly set from POS - '{sweet/adjective}'
          if (token.pos) {
            if (token.pos === 'Verb') {
              choices = choices.concat(addVerbs(token, world));
            } else if (token.pos === 'Noun') {
              choices = choices.concat(addNoun(token, world));
            } else if (token.pos === 'Adjective') {
              choices = choices.concat(addAdjective(token, world));
            }
          } else {
            // do verb/noun/adj by default
            choices = choices.concat(addVerbs(token, world));
            choices = choices.concat(addNoun(token, world));
            choices = choices.concat(addAdjective(token, world));
          }
          choices = choices.filter(str => str);
          if (choices.length > 0) {
            token.operator = 'or';
            token.fastOr = new Set(choices);
          }
        } else {
          // if no compromise/two, drop down into 'machine' lookup
          token.machine = token.root;
          delete token.id;
          delete token.root;
        }
      }
      return token
    });

    return regs
  };

  // name any [unnamed] capture-groups with a number
  const nameGroups = function (regs) {
    let index = 0;
    let inGroup = null;
    //'fill in' capture groups between start-end
    for (let i = 0; i < regs.length; i++) {
      const token = regs[i];
      if (token.groupStart === true) {
        inGroup = token.group;
        if (inGroup === null) {
          inGroup = String(index);
          index += 1;
        }
      }
      if (inGroup !== null) {
        token.group = inGroup;
      }
      if (token.groupEnd === true) {
        inGroup = null;
      }
    }
    return regs
  };

  // optimize an 'or' lookup, when the (a|b|c) list is simple or multi-word
  const doFastOrMode = function (tokens) {
    return tokens.map(token => {
      if (token.choices !== undefined) {
        // make sure it's an OR
        if (token.operator !== 'or') {
          return token
        }
        if (token.fuzzy === true) {
          return token
        }
        // are they all straight-up words? then optimize them.
        const shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          const reg = block[0];
          // ~fuzzy~ words need more care
          if (reg.fuzzy === true) {
            return false
          }
          // ^ and $ get lost in fastOr
          if (reg.start || reg.end) {
            return false
          }
          if (reg.word !== undefined && reg.negative !== true && reg.optional !== true && reg.method !== true) {
            return true //reg is simple-enough
          }
          return false
        });
        if (shouldPack === true) {
          token.fastOr = new Set();
          token.choices.forEach(block => {
            token.fastOr.add(block[0].word);
          });
          delete token.choices;
        }
      }
      return token
    })
  };

  // support ~(a|b|c)~
  const fuzzyOr = function (regs) {
    return regs.map(reg => {
      if (reg.fuzzy && reg.choices) {
        // pass fuzzy-data to each OR choice
        reg.choices.forEach(r => {
          if (r.length === 1 && r[0].word) {
            r[0].fuzzy = true;
            r[0].min = reg.min;
          }
        });
      }
      return reg
    })
  };

  const postProcess = function (regs) {
    // ensure all capture groups names are filled between start and end
    regs = nameGroups(regs);
    // convert 'choices' format to 'fastOr' format
    regs = doFastOrMode(regs);
    // support ~(foo|bar)~
    regs = fuzzyOr(regs);
    return regs
  };

  /** parse a match-syntax string into json */
  const syntax = function (input, opts, world) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return []
    }
    opts ||= {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken(str, opts, world.model.one.tagAliases));
    // '~re-do~'
    tokens = splitHyphens(tokens, world);
    // '{walk}'
    tokens = inflectRoot(tokens, world);
    //clean up anything weird
    tokens = postProcess(tokens);
    // console.log(tokens)
    return tokens
  };

  const anyIntersection = function (setA, setB) {
    for (const elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      const reg = regs[i];
      if (reg.optional === true || reg.negative === true || reg.fuzzy === true) {
        continue
      }
      // is the word missing from the cache?
      if (reg.word !== undefined && cache.has(reg.word) === false) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && cache.has('#' + reg.tag) === false) {
        return true
      }
      // are all of the fast-or words missing?
      if (reg.fastOr !== undefined && anyIntersection(reg.fastOr, cache) === false) {
        return true
      }
    }
    return false
  };

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    const aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    const limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    const matrix = [];
    for (let i = 0; i < limit; i++) {
      matrix[i] = [i];
      matrix[i].length = limit;
    }
    for (let i = 0; i < limit; i++) {
      matrix[0][i] = i;
    }
    // Calculate matrix.
    let j, a_index, b_index, cost, min, t;
    for (let i = 1; i <= aLength; ++i) {
      a_index = strA[i - 1];
      for (j = 1; j <= bLength; ++j) {
        // Check the jagged distance total so far
        if (i === j && matrix[i][j] > 4) {
          return aLength
        }
        b_index = strB[j - 1];
        cost = a_index === b_index ? 0 : 1; // Step 5
        // Calculate the minimum (much faster than Math.min(...)).
        min = matrix[i - 1][j] + 1; // Deletion.
        if ((t = matrix[i][j - 1] + 1) < min) min = t; // Insertion.
        if ((t = matrix[i - 1][j - 1] + cost) < min) min = t; // Substitution.
        // Update matrix.
        const shouldUpdate =
          i > 1 && j > 1 && a_index === strB[j - 2] && strA[i - 2] === b_index && (t = matrix[i - 2][j - 2] + cost) < min;
        if (shouldUpdate) {
          matrix[i][j] = t;
        } else {
          matrix[i][j] = min;
        }
      }
    }
    // return number of steps
    return matrix[aLength][bLength]
  };
  // score similarity by from 0-1 (steps/length)
  const fuzzyMatch = function (strA, strB, minLength = 3) {
    if (strA === strB) {
      return 1
    }
    //don't even bother on tiny strings
    if (strA.length < minLength || strB.length < minLength) {
      return 0
    }
    const steps = editDistance(strA, strB);
    const length = Math.max(strA.length, strB.length);
    const relative = length === 0 ? 0 : steps / length;
    const similarity = 1 - relative;
    return similarity
  };

  // these methods are called with '@hasComma' in the match syntax
  // various unicode quotation-mark formats
  const startQuote =
    /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;

  const endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;

  const hasHyphen = /^[-–—]$/;
  const hasDash$1 = / [-–—]{1,3} /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  // const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1

  const methods$c = {
    /** does it have a quotation symbol?  */
    hasQuote: term => startQuote.test(term.pre) || endQuote.test(term.post),
    /** does it have a comma?  */
    hasComma: term => hasPost(term, ','),
    /** does it end in a period? */
    hasPeriod: term => hasPost(term, '.') === true && hasPost(term, '...') === false,
    /** does it end in an exclamation */
    hasExclamation: term => hasPost(term, '!'),
    /** does it end with a question mark? */
    hasQuestionMark: term => hasPost(term, '?') || hasPost(term, '¿'),
    /** is there a ... at the end? */
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '…'),
    /** is there a semicolon after term word? */
    hasSemicolon: term => hasPost(term, ';'),
    /** is there a colon after term word? */
    hasColon: term => hasPost(term, ':'),
    /** is there a slash '/' in term word? */
    hasSlash: term => /\//.test(term.text),
    /** a hyphen connects two words like-term */
    hasHyphen: term => hasHyphen.test(term.post) || hasHyphen.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash$1.test(term.post) || hasDash$1.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase */
    isTitleCase: term => /^\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
    /** uppercase all letters */
    isUpperCase: term => /^\p{Lu}+$/u.test(term.text),
  };
  // aliases
  methods$c.hasQuotation = methods$c.hasQuote;

  //declare it up here
  let wrapMatch = function () { };
  /** ignore optional/greedy logic, straight-up term match*/
  const doesMatch$1 = function (term, reg, index, length) {
    // support '.'
    if (reg.anything === true) {
      return true
    }
    // support '^' (in parentheses)
    if (reg.start === true && index !== 0) {
      return false
    }
    // support '$' (in parentheses)
    if (reg.end === true && index !== length - 1) {
      return false
    }
    // match an id
    if (reg.id !== undefined && reg.id === term.id) {
      return true
    }
    //support a text match
    if (reg.word !== undefined) {
      // check case-sensitivity, etc
      if (reg.use) {
        return reg.word === term[reg.use]
      }
      //match contractions, machine-form
      if (term.machine !== null && term.machine === reg.word) {
        return true
      }
      // support ~ fuzzy match
      if (reg.fuzzy === true) {
        if (reg.word === term.root) {
          return true
        }
        const score = fuzzyMatch(reg.word, term.normal);
        if (score >= reg.min) {
          return true
        }
      }
      // match slashes and things
      if (term.alias && term.alias.some(str => str === reg.word)) {
        return true
      }
      //match either .normal or .text
      return reg.word === term.text || reg.word === term.normal
    }
    //support #Tag
    if (reg.tag !== undefined) {
      return term.tags.has(reg.tag) === true
    }
    //support @method
    if (reg.method !== undefined) {
      if (typeof methods$c[reg.method] === 'function' && methods$c[reg.method](term) === true) {
        return true
      }
      return false
    }
    //support whitespace/punctuation
    if (reg.pre !== undefined) {
      return term.pre && term.pre.includes(reg.pre)
    }
    if (reg.post !== undefined) {
      return term.post && term.post.includes(reg.post)
    }
    //support /reg/
    if (reg.regex !== undefined) {
      let str = term.normal;
      if (reg.use) {
        str = term[reg.use];
      }
      if (reg.regex.global || reg.regex.sticky) {
        const lastIndex = reg.regex.lastIndex;
        try {
          reg.regex.lastIndex = 0;
          return reg.regex.test(str)
        } finally {
          reg.regex.lastIndex = lastIndex;
        }
      }
      return reg.regex.test(str)
    }
    //support <chunk>
    if (reg.chunk !== undefined) {
      return term.chunk === reg.chunk
    }
    //support %Noun|Verb%
    if (reg.switch !== undefined) {
      return term.switch === reg.switch
    }
    //support {machine}
    if (reg.machine !== undefined) {
      return term.normal === reg.machine || term.machine === reg.machine || term.root === reg.machine
    }
    //support {word/sense}
    if (reg.sense !== undefined) {
      return term.sense === reg.sense
    }
    // support optimized (one|two)
    if (reg.fastOr !== undefined) {
      // {work/verb} must be a verb
      if (reg.pos && !term.tags.has(reg.pos)) {
        return null
      }
      const str = term.root || term.implicit || term.machine || term.normal;
      return reg.fastOr.has(str) || reg.fastOr.has(term.text)
    }
    //support slower (one|two)
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r, index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r, index, length))
    }
    return false
  };
  // wrap result for !negative match logic
  wrapMatch = function (t, reg, index, length) {
    const result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    const reg = { ...state.regs[state.r], start: false, end: false };
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      // the number of terms we've matched, if we stop here
      const count = state.t - start + 1;
      //stop for next-reg match - unless we're still under our min
      if (endReg && wrapMatch(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        if (reg.min === undefined || count >= reg.min) {
          return state.t
        }
      }
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
    }
    // we ran out of terms - did we reach our min?
    if (reg.min !== undefined && state.t - start + 1 < reg.min) {
      return null
    }
    return state.t
  };

  const greedyTo = function (state, nextReg) {
    let t = state.t;
    //if there's no next one, just go off the end!
    if (!nextReg) {
      return state.terms.length
    }
    //otherwise, we're looking for the next one
    for (; t < state.terms.length; t += 1) {
      if (wrapMatch(state.terms[t], nextReg, state.start_i + t, state.phrase_length) === true) {
        // console.log(`greedyTo ${state.terms[t].normal}`)
        return t
      }
    }
    //guess it doesn't exist, then.
    return null
  };

  const isEndGreedy = function (reg, state) {
    if (reg.end === true && reg.greedy === true) {
      if (state.start_i + state.t < state.phrase_length - 1) {
        const tmpReg = { ...reg, end: false };
        if (wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$1 = function (state, term_index) {
    // Most attempts fail without capturing anything.
    if (!state.groups) {
      state.groups = {};
    }
    if (state.groups[state.inGroup]) {
      return state.groups[state.inGroup]
    }
    state.groups[state.inGroup] = {
      start: term_index,
      length: 0,
    };
    return state.groups[state.inGroup]
  };

  //support 'unspecific greedy' .* properly
  // its logic is 'greedy until', where it's looking for the next token
  // '.+ foo' means we check for 'foo', indefinetly
  const doAstrix = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipto = greedyTo(state, regs[state.r + 1]);
    //maybe we couldn't find it
    if (skipto === null || skipto === state.offset) {
      return null
    }
    // ensure it's long enough
    if (reg.min !== undefined && skipto - state.t < reg.min) {
      return null
    }
    // reduce it back, if it's too long
    if (reg.max !== undefined && skipto - state.t > reg.max) {
      state.t = state.t + reg.max;
      return true
    }
    // set the group result
    if (state.hasGroup === true) {
      const g = getGroup$1(state, state.t);
      // accumulate onto any tokens already captured before the wildcard,
      // so '[one .* after]' keeps its leading (and trailing) tokens
      g.length += skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };

  // try to match a list of tokens, starting at state.t + skipN
  // returns the number of terms it consumed, or 0 for no-match
  const tryChoice = function (state, regs, skipN) {
    let len = 0;
    for (let w = 0; w < regs.length; w += 1) {
      const cr = regs[w];
      const t = state.t + skipN + len;
      if (state.terms[t] === undefined) {
        return 0
      }
      if (wrapMatch(state.terms[t], cr, state.start_i + t, state.phrase_length) !== true) {
        return 0
      }
      len += 1;
      // this can be greedy - '(foo+ bar)'
      if (cr.greedy === true) {
        // like getGreedy, anchors should not apply to the repeated terms
        const gr = { ...cr, start: false, end: false };
        for (let i = t + 1; i < state.terms.length; i += 1) {
          if (wrapMatch(state.terms[i], gr, state.start_i + i, state.phrase_length) !== true) {
            break
          }
          len += 1;
        }
      }
    }
    return len
  };

  // match the first choice that works - '(a b|c)'
  const tryChoices = function (state, skipN) {
    const block = state.regs[state.r];
    for (let c = 0; c < block.choices.length; c += 1) {
      const regs = block.choices[c];
      if (!Array.isArray(regs)) {
        return 0
      }
      const len = tryChoice(state, regs, skipN);
      if (len > 0) {
        return len
      }
    }
    return 0
  };

  const doOrBlock = function (state) {
    const block = state.regs[state.r];
    let skipN = tryChoices(state, 0);
    if (skipN === 0) {
      return 0
    }
    // greedy or-block - keep matching choices - '(a b|c)+'
    if (block.greedy === true) {
      let more = tryChoices(state, skipN);
      while (more > 0) {
        skipN += more;
        more = tryChoices(state, skipN);
      }
    }
    return skipN
  };

  const doAndBlock = function (state) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    const reg = state.regs[state.r];
    const allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      const allWords = block.every((cr, w_index) => {
        const tryTerm = state.t + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return wrapMatch(state.terms[tryTerm], cr, state.start_i + tryTerm, state.phrase_length)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      // console.log(`doAndBlock ${state.terms[state.t].normal}`)
      return longest
    }
    return false
  };

  const orBlock = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const skipNum = doOrBlock(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-or|`)
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      // a '!(a b)?' can pass-through without consuming anything
      if (!reg.optional) {
        state.t += 1;
      }
      return true
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  // '(foo && #Noun)' - require all matches on the term
  const andBlock = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipNum = doAndBlock(state);
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-and|`)
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      // a '!(a && b)?' can pass-through without consuming anything
      if (!reg.optional) {
        state.t += 1;
      }
      return true
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = wrapMatch(state.terms[t], reg, state.start_i + t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = wrapMatch(state.terms[t], nextReg, state.start_i + t, state.phrase_length);
        if (found) {
          break
        }
      }
      skip += 1;
      // is it max-length now?
      if (reg.max !== undefined && skip === reg.max) {
        break
      }
    }
    if (skip === 0) {
      return false //dead
    }
    // did we satisfy min for !foo{min,max}
    if (reg.min && reg.min > skip) {
      return false//dead
    }
    state.t += skip;
    // state.r += 1
    return true
  };

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    // match *anything* but this term
    const tmpReg = { ...reg };
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    const found = wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (found) {
      return false//bye
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      const nextReg = regs[state.r + 1];
      if (nextReg) {
        const fNext = wrapMatch(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
        if (fNext) {
          state.r += 1;
        } else if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          const fNext2 = wrapMatch(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
          if (fNext2) {
            state.r += 2;
          }
        }
      }
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      return negGreedy(state, tmpReg, regs[state.r + 1])
    }
    state.t += 1;
    return true
  };

  // 'foo? foo' matches are tricky.
  const foundOptional = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const term = state.terms[state.t];
    // does the next reg match it too?
    const nextRegMatched = wrapMatch(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
    if (reg.negative || nextRegMatched) {
      // but does the next reg match the next term??
      // only skip if it doesn't
      const nextTerm = state.terms[state.t + 1];
      if (!nextTerm || !wrapMatch(nextTerm, regs[state.r + 1], state.start_i + state.t + 1, state.phrase_length)) {
        state.r += 1;
      }
    }
  };

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    const reg = regs[state.r];
    // foo{2,4} min-lengths are enforced inside getGreedy
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // 'foo+$' - if also an end-anchor, ensure we really reached the end
    if (reg.end === true && state.start_i + state.t !== phrase_length) {
      return null //greedy didn't reach the end
    }
    return true
  };

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    const term = state.terms[state.t];
    const reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      const nextTerm = state.terms[state.t + 1];
      // ensure next word is implicit
      if (!nextTerm.implicit) {
        return
      }
      // we matched "we've" - skip-over [we, have]
      if (reg.word === term.normal) {
        state.t += 1;
      }
      // also skip for @hasContraction
      if (reg.method === 'hasContraction') {
        state.t += 1;
      }
    }
  };

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    const reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$1(state, startAt);
    // Update group - add greedy or increment length
    if (state.t - state.offset > 1 && reg.greedy) {
      g.length += state.t - startAt;
    } else {
      g.length++;
    }
  };

  // when a reg matches a term
  const simpleMatch = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const term = state.terms[state.t];
    const startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // we should check the next reg too, to skip it?
    if (reg.optional && regs[state.r + 1]) {
      foundOptional(state);
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip(state);
    }
    //advance to the next term!
    state.t += 1;
    //check any ending '$' flags
    //if this isn't the last term, refuse the match
    if (reg.end === true && state.t !== state.terms.length && reg.greedy !== true) {
      return null //die
    }
    // keep 'foo+' going...
    if (reg.greedy === true) {
      const alive = greedyMatch(state);
      if (!alive) {
        return null
      }
    }
    // log '[foo]' as a group
    if (state.hasGroup === true) {
      setGroup(state, startAt);
    }
    return true
  };

  // i formally apologize for how complicated this is.

  /** 
   * try a sequence of match tokens ('regs') 
   * on a sequence of terms, 
   * starting at this certain term.
   */
  const tryHere = function (terms, regs, start_i, phrase_length, offset = 0) {
    // console.log(`\n\n:start: '${terms[0].text}':`)
    if (offset >= terms.length || regs.length === 0) {
      return null
    }
    // Use the original terms with a cursor instead of copying the remaining
    // sentence at every starting position. origin maps array indices to match
    // pointers; offset marks the beginning of this attempt within the array.
    const origin = start_i - offset;
    const state = {
      t: offset,
      offset: offset,
      terms: terms,
      r: 0,
      regs: regs,
      groups: null,
      start_i: origin,
      phrase_length: phrase_length,
      inGroup: null,
    };

    // we must satisfy every token in 'regs'
    // if we get to the end, we have a match.
    for (; state.r < regs.length; state.r += 1) {
      const reg = regs[state.r];
      // Check if this reg has a named capture group
      state.hasGroup = Boolean(reg.group);
      // Reuse previous capture group if same
      if (state.hasGroup === true) {
        state.inGroup = reg.group;
      } else {
        state.inGroup = null;
      }
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      // support 'unspecific greedy' .* properly
      if (reg.anything === true && reg.greedy === true) {
        const alive = doAstrix(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-OR - multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        const alive = orBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-AND - multi-word AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        const alive = andBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support '.' as any-single
      if (reg.anything === true) {
        // '!.' negative anything should insta-fail
        if (reg.negative && reg.anything) {
          return null
        }
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support 'foo*$' until the end
      if (isEndGreedy(reg, state) === true) {
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        // we want *anything* but this term
        const alive = doNegative(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      const hasMatch = wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      //ok who cares, keep going
      if (reg.optional === true) {
        continue
      }

      // finally, we die
      return null
    }
    //return our results, as pointers
    const pntr = [null, start_i, state.t + origin];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    const groups = {};
    if (state.groups) {
      Object.keys(state.groups).forEach(k => {
        const o = state.groups[k];
        const start = origin + o.start;
        groups[k] = [null, start, start + o.length];
      });
    }
    return { pointer: pntr, groups: groups }
  };

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    const ptrs = [];
    const byGroup = {};
    if (res.length === 0) {
      return { ptrs, byGroup }
    }
    if (typeof group === 'number') {
      group = String(group);
    }
    if (group) {
      res.forEach(r => {
        if (r.groups[group]) {
          ptrs.push(r.groups[group]);
        }
      });
    } else {
      res.forEach(r => {
        ptrs.push(r.pointer);
        Object.keys(r.groups).forEach(k => {
          byGroup[k] ||= [];
          byGroup[k].push(r.groups[k]);
        });
      });
    }
    return { ptrs, byGroup }
  };

  const notIf = function (results, not, docs) {
    results = results.filter(res => {
      const [n, start, end] = res.pointer;
      const terms = docs[n].slice(start, end);
      for (let i = 0; i < terms.length; i += 1) {
        const found = tryHere(terms, not, i, terms.length, i);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  // Compiled sweeps cache this check; editable public patterns are rechecked.
  const isFixed = regs => regs.every(reg => !reg.optional && !reg.greedy &&
    !reg.negative && !reg.choices && !reg.anything &&
    (reg.word !== undefined || reg.tag !== undefined || reg.switch !== undefined || reg.fastOr !== undefined));

  const fromFixed = (terms, regs, start, length, offset = 0) => {
    if (offset + regs.length > terms.length) {
      return null
    }
    for (let r = 0; r < regs.length; r += 1) {
      const term = terms[offset + r];
      // A literal contraction can consume more than one term.
      if (term.implicit) {
        return tryHere(terms, regs, start, length, offset)
      }
      if (wrapMatch(term, regs[r], start + r, length) !== true) {
        return null
      }
    }
    // Failed attempts never need capture state.
    const groups = {};
    for (let r = 0; r < regs.length; r += 1) {
      const name = regs[r].group;
      if (name) {
        if (!groups[name]) {
          groups[name] = [null, start + r, start + r];
        }
        groups[name][2] += 1;
      }
    }
    return { pointer: [null, start, start + regs.length], groups }
  };

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n, attempt) {
    let res = attempt(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$1 = function (docs, todo, cache) {
    cache ||= [];
    const { regs, group, justOne, checkFirst } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }
    const attempt = (todo.fixed ?? isFixed(regs)) ? fromFixed : tryHere;

    // Compiled rules carry this value; public parsed patterns can still be edited
    // by callers, so calculate their minimum without caching on the token array.
    let minLength = todo.minLength;
    if (minLength === undefined) {
      minLength = 0;
      for (let i = 0; i < regs.length; i += 1) {
        const reg = regs[i];
        if (reg.optional !== true && reg.negative !== true) {
          minLength += 1;
        }
      }
    }
    docs: for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        const foundStart = handleStart(terms, regs, n, attempt);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        // ensure it's long-enough
        if (terms.length - i < minLength) {
          break
        }
        // Compiled sweep rules can reject a start before allocating match state.
        if (checkFirst && !wrapMatch(terms[i], regs[0], i, terms.length)) {
          continue
        }
        let res = attempt(terms, regs, i, terms.length, i);
        // did we find a result?
        if (res) {
          // res = addSentence(res, index[0])
          res = addSentence(res, n);
          results.push(res);
          // should we stop here?
          if (justOne === true) {
            break docs
          }
          // skip ahead, over these results
          const end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        const n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    if (todo.notIf) {
      results = notIf(results, todo.notIf, docs);
    }
    // grab the requested group
    results = getGroup(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      const [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  const methods$b = {
    one: {
      termMethods: methods$c,
      parseMatch: syntax,
      match: runMatch$1,
    },
  };

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      const killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: matchAPI,
    methods: methods$b,
    lib: lib$3,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapeXml = str => {
    str = str.replaceAll('&', '&amp;');
    str = str.replaceAll('<', '&lt;');
    str = str.replaceAll('>', '&gt;');
    str = str.replaceAll('"', '&quot;');
    str = str.replaceAll("'", '&apos;');
    return str
  };

  // interpret .class, #id, tagName
  const toTag = function (k) {
    let start = '';
    let end = '</span>';
    k = escapeXml(k);
    if (isClass.test(k)) {
      start = `<span class="${k.replace(/^\./, '')}"`;
    } else if (isId.test(k)) {
      start = `<span id="${k.replace(/^#/, '')}"`;
    } else {
      start = `<${k}`;
      end = `</${k}>`;
    }
    start += '>';
    return { start, end }
  };

  const getIndex = function (doc, obj) {
    const starts = {};
    const ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      const tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        const a = terms[0].id;
        starts[a] ||= [];
        starts[a].push(tag.start);
        const b = terms.at(-1).id;
        ends[b] ||= [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    const { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (Object.hasOwn(starts, t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '';
        out += t.text || '';
        if (Object.hasOwn(ends, t.id)) {
          out += ends[t.id].join('');
        }
        out += t.post || '';
      }
    });
    return out
  };
  var html$1 = { html };

  // Walk the trailing punctuation run once, rather than retrying at every offset.
  const endPunctuation = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]/;
  const trimEnd = str => {
    let end = str.length;
    while (end > 0 && endPunctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach(t => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(/[,،]/g, '');
        pre = pre.replace(trimStart, '');
        // replace a hyphen with a space
        if (isHyphen.test(post)) {
          post = ' ';
        }
        post = post.replace(punctToKill, '');
        // cleanup exclamations
        post = post.replace(/\?!+/, '?');
        post = post.replace(/!+/, '!');
        post = post.replace(/\?+/, '?');
        // kill elipses
        post = post.replace(/[,،…]|\.{2,}/g, '');
        // kill abbreviation periods
        if (t.tags.has('Abbreviation')) {
          post = post.replace(/\./, '');
        }
      }
      if (opts.whitespace === 'some') {
        pre = pre.replace(/\s/, ''); //remove pre-whitespace
        post = post.replace(/\s+/, ' '); //replace post-whitespace with a space
      }
      if (!opts.keepPunct) {
        pre = pre.replace(trimStart, '');
        if (post === '-') {
          post = ' ';
        } else {
          post = trimEnd(post);
        }
      }
      // grab the correct word format
      let word = t[opts.form || 'text'] || t.normal || '';
      if (opts.form === 'implicit') {
        word = t.implicit || t.text;
      }
      if (opts.form === 'root' && t.implicit) {
        word = t.root || t.implicit || t.normal;
      }
      // add an implicit space, for contractions
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit) {
        if (!post || !hasSpace.test(post)) {
          post += ' ';
        }
      }
      txt += pre + word + post;
    });
    if (keepSpace === false) {
      txt = txt.trim();
    }
    if (opts.lowerCase === true) {
      txt = txt.toLowerCase();
    }
    return txt
  };

  const textFromDoc = function (docs, opts) {
    let text = '';
    if (!docs || !docs[0] || !docs[0][0]) {
      return text
    }
    for (let i = 0; i < docs.length; i += 1) {
      // middle
      text += textFromTerms(docs[i], opts, true);
    }
    if (!opts.keepSpace) {
      text = text.trim();
    }
    if (opts.keepEndPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      // remove ending periods
      const last = docs.at(-1);
      if (!last.at(-1).tags.has('Emoticon')) {
        text = trimEnd(text);
        // removing a spaced dash leaves its space behind
        if (!opts.keepSpace) {
          text = text.trimEnd();
        }
      }
      // kill end quotations
      if (text.endsWith(`'`) && !text.endsWith(`s'`)) {
        text = text.replace(/'/, '');
      }
    }
    if (opts.cleanWhitespace === true) {
      text = text.trim();
    }
    return text
  };

  const fmts$1 = {
    text: {
      form: 'text',
    },
    normal: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'normal',
    },
    machine: {
      keepSpace: false,
      whitespace: 'some',
      punctuation: 'some',
      case: 'none',
      unicode: 'some',
      form: 'machine',
    },
    root: {
      keepSpace: false,
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts$1.clean = fmts$1.normal;
  fmts$1.reduced = fmts$1.root;

  /* eslint-disable no-bitwise, no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  const k = [];
  let i = 0;
  for (; i < 64; i++) {
    k[i] = 0 | (Math.sin((i + 1) % Math.PI) * 4294967296);
  }

  const md5 = function (s) {
    let b,
      c,
      d,
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    const h = [(b = 0x67452301), (c = 0xefcdab89), ~b, ~c],
      words = [];

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a; ) {
      words[a >> 2] |= j.charCodeAt(a) << (8 * a--);
    }

    for (i = j = 0; i < s; i += 16) {
      a = h;

      for (
        ;
        j < 64;
        a = [
          (d = a[3]),
          b +
            (((d =
              a[0] +
              [(b & c) | (~b & d), (d & b) | (~d & c), b ^ c ^ d, c ^ (b | ~d)][(a = j >> 4)] +
              k[j] +
              ~~words[i | ([j, 5 * j + 1, 3 * j + 5, 7 * j][a] & 15)]) <<
              (a = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a + (j++ % 4)])) |
              (d >>> -a)),
          b,
          c,
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j; ) h[--j] += a[j];
    }

    for (s = ''; j < 32; ) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s
  };
  // console.log(md5('food-safety'))

  const defaults$1 = {
    text: true,
    terms: true,
  };

  const opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return { ...a, ...b }
  };

  const fns$1 = {
    text: terms => textFromTerms(terms, { keepPunct: true }, false),
    normal: terms => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: terms => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

    machine: terms => textFromTerms(terms, opts, false),
    root: terms => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    hash: terms => md5(textFromTerms(terms, { keepPunct: true }, false)),

    offset: terms => {
      const len = fns$1.text(terms).length;
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start,
        length: len,
      }
    },
    terms: terms => {
      return terms.map(t => ({ ...t, tags: [...t.tags] }))
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: terms => terms.some(t => t.dirty === true),
  };
  fns$1.sentences = fns$1.sentence;
  fns$1.clean = fns$1.normal;
  fns$1.reduced = fns$1.root;

  const toJSON = function (view, option) {
    option ||= {};
    if (typeof option === 'string') {
      option = {};
    }
    option = { ...defaults$1, ...option };
    // run any necessary upfront steps
    if (option.offset) {
      view.compute('offset');
    }
    return view.docs.map((terms, i) => {
      const res = {};
      Object.keys(option).forEach(k => {
        if (option[k] && fns$1[k]) {
          res[k] = fns$1[k](terms, view, i);
        }
      });
      return res
    })
  };

  const methods$a = {
    /** return data */
    json: function (n) {
      const res = toJSON(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$a.data = methods$a.json;

  const isClientSide = () => typeof window !== 'undefined' && window.document;

  // Output the requested format, or the platform's default console view.
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    if (!fmt || !Object.hasOwn(debugMethods, fmt)) {
      fmt = isClientSide() ? 'clientSide' : 'tags';
    }
    debugMethods[fmt](this);
    return this
  };

  const toText$2 = function (term) {
    const pre = term.pre || '';
    const post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    const starts = {};
    Object.keys(obj).forEach(reg => {
      const m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap = function (doc, obj) {
    // index ids to highlight
    const starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (Object.hasOwn(starts, t.id)) {
          const { fn, end } = starts[t.id];
          const m = doc.update([[n, i, end]]);
          text += terms[i].pre || '';
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$2(t);
        }
      }
    });
    return text
  };

  // the 'spec' output format - a clean sentence + an ordered list of top-level tags
  // designed to round-trip between compromise and LLMs (see docs/spec-format.md)

  // roots that describe a token's shape, not its part-of-speech - never picked over a real POS
  const attributeTags = new Set(['Hyphenated', 'Prefix', 'SlashedTerm']);

  // walk a tag up to its top-level (root) ancestor
  const rootOf = function (tag, tagSet) {
    const entry = tagSet[tag];
    if (!entry || !entry.parents || entry.parents.length === 0) {
      return tag
    }
    for (let i = 0; i < entry.parents.length; i += 1) {
      const p = entry.parents[i];
      if (tagSet[p] && (!tagSet[p].parents || tagSet[p].parents.length === 0)) {
        return p
      }
    }
    return entry.parents.at(-1)
  };

  // reduce a term's tag-set to a single top-level tag (or '-' when untagged)
  const slotForTerm = function (term, tagSet) {
    const tags = Array.from(term.tags || []);
    if (tags.length === 0) {
      return '-'
    }
    const primary = tags.find(t => !attributeTags.has(rootOf(t, tagSet))) || tags[0];
    return rootOf(primary, tagSet)
  };

  const makeAliases = function (tagSet, registered) {
    const aliases = Object.create(null);
    for (const tag in tagSet) {
      const entry = tagSet[tag];
      // A leading null explicitly keeps the canonical name.
      const preferred = entry.aliases === undefined ? entry.alias : entry.aliases[0];
      if (preferred && registered[preferred] === tag) {
        aliases[tag] = preferred;
      }
    }
    return aliases
  };

  // one line per sentence: '<text> {Tag,Tag,…}'
  const toSpec = function (doc, world) {
    const tagSet = world.model.one.tagSet;
    const aliases = makeAliases(tagSet, world.model.one.tagAliases);
    return doc.docs.map(terms => {
      const text = terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();
      const tags = terms.map(t => {
        const tag = slotForTerm(t, tagSet);
        return aliases[tag] || tag
      }).join(',');
      return `${text} {${tags}}`
    }).join('\n')
  };

  const isObject$2 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // sort by frequency
  const topk = function (arr) {
    const counts = new Map();
    arr.forEach(word => {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });
    const res = Array.from(counts, ([normal, count]) => ({ normal, count }));
    return res.sort((a, b) => b.count - a.count)
  };

  /** some named output formats */
  const out$1 = function (method) {
    // support custom outputs
    if (isObject$2(method)) {
      return wrap(this, method)
    }
    // text out formats
    if (method === 'text') {
      return this.text()
    }
    if (method === 'normal') {
      return this.text('normal')
    }
    if (method === 'root') {
      return this.text('root')
    }
    if (method === 'machine' || method === 'reduced') {
      return this.text('machine')
    }
    if (method === 'hash' || method === 'md5') {
      return md5(this.text())
    }
    // tagged-sentence format for LLMs (see docs/spec-format.md)
    if (method === 'spec') {
      return toSpec(this, this.world)
    }
    // json data formats
    if (method === 'json') {
      return this.json()
    }
    if (method === 'offset' || method === 'offsets') {
      this.compute('offset');
      return this.json({ offset: true })
    }
    if (method === 'array') {
      const arr = this.docs.map(terms => {
        return terms
          .reduce((str, t) => {
            return str + t.pre + t.text + t.post
          }, '')
          .trim()
      });
      return arr.filter(str => str)
    }
    // return terms sorted by frequency
    if (method === 'freq' || method === 'frequency' || method === 'topk') {
      return topk(this.json({ normal: true }).map(o => o.normal))
    }

    // some handy ad-hoc outputs
    if (method === 'terms') {
      return this.docs.flatMap(terms => terms.map(t => t.text).filter(Boolean))
    }
    if (method === 'tags') {
      return this.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    }
    if (method === 'best-tag') {
      this.compute('tagRank');
      return this.docs
        .map(ts => {
          return ts.map(t => (t.tagRank?.[0] ? `#${t.tagRank[0]}` : '')).join(' ')
        })
        .join('\n')
    }
    if (method === 'debug') {
      return this.debug() //allow
    }
    return this.text()
  };

  const methods$9 = {
    /** */
    debug: debug$1,
    /** */
    out: out$1,
    /** */
    wrap: function (obj) {
      return wrap(this, obj)
    },
  };

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };
  // a dash between two words, like '2025-05-11 - they'
  const spacedDash = /^\s+[-—]\s+$/;

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && Object.hasOwn(fmts$1, fmt)) {
        opts = { ...fmts$1[fmt] };
      } else if (fmt && isObject$1(fmt)) {
        opts = { ...fmt }; //todo: fixme
      }
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {
        //
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        const ptr = this.pointer[0];
        const lastTerm = this.docs.at(-1)?.at(-1);
        if (ptr?.[1] || spacedDash.test(lastTerm?.post)) {
          opts.keepEndPunct = false;
        } else {
          opts.keepEndPunct = true;
        }
      }
      // set defaults
      if (opts.keepPunct === undefined) {
        opts.keepPunct = true;
      }
      if (opts.keepSpace === undefined) {
        opts.keepSpace = true;
      }
      return textFromDoc(this.docs, opts)
    },
  };

  const methods$8 = { ...methods$9, ...text, ...methods$a, ...html$1 };

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$8);
  };

  /* eslint-disable no-console */
  const logClientSide = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      const terms = m.docs[0];
      const out = terms.map(t => {
        let text = t.text || '-';
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        const tags = '[' + Array.from(t.tags).join(', ') + ']';
        return { text, tags }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!Object.hasOwn(model.one.tagSet, tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli$1[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    const { docs, model } = view;
    if (docs.length === 0) {
      console.log(blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(blue('\n  ╭─────────'));
      terms.forEach(t => {
        const tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          const str = view.update([t.reference]).text('normal');
          word += ` - ${dim(i$1('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        const str = blue('  │ ') + i$1(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const colors$1 = { Noun: blue, Verb: green, Adjective: yellow, Pivot: red };

  const showChunks = view => {
    console.log('');
    view.docs.forEach(terms => {
      const out = terms.map(term => {
        const text = term.implicit || term.normal;
        if (Object.hasOwn(colors$1, term.chunk)) {
          return colors$1[term.chunk](text)
        }
        return text
      });
      console.log(out.join(' '), '\n');
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const spliceIn = (txt, offset, index) => {
    const start = offset.start + index * 9; // Each highlight adds nine ANSI characters.
    const end = start + offset.length;
    return txt.substring(0, start) + blue(txt.substring(start, end)) + txt.substring(end)
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    const bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] ||= [];
      bySentence[ptr[0]].push(ptr);
    });
    Object.keys(bySentence).forEach(k => {
      const full = doc.update([[Number(k)]]);
      let txt = full.text();
      const matches = doc.update(bySentence[k]);
      const json = matches.json({ offset: true });
      json.forEach((obj, i) => {
        txt = spliceIn(txt, obj.offset, i);
      });
      console.log(txt);
    });
    console.log('\n');
  };

  const debug = {
    tags: showTags,
    clientSide: logClientSide,
    chunks: showChunks,
    highlight: showHighlight,
  };

  // Diagnostics describe the original parse, before the returned View is mutated.
  const specFailures = (doc, slots, patterns, aliases) => {
    const terms = doc.docs.flat();
    const failures = [];
    if (terms.length !== slots.length) {
      failures.push({
        code: 'length', expected: slots.length, actual: terms.length,
        message: `expected ${slots.length} terms, got ${terms.length}`,
      });
    }
    doc.compute('tagRank');
    slots.forEach((slot, i) => {
      const term = terms[i];
      const actual = term ? Array.from(term.tags) : [];
      const detail = { term: i + 1, word: term?.implicit || term?.text || '', expected: slot, actual };
      if (patterns[i] === null) {
        failures.push({ ...detail, code: 'syntax', message: `term ${i + 1}: invalid slot ${slot.join('|')}` });
        return
      }
      if (!term) {
        return // covered by the length error
      }
      const problems = [];
      slot.forEach(value => {
        if (value === '.') {
          return
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        if (negative && present) {
          problems.push(`unexpected #${tag}`);
        } else if (!negative && !present) {
          problems.push(`missing #${tag}`);
        }
      });
      if (problems.length > 0) {
        const best = term.tagRank?.[0] || actual.at(-1) || 'Untagged';
        failures.push({
          ...detail, code: 'tags',
          message: `term ${i + 1} '${detail.word}': #${best}, ${problems.join(', ')}`,
        });
      }
    });
    if (failures.length === 0) {
      failures.push({ code: 'match', message: 'tags align, but the sentence pattern did not match' });
    }
    return failures
  };

  const logSpec = (doc, slots, failures, aliases) => {
    const terms = doc.docs.flat();
    const wrong = new Set(failures.filter(failure => failure.term).map(failure => failure.term - 1));
    const invalid = new Set(failures.filter(failure => failure.code === 'syntax').map(failure => failure.term - 1));
    const unmatched = failures.some(failure => failure.code === 'match');
    let visible = 0;
    terms.forEach((term, i) => {
      if (term.text) {
        visible = i;
      }
      // Implicit terms share their visible contraction or number-range token.
      if (wrong.has(i) || i >= slots.length || unmatched) {
        wrong.add(visible);
      }
    });
    const text = terms.map((term, i) => {
      const word = wrong.has(i) && term.text ? red(term.text) : term.text;
      return term.pre + word + term.post
    }).join('').trim();
    const tags = slots.map((slot, i) => {
      const term = terms[i];
      if (!term || invalid.has(i) || unmatched) {
        return red(slot.join('|'))
      }
      return slot.map(value => {
        if (value === '.') {
          return value
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        return present === negative ? red(value) : value
      }).join('|')
    }).join(',');
    const block = slots.length === 0 ? red('{}') : `{${tags}}`;
    return `${text} ${block}`
  };

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only
  const comment = /\}[ \t]*#.*$/; // an optional '# comment' after the last {tags} block


  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace); // eslint-disable-line prefer-const
    if (tags === undefined) {
      return { text: text.replace(/\s#.*$/, '').trimEnd(), tags: null } // no {tags} block on this line
    }
    tags = tags.replace(comment, '}'); // drop the comment - only ever one, always last
    tags = tags.split(',').map(tag => tag.trim());
    const lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    if (tags.length === 1 && tags[0].length === 1 && tags[0][0] === '') {
      tags = []; // empty '{}'; retain empty slots in nonempty lists
    }
    return { text, tags }
  };

  // make a match syntax looping through the arrays of tags
  const toMatchString = function (tags, aliases) {
    // Slots accept tags and '.', never match-syntax quantifiers or groups.
    if (tags.some(slot => slot.some(tag => tag !== '.' && !/^!?#?[a-z][a-z0-9]*$/i.test(tag)))) {
      return null
    }
    return tags.map(arr => {
      arr = arr.map(str => {
        if (str === '.') {
          return '.'
        }
        const negative = str.startsWith('!');
        const tag = str.replace(/^!?#?/, '');
        const prefix = negative ? '!#' : '#';
        return prefix + (aliases[tag] || tag)
      });
      if (arr.length > 1) {
        return `(${arr.join(' && ')})`
      }
      return arr[0]
    }).join(' ')
  };

  // Apply only positive constraints; negatives remain assertions.
  const applyTags = (doc, slots, aliases) => {
    const terms = doc.terms();
    // Tokenization can supply structural tags; literal slots replace them.
    doc.docs.flat().forEach(term => term.tags.clear());
    slots?.forEach((slot, i) => {
      const tags = slot.filter(tag => tag !== '.' && !tag.startsWith('!')).map(tag => {
        tag = tag.replace(/^#/, '');
        return aliases[tag] || tag
      });
      terms.eq(i).tag(tags, 'fromSpec');
    });
  };

  const fromSpec = function (spec, { tags: tagMode = 'ignore', failures: failureMode = 'ignore', verbose = false } = {}) {
    if (!['ignore', 'use'].includes(tagMode) || !['ignore', 'throw', 'retain', 'log'].includes(failureMode)) {
      throw new Error('Invalid fromSpec options')
    }
    const aliases = this.world().model.one.tagAliases;
    const result = this('');
    result.failures = [];
    spec.split('\n').forEach((line, index) => {
      if (!line.trim() || /^\s*#/.test(line)) {
        return
      }
      const { text, tags } = parseLine(line);
      const doc = tagMode === 'use' ? this.tokenize(text) : this(text);
      let failures = [];
      if (tags !== null && (tagMode === 'use' || failureMode !== 'ignore')) {
        const count = doc.docs.reduce((sum, terms) => sum + terms.length, 0);
        const patterns = tags.map(slot => toMatchString([slot], aliases));
        const pattern = toMatchString(tags, aliases);
        // Assigning slots is unsafe when the shape or syntax is invalid.
        const canApply = count === tags.length && pattern !== null;
        if (tagMode === 'use' && !canApply && failureMode !== 'log') {
          const invalid = specFailures(doc, tags, patterns, aliases);
          throw new Error(`${text.trim()} - ${invalid.map(failure => failure.message).join('; ')}`)
        }
        if (tagMode === 'use') {
          applyTags(doc, canApply ? tags : null, aliases);
        }
        if (failureMode !== 'ignore' && (count !== tags.length || pattern === null || !doc.has(pattern))) {
          failures = specFailures(doc, tags, patterns, aliases)
            .map(failure => ({ line: index + 1, text: text.trim(), ...failure }));
          result.failures.push(...failures);
        }
      } else if (tagMode === 'use') {
        applyTags(doc, null, aliases);
      }
      const detail = failures.map(failure => failure.message).join('; ');
      if (failureMode === 'log' && failures.length > 0) {
        console.error(logSpec(doc, tags, failures, aliases)); //eslint-disable-line no-console
      } else if (verbose) {
        const block = tags === null ? '' : ` {${tags.map(slot => slot.join('|')).join(',')}}`;
        if (failures.length > 0) {
          console.log(`${red('✗')} ${text}${dim(block)} - ${red(detail)}`); //eslint-disable-line no-console
        } else {
          console.log(`${green('✓')} ${green(dim(text))}${dim(block)}`); //eslint-disable-line no-console
        }
      }
      if (failures.length > 0 && failureMode === 'throw') {
        throw new Error(`${text.trim()} - ${detail}`)
      }
      if (failureMode === 'retain' && tags !== null && failures.length === 0) {
        return
      }
      // Preserve the parsed terms and assigned tags, without running hooks twice.
      if (doc.found) {
        const previous = result.document.at(-1)?.at(-1);
        if (previous) {
          previous.post += '\n';
        }
        result.document.push(...doc.docs);
      }
    });
    return result
  };

  // Keep the legacy logging and throwing arguments on the compatibility wrapper.
  const testSpec = function (spec, verbose = true, throwError = false) {
    const result = this.fromSpec(spec, { tags: 'ignore', failures: 'retain', verbose });
    if (throwError && result.failures.length > 0) {
      const failure = result.failures[0];
      throw new Error(`${failure.text} - ${failure.message}`)
    }
    return result
  };

  var output = {
    lib: {
      fromSpec,
      testSpec,
    },
    api: addAPI$1,
    methods: {
      one: {
        hash: md5,
        debug,
      },
    },
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    const [, startA, endA] = a;
    const [, startB, endB] = b;
    // [a,a,a,-,-,-,]
    // [-,-,b,b,b,-,]
    if (startA <= startB && endA > startB) {
      return true
    }
    // [-,-,-,a,a,-,]
    // [-,-,b,b,b,-,]
    if (startB <= startA && endB > startA) {
      return true
    }
    return false
  };

  // get widest min/max
  const getExtent = function (ptrs) {
    let min = ptrs[0][1];
    let max = ptrs[0][2];
    ptrs.forEach(ptr => {
      if (ptr[1] < min) {
        min = ptr[1];
      }
      if (ptr[2] > max) {
        max = ptr[2];
      }
    });
    return [ptrs[0][0], min, max]
  };

  // collect pointers by sentence number
  const indexN = function (ptrs) {
    const byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] ||= [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    const obj = {};
    for (let i = 0; i < arr.length; i += 1) {
      obj[arr[i].join(',')] = arr[i];
    }
    return Object.values(obj)
  };

  // a before b
  // console.log(doesOverlap([0, 0, 4], [0, 2, 5]))
  // // b before a
  // console.log(doesOverlap([0, 3, 4], [0, 1, 5]))
  // // disjoint
  // console.log(doesOverlap([0, 0, 3], [0, 4, 5]))
  // neighbours
  // console.log(doesOverlap([0, 1, 3], [0, 3, 5]))
  // console.log(doesOverlap([0, 3, 5], [0, 1, 3]))

  // console.log(
  //   getExtent([
  //     [0, 3, 4],
  //     [0, 4, 5],
  //     [0, 1, 2],
  //   ])
  // )

  // split a pointer, by match pointer
  const pivotBy = function (full, m) {
    const [n, start] = full;
    const mStart = m[1];
    const mEnd = m[2];
    const res = {};
    // is there space before the match?
    if (start < mStart) {
      const end = mStart < full[2] ? mStart : full[2]; // find closest end-point
      res.before = [n, start, end]; //before segment
    }
    res.match = m;
    // is there space after the match?
    if (full[2] > mEnd) {
      res.after = [n, mEnd, full[2]]; //after segment
    }
    return res
  };

  const doesMatch = function (full, m) {
    return full[1] <= m[1] && m[2] <= full[2]
  };

  const splitAll = function (full, m) {
    const byN = indexN(m);
    const res = [];
    full.forEach(ptr => {
      const [n] = ptr;
      let matches = byN[n] || [];
      matches = matches.filter(p => doesMatch(ptr, p));
      if (matches.length === 0) {
        res.push({ passthrough: ptr });
        return
      }
      // ensure matches are in-order
      matches = matches.sort((a, b) => a[1] - b[1]);
      // start splitting our left-to-right
      let carry = ptr;
      matches.forEach((p, i) => {
        const found = pivotBy(carry, p);
        // last one
        if (!matches[i + 1]) {
          res.push(found);
        } else {
          res.push({ before: found.before, match: found.match });
          if (found.after) {
            carry = found.after;
          }
        }
      });
    });
    return res
  };

  const max$1 = 20;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence
      if (doc[n - i]) {
        const index = doc[n - i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n - i, index]
        }
      }
      // look down a sentence
      if (doc[n + i]) {
        const index = doc[n + i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n + i, index]
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    const [n, start, , , endId] = ptr;
    const terms = document[n];
    // look for end-id
    const newEnd = terms.findIndex(t => t.id === endId);
    if (newEnd === -1) {
      // if end-term wasn't found, so go all the way to the end
      ptr[2] = document[n].length;
      ptr[4] = terms.length > 0 ? terms[terms.length - 1].id : null;
    } else {
      ptr[2] = newEnd; // repair ending pointer
    }
    return document[n].slice(start, ptr[2] + 1)
  };

  /** return a subset of the document, from a pointer */
  const getDoc$1 = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      // eslint-disable-next-line prefer-const
      let [n, start, end, id, endId] = ptr;
      let terms = document[n] || [];
      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = terms.length;
      }
      if (id && (!terms[start] || terms[start].id !== id)) {
        // console.log('  repairing pointer...')
        const wild = blindSweep(id, document, n);
        if (wild !== null) {
          const len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          const startId = terms[0] ? terms[0].id : null;
          ptrs[i] = [wild[0], wild[1], wild[1] + len, startId];
        }
      } else {
        terms = terms.slice(start, end);
      }
      if (terms.length === 0) {
        return
      }
      if (start === end) {
        return
      }
      // test end-id, if it exists
      if (endId && terms[terms.length - 1].id !== endId) {
        terms = repairEnding(ptr, document);
      }
      // otherwise, looks good!
      doc.push(terms);
    });
    doc = doc.filter(a => a.length > 0);
    return doc
  };

  // flat list of terms from nested document
  const termList = function (docs) {
    const arr = [];
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        arr.push(docs[i][t]);
      }
    }
    return arr
  };

  var methods$7 = {
    one: {
      termList,
      getDoc: getDoc$1,
      pointer: {
        indexN,
        splitAll,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    const both = a.concat(b);
    const byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      const [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      const hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      const range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };

  // two disjoint
  // console.log(getUnion([[1, 3, 4]], [[0, 1, 2]]))
  // two disjoint
  // console.log(getUnion([[0, 3, 4]], [[0, 1, 2]]))
  // overlap-plus
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 6]]))
  // overlap
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 3]]))
  // neighbours
  // console.log(getUnion([[0, 1, 3]], [[0, 3, 5]]))

  const subtract = function (refs, not) {
    const res = [];
    const found = splitAll(refs, not);
    found.forEach(o => {
      if (o.passthrough) {
        res.push(o.passthrough);
      }
      if (o.before) {
        res.push(o.before);
      }
      if (o.after) {
        res.push(o.after);
      }
    });
    return res
  };

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    const start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    const end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    const byN = indexN(b);
    const res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        const overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };

  // console.log(getIntersection([[0, 1, 3]], [[0, 2, 4]]))

  const getDoc = (m, view) => {
    if (typeof m === 'string' || Array.isArray(m)) {
      return view.match(m)
    }
    if (!m) {
      return view.none()
    }
    // support pre-parsed reg object
    return m
  };

  // 'harden' our json pointers, again
  const addIds = function (ptrs, docs) {
    return ptrs.map(ptr => {
      const [n, start] = ptr;
      if (docs[n] && docs[n][start]) {
        ptr[3] = docs[n][start].id;
      }
      return ptr
    })
  };

  const methods$6 = {};

  // all parts, minus duplicates
  methods$6.union = function (m) {
    m = getDoc(m, this);
    let ptrs = getUnion(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.and = methods$6.union;

  // only parts they both have
  methods$6.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$6.not = function (m) {
    m = getDoc(m, this);
    let ptrs = subtract(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.difference = methods$6.not;

  // get opposite of a match
  methods$6.complement = function () {
    const doc = this.all();
    let ptrs = subtract(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$6.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };

  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$6);
  };

  var pointers = {
    methods: methods$7,
    api: addAPI,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      const net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$5 = function (View) {

    /** speedy match a sequence of matches */
    View.prototype.sweep = function (net, opts = {}) {
      const { world, docs } = this;
      const { methods } = world;
      let found = methods.one.bulkMatch(docs, net, this.methods, opts);

      // apply any changes
      if (opts.tagger !== false) {
        methods.one.bulkTagger(found, docs, this.world);
      }
      // fix the pointers
      // collect all found results into a View
      found = found.map(o => {
        const ptr = o.pointer;
        const term = docs[ptr[0]][ptr[1]];
        const len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            ptr[1] + len
          ];
        }
        return o
      });
      const ptrs = found.map(o => o.pointer);
      // cleanup results a bit
      found = found.map(obj => {
        obj.view = this.update([obj.pointer]);
        delete obj.regs;
        delete obj.needs;
        delete obj.pointer;
        delete obj._expanded;
        return obj
      });
      return {
        view: this.update(ptrs),
        found
      }
    };

  };

  // Resolve actions and index hints once, alongside the match expression.
  const resolveAliases = (rule, aliases) => {
    const tag = value => {
      if (Array.isArray(value)) {
        return value.map(tag)
      }
      if (typeof value !== 'string') {
        return value
      }
      return value.trim().split(/ +/).map(name => {
        name = name.replace(/^#/, '');
        return aliases[name] || name
      }).join(' ')
    };
    const hook = value => {
      if (typeof value === 'string' && value.startsWith('#')) {
        return '#' + tag(value)
      }
      return value
    };
    if (rule.tag !== undefined) {
      rule.tag = tag(rule.tag);
    }
    if (rule.unTag !== undefined) {
      rule.unTag = tag(rule.unTag);
    }
    if (rule.hook !== undefined) {
      rule.hook = hook(rule.hook);
    }
    if (rule.ifNo !== undefined) {
      rule.ifNo = [rule.ifNo].flat().map(hook);
    }
  };

  // Only precheck required, single-term tokens without special matching steps.
  const canCheck = reg => Boolean(reg && !reg.optional && !reg.negative && !reg.greedy &&
    !reg.choices && !reg.anything && !reg.regex && !reg.method);

  const getBoundary = (reg, boundary) => {
    if (!canCheck(reg) || !reg[boundary]) {
      return null
    }
    return reg
  };

  // extract the clear needs for an individual match token
  const getTokenNeeds = function (reg) {
    // negatives can't be cached
    if (reg.optional === true || reg.negative === true) {
      return null
    }
    if (reg.tag) {
      return '#' + reg.tag
    }
    if (reg.word) {
      return reg.word
    }
    if (reg.switch) {
      return `%${reg.switch}%`
    }
    return null
  };

  // Only allow hooks that every successful match must contain. In particular,
  // a word inside an optional or negative AND block is not a required hook.
  const hasRequiredHook = function (regs, hook) {
    return regs.some(reg => {
      if (reg.optional || reg.negative) {
        return false
      }
      if (getTokenNeeds(reg) === hook) {
        return true
      }
      return reg.operator === 'and' && reg.choices &&
        reg.choices.some(side => hasRequiredHook(side, hook))
    })
  };

  const getNeeds = function (regs) {
    const needs = [];
    regs.forEach(reg => {
      needs.push(getTokenNeeds(reg));
      // support AND (foo && tag)
      if (reg.operator === 'and' && reg.choices) {
        reg.choices.forEach(oneSide => {
          oneSide.forEach(r => {
            needs.push(getTokenNeeds(r));
          });
        });
      }
    });
    return needs.filter(str => str)
  };

  const getWants = function (regs) {
    const wants = [];
    let count = 0;
    regs.forEach(reg => {
      if (reg.operator === 'or' && !reg.optional && !reg.negative) {
        // add fast-or terms
        if (reg.fastOr) {
          Array.from(reg.fastOr).forEach(w => {
            wants.push(w);
          });
        }
        // add slow-or
        if (reg.choices) {
          reg.choices.forEach(rs => {
            rs.forEach(r => {
              const n = getTokenNeeds(r);
              if (n) {
                wants.push(n);
              }
            });
          });
        }
        count += 1;
      }
    });
    return { wants, count }
  };

  const parse$1 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      resolveAliases(obj, world.model.one.tagAliases);
      obj.regs = parseMatch(obj.match, {}, world);
      obj.fixed = isFixed(obj.regs);
      obj.checkFirst = canCheck(obj.regs[0]);
      obj.startTerm = getBoundary(obj.regs[0], 'start');
      obj.endTerm = getBoundary(obj.regs[obj.regs.length - 1], 'end');
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      if (obj.hook !== undefined) {
        if (typeof obj.hook !== 'string' || !obj.needs.includes(obj.hook) || !hasRequiredHook(obj.regs, obj.hook)) {
          throw new Error(`Invalid hook "${obj.hook}" for match "${obj.match}": use a required word, #Tag, or %Switch%.`)
        }
      }
      const { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
      // The matcher excludes negative tokens from its own minimum. Cache that
      // separately rather than changing the sweep's existing length filter.
      obj.minLength = obj.regs.filter(o => o.optional !== true && o.negative !== true).length;
    });
    return matches
  };

  // Choose one necessary hook per rule. A missing required hook guarantees that
  // the rule cannot match, so broader hooks need not enqueue it as well.
  const buildIndex = function (matches, hooks, hookOrder) {
    const index = Object.create(null);
    const seen = new Set();
    const lastRank = Object.keys(hooks).length;
    matches.forEach((rule, order) => {
      if (seen.has(rule)) {
        return
      }
      seen.add(rule);
      let anchor = null;
      let rank = lastRank;
      for (let i = 0; i < rule.needs.length; i += 1) {
        const key = rule.needs[i];
        // Prefer the hook shared by the fewest rules in this network.
        if (anchor === null || hooks[key].length < hooks[anchor].length) {
          anchor = key;
        }
        rank = Math.min(rank, hookOrder[key]);
      }
      // Explicit hooks have already been checked against required match tokens.
      if (rule.hook !== undefined) {
        anchor = rule.hook;
      }
      // Historically, any earlier matching alternative could determine where
      // this rule ran. Retain that ordering even when using a required anchor.
      const earlier = [...new Set(rule.wants)]
        .filter(key => hookOrder[key] < rank)
        .sort((a, b) => hookOrder[a] - hookOrder[b]);
      const keys = anchor === null ? [...new Set(rule.wants)] : [anchor];
      // The bucket already proves its anchor; check each remaining need once.
      const needs = [...new Set(rule.needs)].filter(key => key !== anchor);
      const entry = { rule, order, rank, earlier, needs, single: keys.length === 1 };
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        index[key] ||= [];
        index[key].push(entry);
      }
    });
    return index
  };

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$1(matches, world);

    // collect by wants and needs
    const hooks = {};
    matches.forEach(obj => {
      // add needs
      obj.needs.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
    });
    // Record enumeration order, including numeric keys, so input-driven lookup
    // can preserve the order in which tag actions have always been applied.
    const hookOrder = Object.create(null);
    Object.keys(hooks).forEach((k, i) => {
      hookOrder[k] = i;
      // remove duplicates
      const already = new Set();
      hooks[k] = hooks[k].filter(obj => {
        if (already.has(obj)) {
          return false
        }
        already.add(obj);
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    const always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      hookOrder,
      index: buildIndex(matches, hooks, hookOrder),
      always
    }
  };

  // Reject impossible candidates before allocating and sorting their entries.
  const canMatch = (obj, haves, terms, needs = obj.needs) => {
    const termCount = terms.length;
    if (!(termCount >= obj.minWords)) {
      return false
    }
    for (let j = 0; j < needs.length; j += 1) {
      if (!haves.has(needs[j])) {
        return false
      }
    }
    if (obj.ifNo !== undefined) {
      for (let j = 0; j < obj.ifNo.length; j += 1) {
        if (haves.has(obj.ifNo[j])) {
          return false
        }
      }
    }
    if (obj.wants.length > 0) {
      let count = 0;
      for (let j = 0; j < obj.wants.length; j += 1) {
        if (haves.has(obj.wants[j])) {
          count += 1;
          if (count >= obj.minWant) {
            break
          }
        }
      }
      if (!(count >= obj.minWant)) {
        return false
      }
    }
    // Required anchors must match the sentence boundary, not just occur in it.
    if (termCount && obj.startTerm && !wrapMatch(terms[0], obj.startTerm, 0, termCount)) {
      return false
    }
    if (termCount && obj.endTerm && !wrapMatch(terms[termCount - 1], obj.endTerm, termCount - 1, termCount)) {
      return false
    }
    return true
  };

  // Required anchors narrow the candidate list. Sort surviving entries by their
  // original first matching hook, then their position within that hook's bucket.
  const getIndexed = function (set, index, hookOrder, terms) {
    const found = [];
    const seen = new Set();
    set.forEach(key => {
      const bucket = index[key];
      if (!Array.isArray(bucket)) {
        return
      }
      for (let i = 0; i < bucket.length; i += 1) {
        const entry = bucket[i];
        // Single-bucket entries cannot be encountered twice. Older nets fall back.
        if (entry.single !== true) {
          if (seen.has(entry)) {
            continue
          }
          seen.add(entry);
        }
        if (!canMatch(entry.rule, set, terms, entry.needs)) {
          continue
        }
        let rank = entry.rank;
        for (let j = 0; j < entry.earlier.length; j += 1) {
          const earlier = entry.earlier[j];
          if (set.has(earlier)) {
            rank = hookOrder[earlier];
            break
          }
        }
        if (rank === entry.rank) {
          found.push(entry);
        } else {
          found.push({ rule: entry.rule, rank, order: entry.order });
        }
      }
    });
    found.sort((a, b) => a.rank - b.rank || a.order - b.order);
    return found.map(entry => entry.rule)
  };

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, net, document) {
    const { hooks, index, always } = net;
    let { hookOrder } = net;
    // Older compiled nets may not include the precomputed hook order.
    if (!hookOrder) {
      hookOrder = Object.create(null);
      Object.keys(hooks).forEach((k, i) => { hookOrder[k] = i; });
    }
    const lists = docCaches.map((set, n) => {
      if (index) {
        return getIndexed(set, index, hookOrder, document[n])
      }
      const keys = [];
      set.forEach(k => {
        if (typeof hookOrder[k] === 'number') {
          keys.push(k);
        }
      });
      keys.sort((a, b) => hookOrder[a] - hookOrder[b]);
      // Append each rule once, without concatenating and then filtering buckets.
      const maybe = [];
      const already = new Set();
      for (let i = 0; i < keys.length; i += 1) {
        const bucket = hooks[keys[i]];
        for (let j = 0; j < bucket.length; j += 1) {
          const m = bucket[j];
          if (!already.has(m)) {
            already.add(m);
            if (canMatch(m, set, document[n])) {
              maybe.push(m);
            }
          }
        }
      }
      return maybe
    });
    // Apply the same exclusions to unindexed rules, preserving their final position.
    lists.forEach((list, n) => {
      for (let i = 0; i < always.length; i += 1) {
        if (canMatch(always[i], docCaches[n], document[n])) {
          list.push(always[i]);
        }
      }
    });
    return lists
  };

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    const results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      const sentence = [document[n]];
      for (let i = 0; i < maybeList[n].length; i += 1) {
        const m = maybeList[n][i];
        // ok, actually do the work.
        const res = methods.one.match(sentence, m);
        // found something.
        if (res.ptrs.length > 0) {
          res.ptrs.forEach(ptr => {
            ptr[0] = n; // fix the sentence pointer
            // check ifNo
            // if (m.ifNo !== undefined) {
            //   let terms = document[n].slice(ptr[1], ptr[2])
            //   for (let k = 0; k < m.ifNo.length; k += 1) {
            //     const no = m.ifNo[k]
            //     // quick-check cache
            //     if (docCache[n].has(no)) {
            //       if (no.startsWith('#')) {
            //         let tag = no.replace(/^#/, '')
            //         if (terms.find(t => t.tags.has(tag))) {
            //           console.log('+' + tag)
            //           return
            //         }
            //       } else if (terms.find(t => t.normal === no || t.tags.has(no))) {
            //         console.log('+' + no)
            //         return
            //       }
            //     }
            //   }
            // }
            const todo = { ...m, pointer: ptr };
            if (m.unTag !== undefined) {
              todo.unTag = m.unTag;
            }
            results.push(todo);
          });
          //ok cool, can we stop early?
          if (opts.matchOne === true) {
            return [results[0]]
          }
        }
      }
    }
    return results
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // filter candidates before sorting them into execution order
    const maybeList = getHooks(docCache, net, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  const sets = new WeakMap();
  const empty = new Set();

  // Normalization replaces these arrays when plugins rebuild the tag graph.
  const getTagSet = (tags) => {
    if (!tags || tags.length === 0) {
      return empty
    }
    let set = sets.get(tags);
    if (!set) {
      set = new Set(tags);
      sets.set(tags, set);
    }
    return set
  };

  // is this tag consistent with the tags they already have?
  const canBe$1 = function (terms, tag, model) {
    const tagSet = model.one.tagSet;
    if (!Object.hasOwn(tagSet, tag)) {
      return true
    }
    const conflicts = getTagSet(tagSet[tag].not);
    if (conflicts.size === 0) {
      return true
    }
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      for (const existing of term.tags) {
        if (conflicts.has(existing)) {
          return false //found a tag conflict - bail!
        }
      }
    }
    return true
  };

  const tagger$1 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    const looksPlural = methods.two.looksPlural;
    if (list.length === 0) {
      return list
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      const reason = todo.reason || todo.match;
      const terms = getDoc([todo.pointer], document)[0];
      let validated;
      // handle 'safe' tag
      if (todo.safe === true) {
        // check for conflicting tags
        if (canBe$1(terms, todo.tag, model) === false) {
          return
        }
        // dont tag half of a hyphenated word
        if (terms[terms.length - 1].post === '-') {
          return
        }
        // Only an exact single tag was checked by canBe; arrays and shorthand
        // still need their individual checks in setTag.
        if (typeof todo.tag === 'string' && Object.hasOwn(model.one.tagSet, todo.tag)) {
          validated = model.one.tagSet[todo.tag];
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`, validated);
        // quick and dirty plural tagger 😕
        if (todo.tag === 'Noun' && looksPlural) {
          const term = terms[terms.length - 1];
          if (looksPlural(term.text)) {
            setTag([term], 'Plural', world, todo.safe, 'quick-plural');
          } else {
            setTag([term], 'Singular', world, todo.safe, 'quick-singular');
          }
        }
        // allow freezing this match, too
        if (todo.freeze === true) {
          terms.forEach(term => (term.frozen = true));
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, model.one.tagSet, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => (t.chunk = todo.chunk));
      }
    })
  };

  var methods$5 = {
    buildNet,
    bulkMatch: sweep$1,
    bulkTagger: tagger$1
  };

  var sweep = {
    lib: lib$2,
    api: api$5,
    methods: {
      one: methods$5,
    }
  };

  const isMulti = / /;

  const addChunk = function (term, tag) {
    if (tag === 'Noun') {
      term.chunk = tag;
    }
    if (tag === 'Verb') {
      term.chunk = tag;
    }
  };

  // eslint-disable-next-line max-params
  const tagTerm = function (term, tag, tagSet, isSafe, validated, reason) {
    // does it already have this tag?
    if (term.tags.has(tag) === true) {
      return null
    }
    // allow this shorthand in multiple-tag strings
    if (tag === '.') {
      return null
    }
    // don't overwrite any tags, if term is frozen
    if (term.frozen === true) {
      isSafe = true;
    }
    const previous = debug$3.tags ? debug$3.before(term) : null;
    // for known tags, do logical dependencies first
    const known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known !== validated && known.not && known.not.length > 0) {
        const conflicts = getTagSet(known.not);
        for (const existing of term.tags) {
          if (conflicts.has(existing)) {
            // Safe and frozen terms cannot lose conflicting tags.
            if (isSafe === true) {
              return null
            }
            term.tags.delete(existing);
          }
        }
      }
      // add parent tags
      if (known.parents && known.parents.length > 0) {
        for (let o = 0; o < known.parents.length; o += 1) {
          term.tags.add(known.parents[o]);
          addChunk(term, known.parents[o]);
        }
      }
    }
    // finally, add our tag
    term.tags.add(tag);
    // now it's dirty?
    term.dirty = true;
    // add a chunk too, if it's easy
    addChunk(term, tag);
    if (previous) {
      debug$3.log(term, previous, reason);
    }
    return true
  };

  // support '#Noun . #Adjective' syntax
  // eslint-disable-next-line max-params
  const multiTag = function (terms, tagString, tagSet, aliases, isSafe, reason) {
    const tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      let tag = tags[i];
      if (tag) {
        tag = tag.replace(/^#/, '');
        tag = aliases?.[tag] || tag;
        tagTerm(term, tag, tagSet, isSafe, undefined, reason);
      }
    });
  };

  // add a tag to all these terms
  // Whole-match validation is separate from per-term safety.
  // eslint-disable-next-line max-params
  const setTag = function (terms, tag, world = {}, isSafe, reason, validated) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    if (Array.isArray(tag) === true) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe, reason));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, world.model.one.tagAliases, isSafe, reason);
      return
    }
    tag = tag.replace(/^#/, '');
    tag = world.model.one.tagAliases?.[tag] || tag;
    // let set = false
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe, validated, reason);
    }
  };

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet, reason = 'untag') {
    tag = tag.trim().replace(/^#/, '');
    const children = getTagSet(tagSet[tag]?.children);
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
      const previous = debug$3.tags ? debug$3.before(term) : null;
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        if (previous) {
          debug$3.log(term, previous, reason);
        }
        continue
      }
      // removing #Verb should also remove #PastTense
      if (children.size > 0) {
        for (const existing of term.tags) {
          if (children.has(existing)) {
            term.tags.delete(existing);
          }
        }
      }
      term.tags.delete(tag);
      if (previous) {
        debug$3.log(term, previous, reason);
      }
    }
  };

  // quick check if this tag will require any untagging
  const canBe = function (term, tag, tagSet) {
    if (!Object.hasOwn(tagSet, tag)) {
      return true // everything can be an unknown tag
    }
    const conflicts = getTagSet(tagSet[tag].not);
    if (conflicts.size === 0) {
      return true
    }
    for (const existing of term.tags) {
      if (conflicts.has(existing)) {
        return false
      }
    }
    return true
  };

  const validate$1 = function (node) {
    node.children = node.children || [];
    node._cache = node._cache || {};
    node.props = node.props || {};
    node._cache.parents = node._cache.parents || [];
    return node
  };

  // Iterative DFS keeps deep inputs safe and distinguishes shared nodes from cycles.
  const checkCycles = roots => {
    const states = new Map();
    const stack = roots.map(node => [node, false]);
    for (; stack.length > 0;) {
      const [node, done] = stack.pop();
      if (done) {
        states.set(node, 2);
      } else if (states.get(node) === 1) {
        throw new Error('[Grad] - cyclic input')
      } else if (!states.has(node)) {
        states.set(node, 1);
        stack.push([node, true]);
        for (const child of node.children || []) {
          stack.push([child, false]);
        }
      }
    }
    return states.keys()
  };

  // turn parent-index rows into nested json
  const fromArray = function (rows) {
    const index = new Map();
    // addTags allocates these rows for this graph, so initialize them in place.
    rows.forEach(node => {
      validate$1(node);
      index.set(node.id, node);
    });
    const root = validate$1({});
    rows.forEach(node => {
      if (node.parent) {
        if (index.has(node.parent)) {
          const parent = index.get(node.parent);
          delete node.parent; //no-longer needed
          parent.children.push(node);
        } else {
          console.warn(`[Grad] - missing node '${node.parent}'`); // eslint-disable-line no-console
        }
        return
      }
      // no parent, add it to root
      root.children.push(node);
    });
    checkCycles(rows);
    return root
  };

  // [a, a1, b, b1]
  // Visitor-only callers can skip collecting nodes.
  const byDepth = (root, fn, collect = true) => {
    const list = collect ? [] : null;
    const queue = [root];
    for (; queue.length > 0;) {
      // get first
      const node = queue.pop();
      if (collect) {
        list.push(node);
      }
      // add kids to queue
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i -= 1) {
          const child = node.children[i];
          if (fn) {
            fn(node, child);
          }
          queue.push(child);
        }
      }
    }
    return list
  };

  // Fresh graph nodes already have empty caches; fill ancestors in root-to-parent order.
  const cacheParents = root => {
    byDepth(root, (parent, child) => {
      if (parent.id) {
        child._cache.parents = parent._cache.parents.concat([parent.id]);
      }
    }, false);
  };

  // addTags supplies only exclusions, additional parents, and these scalar flags.
  const inherit = (props, parent) => {
    if (parent.not) {
      props.not = new Set([...props.not, ...parent.not]);
    }
    if (Array.isArray(parent.also) && (props.also === undefined || Array.isArray(props.also))) {
      props.also = parent.also.concat(props.also || []);
    } else if (props.also === undefined) {
      props.also = parent.also;
    }
    if (props.is === undefined) {
      props.is = parent.is;
    }
    if (props.novel === undefined) {
      props.novel = parent.novel;
    }
    return props
  };

  const fillDown = root => {
    byDepth(root, (parent, child) => {
      child.props = inherit(child.props, parent.props);
    }, false);
  };

  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color

  const reset = '\x1b[0m';
  //cheaper than requiring chalk
  const cli = {
    // green: str => '\x1b[32m' + str + reset,
    red: str => '\x1b[31m' + str + reset,
    // blue: str => '\x1b[34m' + str + reset,
    // magenta: str => '\x1b[35m' + str + reset,
    // cyan: str => '\x1b[36m' + str + reset,
    // yellow: str => '\x1b[33m' + str + reset,
    // black: str => '\x1b[30m' + str + reset,
    dim: str => '\x1b[2m' + str + reset,
  };

  const indent = '    ';

  const toText$1 = function (json, color) {
    let arrow = '-> ';
    if (color) {
      arrow = cli.dim('→ ');
    }
    let txt = '';
    const rows = byDepth(json);
    rows.forEach((node, i) => {
      let label = node.id || '';
      if (color) {
        label = cli.red(label);
      }
      if (i === 0 && !node.id) {
        return //skip empty root
      }
      const depth = node._cache.parents.length;
      txt += indent.repeat(depth) + arrow + label + '\n';
    });
    return txt
  };

  const toArray$1 = function (json) {
    // The tag formatter only reads these graph-owned nodes.
    const nodes = byDepth(json);
    // should we show the root?
    const root = nodes[0];
    if (root && !root.id && Object.keys(root.props).length === 0) {
      nodes.shift();
    }
    return nodes
  };

  // Keep this dispatch intact: an array-only version regresses V8 benchmarks.
  const fmts = {
    text: toText$1,
    txt: toText$1,
    array: toArray$1,
    flat: toArray$1,
  };

  const out = function (root, label) {
    // return internal json
    if (label === 'nested' || label === 'json') {
      return root
    }
    if (label === 'debug') {
      console.log(toText$1(root, true)); // eslint-disable-line no-console
      return null
    }
    if (fmts.hasOwnProperty(label)) {
      return fmts[label](root)
    }
    return root
  };

  // The tag-inheritance subset of grad-school;
  // https://github.com/spencermountain/grad-school

  class Graph {
    constructor(json) {
      Object.defineProperty(this, 'json', {
        enumerable: false,
        value: json,
        writable: true,
      });
    }
    cache() {
      cacheParents(this.json);
      return this
    }
    fillDown() {
      fillDown(this.json);
      return this
    }
    out(fmt) {
      // fillDown changes properties, so the cached graph relationships still hold.
      return out(this.json, fmt)
    }
  }

  const graph = rows => new Graph(fromArray(rows));

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Connector: 'cyan',
    Determiner: 'cyan',
    Hyphenated: 'cyan',
    Adverb: 'cyan',
  };

  const getColor = function (node) {
    if (Object.hasOwn(colors, node.id)) {
      return colors[node.id]
    }
    if (Object.hasOwn(colors, node.is)) {
      return colors[node.is]
    }
    const found = node._cache.parents.find(c => colors[c]);
    return colors[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    nodes.forEach(node => {
      const { not, also, is, novel } = node.props;
      let parents = node._cache.parents;
      if (also) {
        parents = parents.concat(also);
      }
      res[node.id] = {
        is,
        not,
        novel,
        also,
        parents,
        children: [],
        color: getColor(node),
        // Retain the preferred output name for legacy model consumers.
        alias: node.aliases === undefined ? node.alias : node.aliases[0],
        aliases: node.aliases,
      };
    });
    // `also` is another inheritance edge. Resolve its ancestors before building
    // reverse edges, so removing any parent also removes all dependent tags.
    const resolved = new Set();
    const resolving = new Set();
    const resolveParents = function (tag) {
      if (resolved.has(tag)) {
        return res[tag].parents
      }
      if (resolving.has(tag)) {
        throw new Error(`compromise: cyclic tag inheritance at '${tag}'`)
      }
      resolving.add(tag);
      const parents = new Set();
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          resolveParents(parent).forEach(ancestor => parents.add(ancestor));
        }
        parents.add(parent);
      });
      res[tag].parents = Array.from(parents);
      resolving.delete(tag);
      resolved.add(tag);
      return res[tag].parents
    };
    Object.keys(res).forEach(tag => resolveParents(tag));
    Object.keys(res).forEach(tag => {
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          res[parent].children.push(tag);
        }
      });
    });

    // Inherit exclusions through every parent, then exclude all descendants of
    // each conflicting tag. Read a snapshot to keep this independent of order.
    const exclusions = {};
    Object.keys(res).forEach(tag => { exclusions[tag] = res[tag].not; });
    Object.keys(res).forEach(k => {
      const nots = new Set(exclusions[k]);
      res[k].parents.forEach(parent => {
        for (const not of exclusions[parent] || []) {
          nots.add(not);
        }
      });
      Array.from(nots).forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
      getTagSet(res[k].not);
      getTagSet(res[k].children);
      // Keep accepting custom definitions, but flag impossible combinations once
      // per tag, after both inheritance and reciprocal exclusions are resolved.
      const conflicts = [k, ...res[k].parents].filter(tag => nots.has(tag));
      if (conflicts.length > 0) {
        const names = conflicts.map(tag => `#${tag}`).join(', ');
        console.warn(`compromise: contradictory tag '#${k}' requires and excludes: ${names}`); // eslint-disable-line no-console
      }
    });
    return res
  };

  // Compile once per registration. Real tag names always take precedence.
  const compileAliases = (tags, normalize) => {
    const aliases = Object.create(null);
    Object.keys(tags).forEach(tag => { aliases[tag] = tag; });
    Object.keys(tags).forEach(tag => {
      const entry = tags[tag];
      const names = entry.aliases === undefined ? [entry.alias] : [entry.aliases].flat();
      names.forEach(name => {
        if (name === null || name === undefined) {
          return
        }
        if (typeof name !== 'string' || !/^[\p{L}_][\p{L}\p{M}\p{N}_-]*$/u.test(name)) {
          throw new Error(`compromise: invalid alias for '#${tag}'`)
        }
        // Match strings undergo Unicode normalization before parsing.
        const spellings = normalize ? [name, normalize(name)] : [name];
        spellings.forEach(spelling => {
          if (Object.hasOwn(tags, spelling)) {
            if (spelling !== name && spelling !== tag) {
              throw new Error(`compromise: tag alias '${name}' normalizes to '#${spelling}'`)
            }
            return
          }
          if (aliases[spelling] && aliases[spelling] !== tag) {
            throw new Error(`compromise: duplicate tag alias '${spelling}'`)
          }
          aliases[spelling] = tag;
        });
      });
    });
    return aliases
  };

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input.slice()
  };

  const addImplied = function (tags) {
    const aliases = compileAliases(tags);
    const resolve = tag => aliases[tag] || tag;
    Object.keys(tags).forEach(k => {
      // support deprecated fmts
      if (tags[k].isA) {
        tags[k].is = tags[k].isA;
      }
      if (tags[k].notA) {
        tags[k].not = tags[k].notA;
      }
      if (typeof tags[k].is === 'string') {
        tags[k].is = resolve(tags[k].is);
      }
      if (tags[k].also) {
        tags[k].also = toArr(tags[k].also).map(resolve);
      }
      if (tags[k].not) {
        tags[k].not = toArr(tags[k].not).map(resolve);
      }
      // add any implicit 'is' tags
      if (tags[k].is && typeof tags[k].is === 'string') {
        if (!Object.hasOwn(tags, tags[k].is)) {
          tags[tags[k].is] = {};
        }
      }
      // Additional parents need entries too, including parents introduced by plugins.
      toArr(tags[k].also).forEach(parent => {
        if (!Object.hasOwn(tags, parent)) {
          tags[parent] = {};
        }
      });
      // add any implicit 'not' tags
      toArr(tags[k].not).forEach(excluded => {
        if (!Object.hasOwn(tags, excluded)) {
          tags[excluded] = {};
        }
      });
    });
    return tags
  };


  const validate = function (tags, already) {
    // Reciprocal links must reach previously registered tags too. Copy entries
    // before normalization so the existing compiled model remains untouched.
    tags = Object.fromEntries(Object.keys({ ...already, ...tags }).map(tag => [tag, { ...already[tag], ...tags[tag] }]));
    tags = addImplied(tags);

    // property validation
    Object.keys(tags).forEach(k => {
      if (tags[k].aliases !== undefined) {
        tags[k].aliases = toArr(tags[k].aliases);
      }
      tags[k].children = toArr(tags[k].children);
      tags[k].not = toArr(tags[k].not);
      if (tags[k].also) {
        tags[k].also = toArr(tags[k].also);
      }
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      const nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not && !tags[no].not.includes(k)) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };

  // 'fill-down' parent logic inference
  const compute$1 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      const o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [], alias: o.alias, aliases: o.aliases?.slice() }
    });
    const graph$1 = graph(flatList).cache().fillDown();
    return graph$1.out('array')
  };

  const fromUser = function (tags) {
    Object.keys(tags).forEach(k => {
      tags[k] = { ...tags[k] };
      tags[k].novel = true;
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // Normalization owns its definitions, including when callers reuse a tagset.
    tags = Object.fromEntries(Object.entries(tags).map(([tag, definition]) => [tag, { ...definition }]));
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate(tags, already);

    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$1(tags);
    // convert it to our final format
    const res = fmt(nodes);
    return res
  };

  var methods$4 = {
    one: {
      setTag,
      unTag,
      addTags: addTags$1,
      canBe,
    },
  };

  /* eslint no-console: 0 */

  const fns = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      if (!this.found || !input) {
        return this
      }
      const terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, world } = this;
      // logger
      if (verbose === true) {
        console.log(' +  ', input, reason || '');
      }
      if (Array.isArray(input)) {
        input.forEach(tag => methods.one.setTag(terms, tag, world, isSafe, reason));
      } else {
        methods.one.setTag(terms, input, world, isSafe, reason);
      }
      // uncache
      this.uncache();
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      if (!this.found || !input) {
        return this
      }
      const terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, model } = this;
      // logger
      if (verbose === true) {
        console.log(' -  ', input, reason || '');
      }
      const tagSet = model.one.tagSet;
      const resolve = tag => {
        tag = tag.trim().replace(/^#/, '');
        return model.one.tagAliases[tag] || tag
      };
      if (Array.isArray(input)) {
        input.forEach(tag => methods.one.unTag(terms, resolve(tag), tagSet, reason));
      } else {
        methods.one.unTag(terms, resolve(input), tagSet, reason);
      }
      // uncache
      this.uncache();
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      tag = tag.replace(/^#/, '');
      tag = this.model.one.tagAliases[tag] || tag;
      const tagSet = this.model.one.tagSet;
      const canBe = this.methods.one.canBe;
      const nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          if (!canBe(term, tag, tagSet)) {
            nope.push([n, i, i + 1]);
          }
        });
      });
      const noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };

  const tagAPI = function (View) {
    Object.assign(View.prototype, fns);
  };

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const world = this.world();
    const { model, methods } = world;
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    const res = fn(tags, tagSet);
    const aliases = compileAliases(res, name => methods.one.killUnicode(name, world));
    model.one.tagSet = res;
    model.one.tagAliases = aliases;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !Object.hasOwn(tagSet, b)) {
        return 1
      }
      if (boringTags.has(b) || !Object.hasOwn(tagSet, a)) {
        return -1
      }
      let kids = tagSet[a].children || [];
      const aKids = kids.length;
      kids = tagSet[b].children || [];
      const bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    document.forEach(terms => {
      terms.forEach(term => {
        const tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
    });
  };

  var tag = {
    model: {
      one: { tagSet: {}, tagAliases: Object.create(null) }
    },
    compute: {
      tagRank
    },
    methods: methods$4,
    api: tagAPI,
    lib: lib$1
  };

  // Scan punctuation runs once. Searching for an unanchored run followed by
  // whitespace repeatedly rescans long runs that have no following whitespace.
  const stops = new Set('.!?\u203D\u2E18\u203C\u2047\u2048\u2049\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4\u3002');
  const cjkStops = new Set('。！？｡');
  const openers$1 = new Set('「『（【〔《〈“');
  const closers = new Set('」』）】〕》〉”');
  const whitespace = /\s/;
  const splitsOnly = /^[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。]+\s$/;
  const splitsOnlyCjk = /^(?:[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。！？｡]+\s|[。！？｡]+[」』）】〕》〉”]*)$/;
  const newLine = /((?:\r?\n|\r)+)/;

  const basicSplit = function (text) {
    const all = [];
    const isCjk = /[。！？｡]/.test(text);
    const activeStops = isCjk ? new Set([...stops, ...cjkStops]) : stops;
    for (const line of text.split(newLine)) {
      let start = 0;
      const arr = [];
      const emit = (from, end) => {
        arr.push(line.slice(start, from), line.slice(from, end));
        start = end;
      };
      let i = 0;
      while (i < line.length) {
        if (!activeStops.has(line[i])) {
          i++;
          continue
        }
        const runStart = i;
        while (i < line.length && activeStops.has(line[i])) i++;
        if (i < line.length && whitespace.test(line[i])) {
          emit(runStart, i + 1);
          i++;
          continue
        }
        if (!isCjk) continue
        // A CJK stop ends a sentence without whitespace. Following closing quotes
        // only end it when followed by whitespace, another opener, or end of text.
        let j = runStart;
        while (j < i) {
          if (!cjkStops.has(line[j])) {
            j++;
            continue
          }
          const from = j;
          while (j < i && cjkStops.has(line[j])) j++;
          let end = j;
          while (end < line.length && closers.has(line[end])) end++;
          if (end === j || end === line.length || whitespace.test(line[end]) || openers$1.has(line[end])) {
            emit(from, end);
            if (end > i) i = end;
          }
        }
      }
      arr.push(line.slice(start));
      // Preserve the existing merge behavior, including punctuation-only pieces.
      for (let k = 0; k < arr.length; k++) {
        const next = arr[k + 1];
        if (next && (isCjk ? splitsOnlyCjk : splitsOnly).test(next)) {
          arr[k] += next;
          arr[k + 1] = '';
        }
        if (arr[k]) all.push(arr[k]);
      }
    }
    return all
  };

  // a letter, number, or symbol/emoji in any script - otherwise it's only punctuation
  const hasLetter$1 = /[\p{L}\p{N}\p{So}]/u;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    const chunks = [];
    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (hasSomething$1.test(s) === false || hasLetter$1.test(s) === false) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          splits[i + 1] = s + splits[i + 1];
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(s);
    }
    return chunks
  };

  const hasNewline = function (c) {
    return Boolean(/\n$/.test(c))
  };

  //loop through these chunks, and join the non-sentence chunks back together..
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    const sentences = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && !isSentence(c, abbrevs) && !hasNewline(c)) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    return sentences
  };

  /* eslint-disable regexp/no-dupe-characters-character-class */

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.'
  const MAX_QUOTE = 280;// ¯\_(ツ)_/¯

  // don't support single-quotes for multi-sentences
  const pairs = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    // '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    // '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    // '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes'
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    // '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
    '\u300C': '\u300D', // 'CornerBrackets' 「」
    '\u300E': '\u300F', // 'WhiteCornerBrackets' 『』
  };
  const openQuote = RegExp('[' + Object.keys(pairs).join('') + ']', 'g');
  const closeQuote = RegExp('[' + Object.values(pairs).join('') + ']', 'g');

  const closesQuote = function (str) {
    if (!str) {
      return false
    }
    const m = str.match(closeQuote);
    if (m !== null && m.length === 1) {
      return true
    }
    return false
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      // do we have an open-quote and not a closed one?
      const m = split.match(openQuote);
      if (m !== null && m.length === 1) {
        // is the quote already closed in this chunk? - '“Yes!” said Tom. “No!” said Ann.'
        const closed = split.match(closeQuote);
        if (closed !== null && closed[0] !== m[0]) {
          arr.push(split);
          continue
        }

        // look at the next sentence for a closing quote,
        if (closesQuote(splits[i + 1]) && splits[i + 1].length < MAX_QUOTE) {
          splits[i] += splits[i + 1];// merge them
          arr.push(splits[i]);
          splits[i + 1] = '';
          i += 1;
          continue
        }
        // look at n+2 for a closing quote,
        if (closesQuote(splits[i + 2])) {
          const toAdd = splits[i + 1] + splits[i + 2];// merge them all
          //make sure it's not too-long
          if (toAdd.length < MAX_QUOTE) {
            splits[i] += toAdd;
            arr.push(splits[i]);
            splits[i + 1] = '';
            splits[i + 2] = '';
            i += 2;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen = /[(\uFF08]/g;
  const hasClosed = /[)\uFF09]/g;
  const mergeParens = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      const m = split.match(hasOpen);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          const m2 = splits[i + 1].match(hasClosed);
          if (m2 !== null && m.length === 1 && !hasOpen.test(splits[i + 1])) {
            // merge in 2nd sentence
            splits[i] += splits[i + 1];
            arr.push(splits[i]);
            splits[i + 1] = '';
            i += 1;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;

  const splitSentences = function (text, world) {
    text ||= '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return []
    }
    // First do a greedy-split..
    const splits = basicSplit(text);
    // Filter-out the crap ones
    let sentences = notEmpty(splits);
    //detection of non-sentence chunks:
    sentences = smartMerge(sentences, world);
    // allow 'he said "no sir." and left.'
    sentences = quoteMerge(sentences);
    // allow 'i thought (no way!) and left.'
    sentences = mergeParens(sentences);
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      const ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };

  // combine '2 - 5' like '2-5' is
  // 2-4: 2, 4
  const combineRanges = function (arr) {
    const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/;
    const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
    for (let i = 0; i < arr.length - 1; i += 1) {
      if (arr[i + 1] && startRange.test(arr[i]) && endRange.test(arr[i + 1])) {
        arr[i] = arr[i] + arr[i + 1];
        arr[i + 1] = null;
      }
    }
    return arr
  };

  const isSlash = /\p{L} ?\/ ?\p{L}+$/u;

  // 'he / she' should be one word
  const combineSlashes = function (arr) {
    for (let i = 1; i < arr.length - 1; i++) {
      if (isSlash.test(arr[i])) {
        arr[i - 1] += arr[i] + arr[i + 1];
        arr[i] = null;
        arr[i + 1] = null;
      }
    }
    return arr
  };

  const wordlike = /\S/;
  const isBoundary = /^[!?.]+$/;
  const naiiveSplit = /(\S+)/;

  let notWord = [
    '.',
    '?',
    '!',
    ':',
    ';',
    '-',
    '–',
    '—',
    '--',
    '...',
    '(',
    ')',
    '[',
    ']',
    '"',
    "'",
    '`',
    '«',
    '»',
    '*',
    '•',
  ];
  notWord = notWord.reduce((h, c) => {
    h[c] = true;
    return h
  }, {});

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str ||= '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (Array.isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen$1(words[i], model) === true) {
        arr = arr.concat(splitHyphens$1(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      const word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) === true && Object.hasOwn(notWord, word) === false && isBoundary.test(word) === false) {
        //put whitespace on end of previous term, if possible
        if (result.length > 0) {
          result[result.length - 1] += carry;
          result.push(word);
        } else {
          //otherwise, but whitespace before
          result.push(carry + word);
        }
        carry = '';
      } else {
        carry += word;
      }
    }
    //handle last one
    if (carry) {
      if (result.length === 0) {
        result[0] = '';
      }
      result[result.length - 1] += carry; //put it on the end
    }
    // combine 'one / two'
    result = combineSlashes(result);
    result = combineRanges(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation

  //we have slightly different rules for start/end - like #hashtags.
  const isLetter = /\p{Letter}/u;
  const isNumber$1 = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;
  const isFullNumber = /^[(+\-]?\d+(th|st|nd|rd)?[)+\-]?$/;
  const openers = { ')': '(', ']': '[', '}': '{' };

  // does this closing bracket close one inside the word, like 'foo(bar)'
  const closesInside = function (chars, start, end) {
    const close = chars[end - 1];
    let depth = 0;
    for (let i = start; i < end - 1; i += 1) {
      if (chars[i] === openers[close]) {
        depth += 1;
      } else if (chars[i] === close) {
        depth -= 1;
      }
    }
    return depth > 0
  };

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    const { prePunctuation, postPunctuation, emoticons } = model.one;
    const original = str;
    let pre = '';
    let post = '';
    const chars = Array.from(str);
    let start = 0;
    let end = chars.length;

    // punctuation-only words, like '<3'
    if (Object.hasOwn(emoticons, str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // Locate the first retained code point without shifting the array.
    while (start < end) {
      const c = chars[start];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        break//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(str.trim())) {
        break//done
      }
      // '97 - year short-form
      if (c === "'" && c.length === 3 && isNumber$1.test(chars[start + 1])) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber$1.test(c)) {
        break //done
      }
      // punctuation
      start++;
    }

    // Locate the last retained code point.
    while (end > start) {
      const c = chars[end - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        break//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber$1.test(c)) {
        break //done
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original) === true) {
        break//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original) === true) {
        break//keep it
      }
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(str.trim())) {
        break//done
      }
      if (Object.hasOwn(openers, c) && closesInside(chars, start, end)) {
        break//keep it
      }
      // punctuation
      end--;
    }
    pre = chars.slice(0, start).join('');
    post = chars.slice(end).join('');
    str = chars.slice(start, end).join('');
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      let last = original.length;
      while (last > 0 && original[last - 1] === ' ') last--;
      post = original.slice(last);
      str = original.slice(0, last);
      pre = '';
    }
    return { str, pre, post }
  };

  const parseTerm = (txt, model) => {
    // cleanup any punctuation as whitespace
    const { str, pre, post } = normalizePunctuation(txt, model);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };

  // 'Björk' to 'Bjork'.
  const killUnicode = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str ||= '';
    const chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };

  // Inspect the trailing run once, including when punctuation occurs internally.
  const trimPunctuation = (str, punctuation) => {
    let end = str.length;
    while (end > 0 && punctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str ||= '';
    str = str.toLowerCase();
    str = str.trim();
    const original = str;
    //punctuation
    str = trimPunctuation(str, /[,;.!?]/);
    //coerce Unicode ellipses
    str = str.replaceAll('…', '...');
    //en-dash
    str = str.replaceAll('–', '-');
    //strip leading & trailing grammatical punctuation
    if (/^[:;]/.test(str) === false) {
      str = trimPunctuation(str, /[",.!:;?)]/);
      str = str.replace(/^['"(]+/g, '');
    }
    // remove zero-width characters
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
    //do this again..
    str = str.trim();
    //oh shucks,
    if (str === '') {
      str = original;
    }
    //no-commas in numbers
    str = str.replace(/([0-9]),([0-9])/g, '$1$2');
    return str
  };

  // do acronyms need to be ASCII?  ... kind of?
  const periodAcronym$1 = /^([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /^[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /^([a-z]\.)+[a-z]\.?$/;

  const isAcronym$2 = function (str) {
    //like N.D.A
    if (periodAcronym$1.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym$1.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym$1.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym$1.test(str) === true) {
      return true
    }
    return false
  };

  const doAcronym = function (str) {
    if (isAcronym$2(str)) {
      str = str.replace(/\./g, '');
    }
    return str
  };

  const normalize = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = clean(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = killUnicode(str, world);
    str = doAcronym(str);
    term.normal = str;
  };

  // turn a string input into a 'document' json format
  const parse = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input ||= '';
    // split into sentences
    const sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(t => splitWhitespace(t, model));
      // add normalized term format, always
      terms.forEach((t) => {
        normalize(t, world);
      });
      return terms
    });
    return input
  };

  const isAcronym$1 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse = /(?:\u2026|\.{2}) *$/; // '...'
  const hasLetter = /\p{L}/u;
  const hasPeriod = /\. *$/;
  const leadInit = /^[A-Z]\. $/; // "W. Kensington"

  /** does this look like a sentence? */
  const isSentence = function (str, abbrevs) {
    // must have a letter
    if (hasLetter.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) === true) {
      return false
    }
    // check for leading initial - "W. Kensington"
    if (str.length === 3 && leadInit.test(str)) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str) === true) {
      return false
    }
    const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    const words = txt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.' (and not mr?)
    if (Object.hasOwn(abbrevs, lastWord) === true && hasPeriod.test(str) === true) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };

  var methods$3 = {
    one: {
      killUnicode,
      tokenize: {
        splitSentences,
        isSentence,
        splitTerms: splitWords,
        splitWhitespace: parseTerm,
        fromString: parse,
      },
    },
  };

  const aliases = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };

  var misc$1 = [
    'approx',
    'apt',
    'bc',
    'cyn',
    'eg',
    'esp',
    'est',
    'etc',
    'ex',
    'exp',
    'prob', //probably
    'pron', // Pronunciation
    'gal', //gallon
    'min',
    'pseud',
    'fig', //figure
    'jd',
    'lat', //latitude
    'lng', //longitude
    'vol', //volume
    'fm', //not am
    'def', //definition
    'misc',
    'plz', //please
    'ea', //each
    'ps',
    'sec', //second
    'pt',
    'pref', //preface
    'pl', //plural
    'pp', //pages
    'qt', //quarter
    'fr', //french
    'sq',
    'nee', //given name at birth
    'ss', //ship, or sections
    'tel',
    'temp',
    'vet',
    'ver', //version
    'fem', //feminine
    'masc', //masculine
    'eng', //engineering/english
    'adj', //adjective
    'vb', //verb
    'rb', //adverb
    'inf', //infinitive
    'situ', // in situ
    'vivo',
    'vitro',
    'wr', //world record
  ];

  var honorifics = [
    'adj',
    'adm',
    'adv',
    'asst',
    'atty',
    'bldg',
    'brig',
    'capt',
    'cmdr',
    'comdr',
    'cpl',
    'det',
    'dr',
    'esq',
    'gen',
    'gov',
    'hon',
    'jr',
    'llb',
    'lt',
    'maj',
    'messrs',
    'mlle',
    'mme',
    'mr',
    'mrs',
    'ms',
    'mstr',
    'phd',
    'prof',
    'pvt',
    'rep',
    'reps',
    'res',
    'rev',
    'sen',
    'sens',
    'sfc',
    'sgt',
    'sir',
    'sr',
    'supt',
    'surg'
    //miss
    //misses
  ];

  var months = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

  var nouns$2 = [
    'ad',
    'al',
    'arc',
    'ba',
    'bl',
    'ca',
    'cca',
    'col',
    'corp',
    'ft',
    'fy',
    'ie',
    'lit',
    'ma',
    'md',
    'pd',
    'tce',
  ];

  var organizations = ['dept', 'univ', 'assn', 'bros', 'inc', 'ltd', 'co'];

  var places = [
    'rd',
    'st',
    'dist',
    'mt',
    'ave',
    'blvd',
    'cl',
    // 'ct',
    'cres',
    'hwy',
    //states
    'ariz',
    'cal',
    'calif',
    'colo',
    'conn',
    'fla',
    'fl',
    'ga',
    'ida',
    'ia',
    'kan',
    'kans',

    'minn',
    'neb',
    'nebr',
    'okla',
    'penna',
    'penn',
    'pa',
    'dak',
    'tenn',
    'tex',
    'ut',
    'vt',
    'va',
    'wis',
    'wisc',
    'wy',
    'wyo',
    'usafa',
    'alta',
    'ont',
    'que',
    'sask',
  ];

  // units that are abbreviations too
  var units = [
    'dl',
    'ml',
    'gal',
    // 'ft', //ambiguous
    'qt',
    'pt',
    'tbl',
    'tsp',
    'tbsp',
    'km',
    'dm', //decimeter
    'cm',
    'mm',
    'mi',
    'td',
    'hr', //hour
    'hrs', //hour
    'kg',
    'hg',
    'dg', //decigram
    'cg', //centigram
    'mg', //milligram
    'µg', //microgram
    'lb', //pound
    'oz', //ounce
    'sq ft',
    'hz', //hertz
    'mps', //meters per second
    'mph',
    'kmph', //kilometers per hour
    'kb', //kilobyte
    'mb', //megabyte
    // 'gb', //ambig
    'tb', //terabyte
    'lx', //lux
    'lm', //lumen
    // 'pa', //ambig
    'fl oz', //
    'yb',
  ];

  // add our abbreviation list to our lexicon
  const list = [
    [misc$1],
    [units, 'Unit'],
    [nouns$2, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  const abbreviations = {};
  // add them to a future lexicon
  const lexicon$2 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations[w] = true;
      // future-lexicon
      lexicon$2[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$2[w] = [lexicon$2[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history'
  var prefixes = [
    'anti',
    'bi',
    'co',
    'contra',
    'de',
    'extra',
    'infra',
    'inter',
    'intra',
    'macro',
    'micro',
    'mis',
    'mono',
    'multi',
    'peri',
    'pre',
    'pro',
    'proto',
    'pseudo',
    're',
    'sub',
    'supra',
    'trans',
    'tri',
    'un',
    'out', //out-lived
    'ex',//ex-wife

    // 'counter',
    // 'mid',
    // 'out',
    // 'non',
    // 'over',
    // 'post',
    // 'semi',
    // 'super', //'super-cool'
    // 'ultra', //'ulta-cool'
    // 'under',
    // 'whole',
  ].reduce((h, str) => {
    h[str] = true;
    return h
  }, {});

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'
  var suffixes$1 = {
    'like': true,
    'ish': true,
    'less': true,
    'able': true,
    'elect': true,
    'type': true,
    'designate': true,
    // 'fold':true,
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E
  const compact$1 = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗễ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇіїi̇',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'ÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  const unicode$1 = {};
  Object.keys(compact$1).forEach(function (k) {
    compact$1[k].split('').forEach(function (s) {
      unicode$1[s] = k;
    });
  });
  // fullwidth ascii - 'Ｈｅｌｌｏ ２０２４' to 'Hello 2024'
  for (let i = 0x21; i <= 0x7E; i += 1) {
    unicode$1[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
  }

  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7Bpunctuation%7D

  // punctuation to keep at start of word
  const prePunctuation = {
    '#': true, //#hastag
    '@': true, //@atmention
    '_': true,//underscore
    '°': true,
    // '+': true,//+4
    // '\\-',//-4  (escape)
    // '.',//.4
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  // punctuation to keep at end of word
  const postPunctuation = {
    '%': true,//88%
    '_': true,//underscore
    '°': true,//degrees, italian ordinal
    // '\'',// sometimes
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  const emoticons = {
    '<3': true,
    '</3': true,
    '<\\3': true,
    ':^P': true,
    ':^p': true,
    ':^O': true,
    ':^3': true,
  };

  var model$3 = {
    one: {
      aliases,
      abbreviations,
      prefixes,
      suffixes: suffixes$1,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$2, //give this one forward
      unicode: unicode$1,
      emoticons
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    const str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (Object.hasOwn(aliases, str)) {
      term.alias ||= [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      const arr = str.split(hasSlash);
      // don't split urls and things
      if (arr.length <= 3) {
        arr.forEach(word => {
          word = word.trim();
          if (word !== '') {
            term.alias ||= [];
            term.alias.push(word);
          }
        });
      }
    }
    // aliases for apostrophe-s
    // if (hasApostrophe.test(str)) {
    //   let main = str.replace(hasApostrophe, '').trim()
    //   term.alias = term.alias || []
    //   term.alias.push(main)
    // }
    return term
  };

  const hasDash = /^\p{Letter}+-\p{Letter}+$/u;
  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (hasDash.test(str)) {
      str = str.replace(/-/g, '');
    }
    //#tags, @mentions
    str = str.replace(/^[#@]/, '');
    if (str !== term.normal) {
      term.machine = str;
    }
  };

  // sort words by frequency
  const freq = function (view) {
    const docs = view.docs;
    const counts = Object.create(null);
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        counts[word] ??= 0;
        counts[word] += 1;
      }
    }
    // add counts on each term
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        term.freq = counts[word];
      }
    }
  };

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    const docs = view.document; //start from the actual-top
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        term.offset = {
          index: index,
          start: elapsed + term.pre.length,
          length: term.text.length,
        };
        elapsed += term.pre.length + term.text.length + term.post.length;
        index += 1;
      }
    }
  };

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    // console.log('reindex')
    const document = view.document;
    for (let n = 0; n < document.length; n += 1) {
      for (let i = 0; i < document[n].length; i += 1) {
        document[n][i].index = [n, i];
      }
    }
    // let ptrs = b.fullPointer
    // console.log(ptrs)
    // for (let i = 0; i < docs.length; i += 1) {
    //   const [n, start] = ptrs[i]
    //   for (let t = 0; t < docs[i].length; t += 1) {
    //     let term = docs[i][t]
    //     term.index = [n, start + t]
    //   }
    // }
  };

  const wordCount = function (view) {
    let n = 0;
    const docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        if (docs[i][t].normal === '') {
          continue //skip implicit words
        }
        n += 1;
        docs[i][t].wordCount = n;
      }
    }
  };

  // cheat-method for a quick loop
  const termLoop = function (view, fn) {
    const docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        fn(docs[i][t], view.world);
      }
    }
  };

  const methods$2 = {
    alias: (view) => termLoop(view, addAliases),
    machine: (view) => termLoop(view, doMachine),
    normal: (view) => termLoop(view, normalize),
    freq,
    offset,
    index,
    wordCount,
  };

  var tokenize = {
    compute: methods$2,
    methods: methods$3,
    model: model$3,
    hooks: ['alias', 'machine', 'index', 'id'],
  };

  // const plugin = function (world) {
  //   let { methods, model, parsers } = world
  //   Object.assign({}, methods, _methods)
  //   Object.assign(model, _model)
  //   methods.one.tokenize.fromString = tokenize
  //   parsers.push('normal')
  //   parsers.push('alias')
  //   parsers.push('machine')
  //   // extend View class
  //   // addMethods(View)
  // }
  // export default plugin

  // lookup last word in the type-ahead prefixes
  const typeahead$1 = function (view) {
    const prefixes = view.model.one.typeahead;
    const docs = view.docs;
    if (docs.length === 0 || Object.keys(prefixes).length === 0) {
      return
    }
    const lastTerm = docs.at(-1)?.at(-1);
    // if we've already put whitespace, end.
    if (!lastTerm || lastTerm.post) {
      return
    }
    // if we found something
    if (Object.hasOwn(prefixes, lastTerm.normal)) {
      const found = prefixes[lastTerm.normal];
      // add full-word as an implicit result
      lastTerm.implicit = found;
      lastTerm.machine = found;
      lastTerm.typeahead = true;
      // tag it, as our assumed term
      if (view.compute.preTagger) {
        view.last().unTag('*').compute(['lexicon', 'preTagger']);
      }
    }
  };

  var compute = { typeahead: typeahead$1 };

  // assume any discovered prefixes
  const autoFill = function () {
    const docs = this.docs;
    if (docs.length === 0) {
      return this
    }
    const term = docs.at(-1)?.at(-1);
    if (term?.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$4 = function (View) {
    View.prototype.autoFill = autoFill;
  };

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    const collisions = [];
    const existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        const prefix = str.substring(0, size);
        // ensure prefix is not a word
        if (opts.safe && Object.hasOwn(world.model.one.lexicon, prefix)) {
          continue
        }
        // does it already exist?
        if (Object.hasOwn(existing, prefix) === true) {
          collisions.push(prefix);
          continue
        }
        if (Object.hasOwn(index, prefix) === true) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = { ...existing, ...index };
    // remove ambiguous-prefixes
    collisions.forEach((str) => {
      delete index[str];
    });
    return index
  };

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    const model = this.model();
    opts = { ...defaults, ...opts };
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    const prefixes = getPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (Object.hasOwn(model.one.typeahead, str)) {
        delete model.one.typeahead[str];
        return
      }
      model.one.typeahead[str] = prefixes[str];
    });
    return this
  };

  var lib = {
    typeahead: prepare
  };

  const model$2 = {
    one: {
      typeahead: {} //set a blank key-val
    }
  };
  var typeahead = {
    model: model$2,
    api: api$4,
    lib,
    compute,
    hooks: ['typeahead']
  };

  // order here matters
  nlp.extend(change); //0kb
  nlp.extend(output); //0kb
  nlp.extend(match); //10kb
  nlp.extend(pointers); //2kb
  nlp.extend(tag); //2kb
  nlp.plugin(plugin); //~6kb
  nlp.extend(tokenize); //7kb
  nlp.extend(freeze); //
  nlp.plugin(cache$1); //~1kb
  nlp.extend(lookup); //7kb
  nlp.extend(typeahead); //1kb
  nlp.extend(lexicon$3); //1kb
  nlp.extend(sweep); //1kb

  // generated in ./lib/lexicon
  var lexData = {
    "Conjunction": "true¦:e4in,o3s0u,y;a1e0;cnotne,up;m,rtneim;!dnauc,moc,nis,rep;!uq0;!nua,rop",
    "Determiner": "true¦a8c7e4lAmuchAning2otrDpocAsuEt1un0variB;!aDos;ant8odB;un0ún;a,o;l,s0;a8e,os,t0;a7e,os;ada,ualquier;lg3mb2quel0;!l0;a3os;as,os;un0ún;a0o0;!s",
    "Preposition": "true¦:aFe2n0otpecxe,rop,sart;e,is,oc0úges;! odreuca A;d2r1tna0;!idem,rud;bos,t9;! 0s6;a6etn4o2r1s0;etna,ámeda;asep a,odeder1;dal 0jab2rtn2;la;al0e9;ed;crec,mic0reuf;ne;! 2ic1r0ts1;ap,t3;ah;etne2ot0;cepser 0nuj;noc;rf",
    "Pronoun": "true¦cuEdonde,eBleDm9n4quien,s3t2ustedFv1yo,é0;l,ste;oso5u3;e,i,uy9ú;e,uy8í;os1u0;estr6;!o0;tr0;as,os;e,í0;!a2o2;ll0sto;a0o0;!s;al0yo;!es",
    "Adverb": "true¦:!1:#$%&()*+-./<:ne,ce,is,ed,se,rt,na,ni,re,oc,at,pm;a1KeM%ac,lam,nKoA-ya,s4y3zev alIá1í0;ha,l1sa,uqa;l0z4;la;oh,um;a#pa,e4o3á0éups&;m1)a,z0;iuq;!aj,&a;jel,#m4;cnot#5t*;cop8d6g5hcum,ira)n. le4jaba,l3msim%a,)#d,sulc+,t0;*0(upus3;t0uc;! ol1;<eje0ós; rZ;eul,la;a%am&,rob0; a;! a .Vm/;/,eib,ua,éi0úa;bm/,$r;dr/,hco*,r<e%,tn0;a0Sem0;aTeHl3núm.,r0;alu1oi-t0;*,sO;citrCpN;a0icáf;col,er,ic9mro8n5pic+rp,r3t2u0;darg,gi,*,su,t0;ca,ibah,#ve;#madnBot;e0utan;#g,til;i1oi0;cida),saco;f,giro;f,n;ep(,i1#(,r0;ap;fo,+;l6t0;n1-0;uf;/7e0;i0rapa,u$rf;c0d#p&O;er,ifH;b0<%;a1%0;op;boXr&i0ton;snF;ciUdQenátlum%,h$PiMlos,rIsi$VtAu9v0;eun,i0;s5t0;a1$ps3i+f0;&;cifingZl1)si+m0;da;er;e0ulcL;c2rgoM;gitP+tn4;aidem6c4e2la,n1(up0;us;el,ujn1;l<0rcn0;.;aDe0i9;f-p,rid;+;a2eg1u0;ges,p;il;lc,r;l<a,po8ra0ve8;($n,tiroy0;am;)6;am0ipár,nufo4;e)1ixor0;pa;xe;fí$p1lbúp,móno$,nú,pít,rótsih,sáb,tcá0;rp;(;l&0tsab;!a;*;/;birra,c-c,didem *rg3eníl3ic#u$sn.3r0y,ívadot;e0oha;iuq0uf;%; #",
    "Ordinal": "true¦:!1:#:misé;a#nQo0;dnugesNmi4nevon6re2t1vatco0;!m6;niuq4rauc1xes4;cret0mirpK;! o#giv,om3;cédHsé3t0;pés0és;!om0;iced;g6lim3nGtne0;c1gni0;nArd9tp8uq;!i2ud,x7;!ort7s0;e0od;rt;a1i8ni0o0;tco;n3rd2u0x1;cniuq,tp0;es;auc;on;!nu,oud;! o#gi0;rt,v;ollim",
    "Cardinal": "true¦:atnPeGlFnEoAs0zL;e7i6o0értiCódiC;d,tnei0;c0niL;e2o1s0;eLiPod;hQrtP;tNvL;es,ésiB;nolli0rt;b,m;cnic1hco7nu1r0tneI;ec,tauc0;!i0;tn6;eEóll0;im;c5t0veun1;eis0n2;!i0;c1tn0;iev;eid;e3n0od,rotac;i0o;uq;e1ie0;rt;h4r3s2t2ucn1v0;on;ic;es;auc;co",
    "Unit": "true¦bHceFeDfahrenheitIgBhertz,jouleIk8liGm6p4terEy2z1°0µs;c,f,n;b,e1;b,o0;ttA;e0ouceD;rcent,t8;eg7il0³,è9;eAlili8;elvin9ilo1m0;!/h,s;!b6gr1mètre,s;ig2r0;amme5;b,x0;ab2;lsius,ntimè0;tre1;yte0;!s",
    "Month": "true¦:erb5lirba,o0;i2re1tsoga,y0zr0;am;ne,rbef;l0n0;uj;mei0utco;cid,tpes,von",
    "WeekDay": "true¦domingo,juev1lun1m0sábado,viern1;art0iércol0;es",
    "Copula": "true¦eAfu5s0érE;e2i1o0;is,mPn,y;do,endo;a0d,rJáis;!mMn,s;e1i0ér8;!mKsC;!r0;a0on;is,n,s;rHs0;!t0;a9emEoy,uv2á0éG;!b0is,n,s;amC;e,i0o;e3mAs2é0;r0sem9;am8em8;te5;r0se8;a7e7on;ba6do,m4r0;em3á2é1ía0;!is,m2n,s;!is;!n,s;os;a0es;!is,n,s",
    "Auxiliary": "true¦h0;a3e2ub0;e,i0o;eron,mAste8;!m9;!b2n,s,y0;a0á2;!m6n,s;er,r1é0ía2;is;em3á2é1ía0;!is,m2n,s;!is;!n,s;os",
    "Modal": "true¦:aCe6n5o4s0és;aBe5i1om0;aAe1;a9é0;b7dBlos,re4;b9d5l4r2;a6e0;b4d3l2r0;ei0;uq;eus;eup;as,ed;ír0;d1eb0;ed;op",
    "Infinitive": "true¦:!1:#$%&()*+./<=>?@[]^_`~:er,ne,xe,ed,oc,ni,la,se,ro,us,na,id,ba,ar,sa,om,re,me,ma,da,uq;0:UN;1:UZ;2:V8;3:UO;4:QR;5:V7;6:TV;7:SM;8:U5;9:UF;A:UI;B:VD;C:TW;D:RQ;E:UC;F:T1;G:V3;H:US;I:TS;J:V6;esrVHon[,rKtimov;a60e2TiRopMíKôp;#Ko;!f,nI;eNmMo3WsL/K%;!+2;=,<C;i,(U3;d,rP2;!a2Ib2Cc26d1Sg1El19m14n10p0Xr0Jssot,t01uPvNzudMñKügH;eKurg;r,t;aCe27nFor26;!iv2Vo2]Kuo;h,s,t9;birtQPgSh,lO)mGCq.t%,rLssop,titsK;bBeOYnM/;!f/u,tsK;bo,&,nK;i,(4;cMfL=,oK;p,ve;!a,);nF%;esL)tK;s8%;!n0o2rAso2;aZcelf5eXimVnSrPsLucK;),]p5s8;evMiK;sK%I5;a,bBeOJnFrA@;!#,);apLevKuc;`,#,=,nF;!#,mF;a5SeK;m7sK;!e2n0+2;`,eLS=,o,rAsK;aC<C;lf5pKrr1;#,m0;bKl;!&,m0;!ap,bVdup,eRfBgen1i~QoOpNrKtun;os,uK;>,cK;#,n0o,sPU;muc,/;lKm;f,(;`,);`,fLgKhDXs9~5;!=,),/;!a,eK=,nFo2rSFsPN;d9rMQ;a4(7EucK;!$,sP;luc6murrLsK;&,uc;et9i;ab,evMifL]GQuK;!#,p;&4;!e2n0rS5;eJRiL.d,/K;!a,#MFn0@;d5rK%;=,pK;eNGmFo,/,%;aNepMoLpK;mucPY/;>,g3m1p;#,%;f,sEW;aWeViSnPrLuK;f,r;eK/4;mLvK;=,n0;bBe,/;iKu;f,rKtQA;f9ts5;d5lLrK%;e,=4r0;fOX(;le,rFN;!#,(,rRH;aVeSiPnMolpCKuK;alEca19lK;a,e,i7;ap%,#,icsNuK;fKh;!=,nF;cLl0sKv8;#LL;&,)G9;m,pLrgK;a,#,o2;!mi7s1%;/KvECña;=,rAs8;&Orap6uK;dKl;a1YeLnForK;p4t9;d,r,s;!?RSe2lD$b;e3SiKmucB/;cNhM),o2rcsK%;eK),/;!d,#;o2%;#,rA;c,rtLsK;!+DR;!a,bBnHRs8%;a2Ob2Kc1Pd17e16g13h10jet,l0Xm0Un0Mo0Lpmor0Jr0Ds0Bt04ug],vQ%m,zKñat;aL=K(;!?RGe2n0;fLrK;p,t;!#,sK;&,itas;!aWeRivQloNoLrK;ef,os>;hc,ll,mKrp;!#,n0o2;sLvK;!eLR$7;>,#,=,s8;!#LLn0;d,rKt<;!csKp;bBeLnK;aCi;!d,#,rp;ce2#,h;!abPbo,eLn07]vKsB;!bB#,nFrA;d,mLrK;!r1t3;!bB#,oK;cOKrpJVs;!a,&,m0;!oK;c,t;c,e~4fIrK;aNoK;cKm;!eL6nFoKrA+;!s;b,v;!rK;et9(;d,m,rDQ;etOopK;!#,mMoLrPJsK/,%;=,op;!rp;i,(7;!bo,eLnKsI;am,(;d,r58;al,eK(;g,rKt;p6t;!av,eLoK;!d,mPKs;p5r;c$Ll(K;!a,#,$,+;!e2;eL<rK(AF]^;!>,tN1;le,r,to2;l,rc,sop,vo2;eYnLop,rK;a,ep,[;eLoK;c6psD0;cR#pQfPpNrLtKv4;!a,e2$,+,%;!pK;!a4mMNrI;&,sK;&,/;&,o;a,#,mMJrB;a4$,sK;aK&,<C;!rt;cKf;!a,ca,e2n0orKrOJ/,%;p,t5;a0DeR$QoPrNsK;an4eK;d,$vuj5rK;cOQolf;e6LotK;!n0s8;c,nA8;trAvDJ;d03fMHh02jHRlZmYnWo`,p.t3rNtM~K;aKir3+,uol3;!lf3rf3;!eEnoG._,@>4;aQc,doEePfo,ga^,oN.>,uK;csLdKf3;a_,$;bo,e,o;lf,vK;af,*;fo,m,p;c,lc6pK;!aDJm0;amKeOY.f;a,rA;eK9.`;aLbKebKlLX[a;at68;f,t.f,ve2;lH8nG2;aKebo7<l1C;p,rga7;fsitas,hD9lpHLn4y;aMeK_l,.s>;bIYcKd;#,n0rA;c,s;c4rtK;!a,n0s8%;bOEcLPdKGeJ9fJ2gHXhGTiFDjEVlD8mCNnAPoAEp9Yr78s69t2Xu2Jv21x1Vy1Tz01çPñK;aMeKos,uG;pmMFsK;=,$;b,d,g3pmoGrtK;$7%;aTeSiR*QnMoLrKulI;afs8of4;b6c,`,m*,rt;aKugab;c*,d,lKva;!abK;!?NZ;c,#;!drG7ta;mFDpoCr&3;c,d._,e_,gL8rK;abGU>,t;a17e14iP*4nNoM.LuK;ac3rc;f4m*;b6g,llIrts1;aKem0ogr6T;c*,ifa,l4va;!?3c.%,dnufo2l07m04nXrQtLvaK;rc6/;aNeL<Konpih,._,uab;rag;fo2rKt)s;cn0;b,f3motua,pmis,rc6Zvi2;aOeMitas,oK]ta,tacic;getJ*v7^m,pav,r5HtK;in[,ua;tKvlup;c?JuJ;ili_f,luK;c=ir,g5;aPeOm&9oL]K;d[,t?fn0;l0mraLrKt)s;c)s,`p;!h;bIH_;g.4muh,rg;an8iKon(e,.finu;)m,tKxD;o,po;aSiLoKs1ucatsbo;bmis,pon[;bMga,]t6tL~JAvK;ic,[;]f,u4;aKis$s,[;snoLtK;n0+7;ps5;cZ#,gel,iXm.WnRrOtiNuLvK;ir;div=9siv,tK;a,ca;g8pJv5;ap,eLtK;$c7uen;bil,$g;aBBep,iNoK;icKsrA;aKutits9;n,r;f,grDs;f,n;cK]tD;i9os,]m0;oKsif;f,l;>c3lJHpLrK;!&3psEJ;^,oC;c,gl&a,hc5lL$_,rKv;>,fs8t;$,pK;a,^5s1;aKoE;lsIrbBs3;aOeNiLuK;orfa,p;aK&,fJPl;b1Xc3;d9<;l5rg3;aXeUiP*s,oMrKuol;esKuc;bo,#F8n0;c6nLrpKs1;!a,#,m0;#,i,);hcHrNtMuKva4;!qK;ra,+;aABcaABluc,nD9[;&,p;lKn;!e,lK;!e7Nn0;cMl,rK;gJ6tK;!$,s1;!os,+,%;cVd?g,gSjej,*veJA_,nQq&a,s,tK;a93cNeMiLnKuO;eGop;>h,s;fe,prA;aDMefe,uK;lf;eta,iK;s9tn0;ax3iK;caEr45tKzaE;._,+ta;ave,eK;`,r;a2Oc2Le2Di1Ml1Fn0Mo0Gp0Er05sQuK;biCcOf5hc,lNm0pLrK;c5fs6R;mKs8;a,i,(;!c5;e24+;aVbo,eRiOnFoMuK;c,gKja4sAJ;!&,s8;cKg,pIF;!a,$;g5lIDps1~n0vK;a,#K;!t3;!finDl[,rLtK;!a,&,n0o2;!pEYraK;!rKF;b,fa,gLlEp,rKv1;ra,tn0;!lD;aReNoLuK;c3f,s;>,c0Afn0h%,pK%;!a,eETmFos,sGL/,%;bil,cEQlMpLsK;&,nF;a7s1;a,f;cs1pa;aKec1Lirc3o4N;c,`,r;bOcMdHSg6hlibsib,lLnHSrKv;b,f,rFO;ip,p%;apCXiK;ob,rt;!as,#;a0AeOip,oMuK;!gKj4Epa;e2rA;c7m8Ipa7rK;de_,fE9pa;b#HAc04gufa,i03*02mRrf3sPtNuLvK;#,lI)4;ga,qK;#f,+;!),sK;o,/;!a,#pKi,oE@;!a,#;aSeQiNoMrLuK;a,cod,gH;ef,ota;c,f;c,lLpa,rKv[;ep%,pmuc;a,pmuc;lpKrc9;mF/;dnuf,lK_;!g5;!c,s1;*s,.4;#Gs#G;cBT=a,j,lKp6rbe~,uga,vel;&a,p5Y;aOoNuK;cLm,pes,sK;#,nF;af,if8o;c6s,v;f,sK%;!a,#,s55;>h,c05d03eYgATliUmSpQrPsM~,vK;eK);!l;eLiK<Cop1+cen;~5v;cen,h;f,g,ri;aKice2;!c1;aCiKov;!lI1;bKcaf,m;aL&,isK;op,sop;#,h4;c4Pd,fNjMpsLrKv72;=3p6t6;#7/;a,#,/;a,$;!a7SeKua;!m,r36;!apacFD#,ilM),]Ls/K/5%;!s5;je,%;ef,os;ah;c3fa,jQlPpOrL~Kv;ap^,ite;cLpKraG;a,rH5;&,n0;+FX;&,(,pm0;bo,e,),o2/;aLeK=;fEDn82t1yo2;d5pmi,tn0;!bF5cPd,#,gOleCDmNp^,rLs1tK;n0sn0;abs1dih,tK;!#,lDn(5Z;!#H.f;$,s5;a,s5;a0De07i04l01nXoWpal0rTsMuK;!ac,>,c3Uh5oK;!p4;aOeLirKod3;]ta;cC6f07mETrKv03;et9g0TpK;a,%;!c?f,_,pK;!?tlu,#;eKucH5;ps8vK;lDn0;ca,p4rg3;aMeK;pKt;!#,m8Ms8;c7rt;ob^LupK;!mi,%;#,s1;ce2*Lp,rf,~sAvK;!a,#,orpmi,r3T;!<,rap;b,c0AfOl,pNrLvK;?ta;et9gKp%;#,),o2;!os;n0o2;!b4cM_,pLrK;ra,t30;!#B6@C;!aK;rf;a24b1Tc1Rd1Pe1Bfic65g18i12no11o0Lp0Kr0Dt01uLvK;al,il;atsYcXdWfVgTj4Ymrum,ot6pC9sStK;aQcOiCnNpJrMsLuK;rOs;im,(;ot;eva;af,urK;t+4;!f;#E$c,ualc;esKif4Oua9;!a,@;!rA;!am,nArA;!o2;#,);alodi,eUibHlifD9nSsK;aQeuOiMnL[FKuK;li,rf;[1;g5)mK;!`,/;ces,qK;es,.;c,dJ*,rH;eK($4;!c48;lImonorc,nA;aPeNip6oMuK;m6p^,sK;sB/;b,ha,j;!b,c8Ef,s,tK;a,$7;b6ga,_7n;m0os,ut6;!bYcX`,ep^,frAgWhViUjem,lSmOnNpL+@,tin[,vK;&,ra;aKr(9;ve;gi,imD8;!anMeKirE;d,mK;n0(;!e;av,l,pK;mi,%;p,]t1;c,lem,nA;a,iv4;!&,<;alC5orr0;h,s1;ap,ehc,g,mOpLtKv4;!a,#,+;!sK%;a,#,nK/;aCi,(;!`;aC1eLimK<s,ol;!e,i,);*,t)3M;bilEBc3dUgSlQmu3nOpLtKvesrA;i5*;^t,o2YsLuK;c5s;e7o2;eKic9luv,o%;g4v;eKot;ca7;!a%,iK;*,rf5;iKnop,[;l,snK;(38;aK$g3;l,~3;assDulK;!ov9;eSiQmLoK;!c4d32inDnD;eNoMuK;lsKtsoG;&,iv;n,s@;l4ms1s;lKv;!ac,i~e;lK~;ec;!cMlc9QpKs;!a,eKi~e,m0s8;d,r7Gs;$,@mK;!$7s1;aXeCiTlQmPrNs?,uK;coLhc,op,rK;ga;!e2s1;az,it%,uK;su;aGil;aEucK;!sK;&,=;cLsK~e;=,s8;et<,itK;<,rap;c6rKt;!ta;cTdRgDliel,r0sPtOvMçK;iK$>;d*_,ef]E;!eK;rbI;$,ob6O;!sK;a,#;!rK;ep,ota;e,);a1Ee17g14i0HoQrLsSuK;a,cav,t.pWy6H;ac3eMoK;bB`,tK;!#,nA1;bKt3Rvog;ih,og;>,d09f8MiMrKs,t1z?;nKo2Z;or;cSp6sLt+K%lf4;g,uBX;aco,eOiMlupL$m8olK.ts8+Ouf;ce;mi;rEvrK;epB;rpK;!mi;aUcQeOiNnL[o2pec1.po2uloK;s,veAK;as,eKuf;m,vbB;aC`,sop;lKps9;!es,(;a4eK;fLlKps9;es,(;n0rA;!lKr,t6;#K;!r0;!<>,rA;b05c03dr01eZfYgWlTmMpo,ru,sLtKurHv=a,zub;ap,s1;e@,$,@2N;!aPess8iNluc,oM]Kuli;g,tK;!&,%;d,n1;le,rcK;),s8;c4Otn0%4;cLpiK;cs8;&,);aKi.;mi,pm0;a,#,n0;p,rK;!t;aj,oK;bB(;av,oK@f;c,ic?,rtap;m0ob5;isLupK;mi,o2;a4&,n0;cOdMi*,ll4n44rKzamH;d,f,tK;$,+;acn9Kn0.K;!(;!aK$;!m*;>,fo2g40lLrg3sK;!bB;*,p;a01eZiTlSoRrN@MuK;f,h%,rHsK%;!n0;isut3lp,p;aMef3ifLofK;!e5NnFs7F;!a4n0;!*,s1;d,s,t4;ac8Qif,(;e~,m,<Or,tLxKz8;orE;igel,lu,),sK;al,eK;!bBs1;!#,s1;f@lb,g*,rK~;!c;!f8hc,lLm,rKs*b^;gorp4r1t;c65f9l;a10b0Wc0Ve0Lf0Kg7Zi0Bl06o01pZrYsiXuK;bVcSd[,gRmO<,pMtK;?gn0iKor,sop;pac4t;!iK;nDt6;e,iK.f4uG;sKt6;!=,s8;a0#,<5X;ep6iLlJ)v,rK;ic;rtDtH;at3_1;a,gel;ahc,ub;^A6oK;ca,s;b5cNf6iv,paMrLsKv;i,n0;!atnJ$7tn0;rt%;!&,s1;aMes,iKorr3C;muh,pKrb,~D;!ec;c,f,h,tK;!&,+;ab,cRfQgPmisOpNtM~LzK;uf;i<,*;$v,s1um;a,&,m0(5;a,@;iv;a,rAs1;av,so;),umJ;cnJd[4gRhQpPrNs,tLvKz;!#,in,s1;<Ko2rDut;ms1;agKt6;at;!a,orta;!<;!nK;(7;ic5+m,zem;aMmLoK;d4p;as3et;h,t3;bOc3UdAf,g5hnuEj,)Nrruc3@GtLugi,ñK;es;nuEsK;e,)7;!s@;a,^;aZePiN<rHoL.f,uK;b8p^,r]f3s;lKm,$,rH;a7fa;eKf,m,zog5;b,*;cob,d,lR<Qps1raPsOtMugaLvK;*,);g,rp;(,r0sK;?,ef;&,noG;!f,p^;lp,m,tsA;a,eKf5;p,v;bKc3g3iv,l5r($7ta;!aC#;a0Yb0Vc0Bd03f01g00hc,lVmUn[i12oTpSrOsNuMvKxif@,zav6;bo,#Ki*,$,s1un1T;>;g,q6;at<f,et+N<;aLc3UfK;$,+6A;gKr8Av;<;ic)2mil,(,+,%;b,pa;e2(3;aNiLpK;_;cnKxua;(4;!p,t5va;elivi2iv,ole;a7ehc,nK;e,(7;aQeOiNnMoLuK;p5t6;!tsuc;ec9;l,sbB;m4sK;!@;!rri;a02#p00iXnPoMrLuK;b*b,s3;em0ov8;gSr,sK;a,sK;a,=;a)f4eMunK;a,eKo2;!d,r;cil,divNgilgMiLlis,]K+2top,ulf9;f8g;cn0]p%;en;e,o2;dKfe$b,lop,)4po2raGuj3;),rK;eps1;a,sK;&,o$m;_,s,v;_cLosK;@;!r68;ms1s3;c0BlYnK;aUeSiOoMuK;^Kp^;t+t;grKs;ev3;f1lM_cLviKz0;`;!$;a,bB;dKpRs1;.;b,g,pLrK;ra,t6;a,moG;aTeSiOoNuK;c@v,g]m,rK;bKtap;^7;!m;mMp0ZrLtrapK;!m0;b,t;uh;oja,p6rg,snoG;>Cf,m,pLrab,tK;ab,&;?ta,+;aTeRnNorbMrLuK;c6d,l;am,um;as1;aLiK;!ug;g3lKm;!p;!f,psIrt6sKvorpa7;&,(;!ps1rK;!.b^;a0Ke0Ai03l01nXoSrOsMuKzuj;jK*,s,x3;!bBn0;aKeirH;g3r;aMeKoto,up;b*,tsKx3;op;c05l3H;fa,ha,j,*NrLvK;`,#;!d,&,rK;et9o2;=,tJ;az,ev,iMolLumK;(,s5;a,o2;_.hc,p,v,x;avJ(,uK;j,mo2v8;d$m,lPrNtK;im,sK;aKev9);c,m;bKri;!a,o;!bo,r4Cs1;c,hc,lSnQp7rKssIvan;!fUgOpNrKt3;acK(6;!#K$,s1;!bI;!^;a,n0;!eK;d,r;a,&,l,p;c,d9m6pMrKv;fBtK;!+;!a,o2;aMeLiKnuiC;ec,r.b;lb;>7rKt6;goKrag3;litad,tK;of,pirc,ua;b0Nc0Md0Iga0Ghlof,jnJl0Em0Cn08p04rZsWtPuKx0znorb;gNqK;aL<Kolb7@hc;lb,rb;f6s;av;aPlOnMoLrIsK;uc;>s,cihc,g;alp4eK;p,+2tap;ov;b,g4hc,p;aK&,*f,@p,unD;b,p,rfK;?ap;alc,cNf4oMrLtsK;?,e;aGeug;>s,l0;!#,o2;lM_LoK;rt6;rg;og;aMilLofK;elP;a,&;lp,s;es,on,sK;iNuh;cKep,p^;et;$moh,ssDt<K;hc;aLi,l[,nKor,rabmQ;ab3Kod5;cn1QprK;ap;apaC#,<lLub;mLrK;ab;ob;!a0Pe0Li0Cl09nYoWrNuK;aLd,ja,*s,m,nKs,t6ya;a5.t6s1;c5rf1s;aOeh,oK;bLcKg3;a,#,n0s8;!a,sK;<C;t4ugK;!aKs5;!v*s;!#;m(Kp,r;a,);aReNirb,oMuK;fK);!a,orE;d09ha,s;mLrKvs1;em,ra;e0S$,(K;#,$;!mLrK;>,ga;!&,(;aLoK;m,s;ps5s;culRep,lOmit9uMvK;?g3#,lo,nKud;e,(;c7qK;il;!avLoK;sn0;!);e,=;bLpsK]h,~;oh;ebK;^;cLf3l@Cn,rgK;a7&;#H;a21e1Xi0Jl0In0Co01rVsNuKzillA;dLhcD;am;ac,e;aQePiLuK;b,fo;bMd,fn0lLp,rK;!ra;eb;?;p,rf5;cs1m;aMecLoK;f3ha;!a;!bLmK;!#,$,s1;a,^7;bSfQhc,lPrOs,tNvK;eLiuKnFo2;qe;!r;!#,+;r1t;a,(,s1;$,oK/;f,s;#,mK;es1;aLiKor;rb;b,m,p6rLt6vaK;*;ra,t7;!s1;ac5ov,uc9;bu,d0Sf00lTnRp,r>f,tK;aPca2irc,$tOsK;am,eLonK;ga8o2;!mK;od;ua;lp,rp;rKum0;of;bPc,pK;a,#,iMmFuK%;d,s;i,(;rt,tlK;um;up;!aCiK;c06d02lZnXpit,rUsRtK;?,c5#,nMon,rLsK;et,uj;ec,of;aLeK;di;s,uK;c,q;aOlLnK]v8@O;et9;af;aLbul,cKev,olg,up;as;lc;aKgis,ot,u;d,lp;aLpmK;a,e%,is;c,~;e,ilIoK;cKm;!&;os;ap,ep6uK;rc;+;rt;?N>,eM)LujK;`,e2rA;!vi5;d,rp;];f1hc,p,sLtopK;ih;!s8;=;lErOs,tK;aKs1;!-K?L;?K;tn0;ta;pa;a00irr1lZmVoQrMuK;c9or,rr1;);ecaMuK;trA;ep;%;lg3rK;!pK;!a,m0;(;$;irJoLuK;hc,t;rHz;ra;is;b,cLg,*,rKs1;g,t;a,#,sonK;em;aMevL=ic1;&;[;dTiliSjeRpucoe2rit5sJtK;nLsoG;ca;avKes;el;ac;#;rp;*,~;fa;eMiK;ciBvlo;/;~",
    "Noun": "true¦:!1:#$%&()*+-./<=>?@[]^_`~:re,et,se,ne,am,ro,im,la,ir,na,er,ci,ra,rc,ni,id,ps,rp,en,op,es,ac;0:32;1:3O;a2Ge1Q+18n0VoWrOs2;aGel4o2élg1;<2tad;hc,p;a2beum;cBeAg,i#t(,jecnoc,mi.,n7#6s,t3ut2vi15ñ`;cel1A-;em,i2s-c;b),p2;~,soh;bil,n*;~,edr0i2u19;f2m#t;!*`;di,#c;@ar,ov;<5da2;céd,m= saz#uf,n3p%,r2;o2Pt&;ed)oc,)j;hc,lbúp/,n3rbáf,t2;cá],síd37í>;cét,ó>;at8e2*e,oñ`;bew,cnác,d6jum,l4sál,t3v2;-,ád0;cár0ipúj,%&m,t_ yr=h,á>;l2mmih;at,icn0;.tnNíl;+,%&ib;<VdOgMiJjabart,lHm-p,nFrBs8t6v4z#um+,ír,ñ2;a2eBin;!b,d,mat;alc%,it2;ejda,iso[@,luc,&c1om;ce[o],i2;bah,du#,m,sópo],xé;a05ep,o2;!p2;/,%;bme*,e3i[2;us;dan#v1fím(,j2l+b0?d;asap,uga;adaduic,i2#i0Z;cev,/,m0rge19v;e2lor=sU;meg,uv;<c#je,=2;d?cev,l2s#vi.,usu;as;a2euj,*a;m,p;a4n2;a2$?n,of,um;b,moc;c4elpme,g3i+,l,rg,sap$.,t2zeb~&;aZiv1lu%r,n$a,soc,up@;oCíh;ifingis,#m;dói0Uf4hc,p,r ot#up,t2;nálta4róp,sónga@,uéc(=f,á2ílo^;mu^,rdR;áTícap2; o.éco;aCe2or;d)9g6iug+,m2rt;axe,i4od3r0u2;lS%r;ba;gér,>;!(i,i3r2;(,iv;);!s2;ed;l2mtab,p,to;c,p;cIdu0iHmiGnCr8s,t5u4v2ñS;anr0i2;r,t%f;n(,t-;e3i[2&mucod,)p,s-c;oh;gev,m;bmu,d4^3g2otil,ulp;$1;*,uf;$0;~,e4*#t,os01u2;bi2;rt;dr0s=;.;cn$_,lif,)t@e;ov;lbOtn2;aAe2;i5n_o,r4t3u2yub-tnN;f,p;ap;eg;d,lc,pr4v2;iv/b8r2;is;`;<DdCf1iBjubAma,n8r6t2ug,vel;i3&%]6ov,s2;e,?;<l2siv;os;*Huats2;/;od,#2;bog;@;c#m5dut%,=v;n(4uya;+,rbaf;a3itsubm2or;oc;c,s;beu],<05dLgK-a?uq(,lIm)f,.DrAs9t8vit3í)2;$,y(;a3ce[2;#p;g3i<1n#t2;+;^;lSob;~,_%;beiuq,^3t%2uc;um;*;!b5l,m4&,pm0r3tn2znQñQ;ev;!bm5;`,#h;ah;cz2lI;em;/tDr0;a3#2;uc;cIgEhCjabB+sAn8pSr5t3zl0;~;nFr2;_;ap,*,o2t6;pm2;$;!r2;oj;&;me;!c2;af;ell,l4u2;j,rd2;(;up;éd;ncBt2;cát,sí6ám4é3í2;>;!ivos nóinu,t7;arg,$,)f1;?;d3ügn2;il;at2;%;ét;]",
    "Adjective": "true¦!1:#$%&()*+-./<=>?@[]^_`~:er,en,es,ro,lo,ri,il,ti,an,or,ci,vo,al,te,st,re,ra,le,no,do,mo,ar;0:ME;1:ND;2:MZ;3:LH;4:N6;5:N8;6:MG;7:KR;8:K8;9:NA;A:LF;B:MU;C:MJ;D:M3;E:KQ;F:MY;G:KZ;H:FT;I:LD;aJMbIFcFLdE9eCIfBMgAZhAIi8Lj8Ckur1l7Om69n5Oo5Bp3Squ3Qr2Qs1Dt0Ju0EvVweb,xeUySzQáOíLóKúJ;l+mEnE2t*;pAEs7;be3gn7nJ;fi`,tJ;eg3i`;/1l2LrJs3Tto0ur7vi1;abe4i1;aJur1;`LBpoAU[goza0;#`,uJ;caASgosla<;nófobo,róD9;aTePiLáKíJ;tr7vi1;li1nda(;ejFIguDkinFlGKolHrLsJtAu1<4zcIM;iJuA;b],go1;tuAulH;c0Mllu1nezoGGrKsp#K4tJ;eKZus2;-4OdJsát*,t33;ad#5e4;cPgOlN^,q46)MsJ;=(,cJto;oJón;!nN3;ab],op91;liso]I2ón;abBJo;u0ío;bFRlt[KBmbrío,nLrK>LKzbeJ;co,ko;b7Oug48;iJíCP;f.me,v#sA;a0Ae02he,iZoVrOuLárta3éKíJ;mi1pD1;cni8rmL8;cuHWnHTrJ;bJco,í?CY;io,ulH;aKemBYiJoH5un8;(buLXs>;cMdicLXnKsJvieC;e3lúLH;qui(,sJ;grK0lúLFm08vLO;io,t9;]72n2rLscKtJ;=,ona8;a0o;_,e3;bK#0ll,n2&J;id7lD;eHBio;atrAba0mpPn77rJs=6utGó)8;cMmóBZrJ;eKiJáqu7;to8L;^,s8M;#Jio;!a;.ArK1;iwVng31rJuKNí0;as8dío,t7W;a0Le0Ci07oYuKíICóJúp#;li1rBD;ave4bUcSdReQfi/J1je2mPpKrc3ZsJt*;odicho,+tu2;#K@J;`,s9;!_KRfKiJAvJ;is9;iBElI;#6o;co,l2<;-D;%9iJulH;n2o;=JcampeGd%~&lKWmaK7u6O;pi0t9N;bO/=NlKmJn.5r1viéHS;brío,e3;aJemne,it0Oo;!rJ;!ieF;!%,i?a;#KrJ;ehuGIio;a0b6;amDgMlLmKnJr6;ce3ieJDóB6;i2HpBZ;vA2íc7;nificaHEuiDJ;cQdPguOmiMnLpt$trDXrKvJxuBñe3;e3*EA;b6e0io,[0;c*l5eg=Dsa2;cJd%nu1áKS;on0BáBZ;nda,&;iHuGH;o4@toDCunda)D1;b6crRgrCFjGlPmOnKrJ;_,[ce0;!gKju-i0o,tJ;afeJBiagJ9o;)HuJ;i^lHín7;a45oa0;iJtGE<;^,tGL;o,í]F;a0EeSiRoMuKápid5íJ;gi1;a0bJ_,ma0rBs5;io,&;b9LcMd6jLmKn8q1IsaJt91;_,)0;-Eo;a,ibl-8o4;ie3ke3ocó;c5oja0;a01cXdWfUgSlR`2nPpLsponsD7tK<lu/onJ;~6;iBRrógGP;]2rJ;%KoJ;duFQ;=DM.;aJomb[da;c$tHY^;aBOigiosE]0;ioJul39;!nB;iJO]J;ct9jo,xi<;on1uFH;e54honcho,iLo]KtJíp&8;-g2K*CU.;ct9to;$JNo;c6lJ;!eJ;nFs;dL(,ncKquíd7&,sJ;o,tFM;he3io;icA;eJie2ímEH;bequDchua,)1;a0Pe0Ji0Hl0Eo03rNuLáAJéKíJó?u`,úblEF;ca3o;ndu(,tr7;d8S#8lc3n+agu1rJto;iEHo,p9EulH;acFOeViSoLáctHWóJ;diFsJximBI;pe3;bC7cedBPduEVfNg$9Qlijo,mLn2pKsp#-1>EVvJ;$iBOin8Y;$CiEuls9;eJiscIot9;d6tIT;a0%IJuJ;nd5so;e2mJn1V;aEB#JigFU;!a4os;cKdecGKmatu3r6SsJvi5;$IUid$FLo,to,un2;o(mbi0urs9;bSdRlOpu08rMsJtoHH;iKtJ;#iGE@3;b9N+v5;/0tJ;u2Rát*;a8iK<)HíJ;c1SfaFga`,tDN;c1Rn4N;#os5)1;la1@;aKeJ;beyo,n5;^,ye3;cu1gm7nJ;na1o,t9;cu75dunA0lNnM.,queñErKsqJ;ue3;la1m-FLpJson=%,t$e/AUua0vHN;etI]jo;tá8Súl51;i43u1;cífi8ga0lRmpH1rKtJuH2;#0r6óGO;aM/AdLejo,iGT+J;cuJsa0;l~HS;o,us8;gJ](;uaJ;yo;aJ%EYme3;cJ+0;ieF;bRcPfiELmnC9pMrKsc5YtoD7vJ;i0oid7ípa3;=,deHNiJto_xo;e5XginBun1;a8#aE5oKrFFuJ;%2lH;r39s89;/Jhava1ul2;de5Sta0;eClL@3sJtuCv6;cJo]2;e0u3;icIonF;aYeTiSoMuJíECómada4;c]JevE(,m#os63;aJó7D;_,rH4;b8BcNmbDZrKtJva2;ab8Ao;cKmaJo%>,ueF;lH0n1;.G4;i<,tur0;pGt&geH2;cMfas2gKoJrv6Pto,ut3;gr-a4Sy.qFS;aDJrJ;a,o4uz8;%a)Eio;cGKpoliC9tMvKzJ;a@0i;aJie3;l,r3;=,o,urB;a0He0Bi06oVuOáxNédi8íMóLúJ;l+plJsi8;e4o;r8Cv*;nJse3;im5;_,#2la2nMsJtI;cKicJulmán;=GEóE5;ul~;dKiJ;/pB;a0iA;deSlRnMrJzo;aKe0iJmGo,u0;b57s8;_,l;ocMtKóJ;ga`,to0;aJevidF8és;^,ñD;&`;da<,%2;rnEs2;lLsKxtJ;e8*9Co;mEógi0;-DitJ;~%;dMjDRnLrJt&politE9xicE9zqEQ;id91oJ;!vAF;.FQtAu1;iJo;a,evAo;cXdWeE8gUlRnPrOsNtKuJyDL;)B4;eJuCW;mát3UrJ;iA^;cuEOiva;aga2i^4í2K;cheFdBMifiCZso,uJ;eELfacBS;aKig0(rquín,o,tJv2FéBC;r16és;!yo;nJ&;o,éC0;eBNu3;ab3edBG;a02eYiRlQoNuKáct7íJúEL;m4Wqui1;sK>DCxemburJ;guD;iALo;buEUcJmb~1nge<;=F1oJ;!mBK;a0e0.G;bNgMmLnKs2tJ;#a)5ua0;_,eAgEQ;p6ít&f%;e3ue3;-D#Jio,@4;=,+0;cLgKja0n2oEWtJ;[1ón;=EPo,í1S;he3t9;cLdrGnKrgEs/<,tJxo;#Bin5o;ceolad6Hu1;io,)móDD;aOeNoLuJóv$%;dJguetGnto4s2v$*;i4Lí72;rJv$;da0;m#,ró4S;cobKponJ;%a,és;eo,i0;be3d1EguBl17mp11nNrLsKt=iJzqui#d5;-6U;abeDEom.fo,[elí,óC9;aJ@dH;c36n6;a0Uc0Qd0Ge0Ef0Ag08h07i06ju?05m01na2oZquie2sVtLus15vJút*;as9#Já5K;so6Z;eKrJ;au>D4uCé3Rí3A;]c3XnPrJ;!ceN%E8iMmed6nKuJv$t9;rba0;aJo4;!cDPs;^,.;pt9;cDBs5;atKeJospe5F;ct8Ggu3nsa2r2;isfJuAM;echo;cI_3p.J;tu0;aLeKunJ;_,osuprBK;dia2nCrC;cuDBdu3;ifiCDo;/Ant#rum37;abiCVu93;$Il%J[2;a,%;aLeK[Jun52;r&jo;liz,)B9;me,nt*;quí3Ksp#0AxpJ;#2(A4;eQiLoJu?)Bíg$a4;e7J(3nJ;%6;f#$c71g0o,sJviduB;cKtJ;in2;rJuA6;e2iCX;bi1fJpe5Ss4Lt#CW;$Ci8Q;i4IoJruHul2ó`1;(3mpKnJrpAA;cluCexo,t&CN;]2r$2Q;cabUdJl>9Pni43p&p6Q;ecuTv22;~,eNoMrKuJío;ls9&;eJop6;s9v47;rtCWsib];)A;eNiKusJ;t@4;mJr6;itJ;ad5;gíJso;+`;eAón7;aWeSiQoLuKáb*,íbCLúJ;me1n8X;e8go^>,m6K[caCGér3C;/cu1mLnKrJ;izoASr21;_,%2;ogOóJ;fo0(Fni`;d2Crsu2sJ;p-o0Atór7G;br7chi97lLrb6St#oJ;_xo,gJ;én7;a1e0;bituBlóKmbrJr2;e,iH;fi(,ge0;a00eYiXlVoUrNuJé3C;aK#rJipuzcoa0;e3*l4J;po,rdián,>m=J;>8;aLecoKiJose3ueC;eg5s;!la90rW;nKsJto,ve4;iHo;!aJde4;di0;_,r1;aJobAút7;b3u8;g6Uta0;nJográfAEr73?9;#Bui0étAD;di6WlJrzo,scGucho;lLoJés;!rJ;&6Y;~1eF;a0Ae07i01lXoVrQuMác*,éKísJ;icAX;rJ+1;r7t*;#BFnKtJ;ur5;c4CdameJ%2;ntB;aKecu3VisGug5QíJ;a,o4<(;ncKtJudulH;#0;%9Zis8Do,és;lclór9UrJ;mAni1;aKexi<,oJ;jo,)1;co,mJ;$8íge3;b[_s,c+/Ndedig0eMjo,lLnJrme;aJo;l,n/#o4;ipi0ósofo;lAM&;as,os;cKd#AliJm$in5o;^,z;un1;lLmJríng7s/2Fv.3T;iJosE;li~;(,s5;br6conóm5Pd18f16g15jecu72l0Zm0Yn0Tp0Qqu0Nrrón7s01t00u&peEvid7YxJ;!acta,cX$2haWiVpTtJó95;ePin2rJ;aLem5ovKíJ;nse8;#7D;ct9nj#Kt#rJ;%t@;a4os;nKrJ;i81n2O;di1s5;#J@C;ime8Jto;gI?2T;us2;elJ@t9;$>,so;#0rus8ér7;bel2cZ$YlWpPqui<,tJ;aNel~,on6r1NuKánd~,úJ;pi1;dKpJ;$1;ioC;b],_unid$se4n8tB;aNeLi)KlénJur6;di1;tuA;cJso;iBíf09;/Br50ñolJ;!a4%;a<,ovJ;a8e0;/A;aM]KoJue2;cDl~;róJ;fi(;ndina<,s1U;iKíJ;<8;lib62^,v=6R;icKóJ;ni`;úr7;a0cMdLemiFf#`,oK@ve6PtJ;e3usia?a;ja1rme4;oc82ó7S;-t9Cima;ba[88is9;eJéctr5W;ctJva1;.LróJ;fi(,nJ;ic1D;!=;eo,ipc6oí?a;ec0Ricaz,íJ;me3;it9;a0Te00iMoLruCuJéb*;lJr5;ce,zG;b],(8Rmin3Wrmi1;e73fUgTminu2oce5Kp(S@ct1DsNur0vKáJ;fa0;#Ji0;sJ+1;as,o4;cMj83pJ+ntE;#ConibKu%tJ;!o;]4;apa/7O@2;ma1;itA^;#10uJíc22;n2so11; `da,b*,c08f05l03n01pZrYsJ<2;aVcRdiQemplPhon5MiOnu1o13pKtru43vaJ;li1;iLrJ;e3RovJ;is2;aN#2;#2;ea1;cha1;=LonKuiJ;da1;o76tH;zo;fo77p#/J;bi1;ech5;.+vJ@d81;as,o;so,+J;cu7C;gJicJ;ad77;$s9iniJ;+J;va;a0idI;*;da;nDñi0;a1Qe1Hh19i15l13oXrQuLáKé]b@,óJ;`1nca<,rn7;li1ntab3;aMba0#1ltLrJ?od6ánt65;si,vJ;*0Ko;o,urB;d3rta;-67eOiKoata,uJí3S;_,$2;ol(,?J;a65iJ;-J^;a,o4;/4Hs6B;l0Lm0FnWoVque2rLsJ;a8tJ;#a;a5YdRea0int6nu1pP@Kso,tJuñD;a4e3To4;ctLspoJ;ndiJ;$6Y;a,oJ;!r;.AulHór7;$2;a1*]4Q;rde6N;c00du2HeZfXj67`v6Jo5VsOtLvJ;eJulC;rCxo;$2iJ;gInJ;e4Vu5;aP#v6PiMpLtJult9;-6KitucJ)2A;ionA;icI;d#J?3S;abJ;];bi1nguJ;ín7;.JuC;me;xo;i$zu1@2;~3E#2ZpKunJún;%,i?a;lKos>J;la0;eJi4P;j5t5;e1SoJ;mbiJniA)1;a0^;aJo2Lás2P;nd%2Zr5;clóp7eLlKm~rGrcunv17vJ;*5M;ia1;go,ntíf2KrtE;aOecMiKoJur3;(,&;f59lJ^;$5lG;he0oJ;!s(va8;rJto;&,t#;lPnLrJ;cJebrA[1;-E;s9trJ;=57oeKíJ;fuFpe2;u&p7;%>,tíbe3ulJ;~;duc03l02mZnWpSrNsLtJu2;=Jól3Z;án;e3tJ;ell3Eo;act#ís1Nc3PnMoK&ñe3tJ;ag0Rujo;!lJ;ing6;í<3;aKit=J)0uchi0;!i0;cJz;%;-7c#í3Hi0o,sa1tJ;->,oJ;nDr;boKpeJ;&,si0ón;ya0;cár7i23`,<;ifol6o;a0He09i02l-ZoVrOuLáKíJúl11;fi1pe1;rba3sQva3;$Kfo,rJ;_,guDlG;!a4o4;a<,eOiKuJ;jo,s0Dto;llLtJ;a0ánJ;icE;->;tGve;goLhem6mKol38rJsn6to,vi0;goñG[cho;bo;ta0;cK_,quJ;e/0;a4o4uz8;eMlbLnaKrJz~3;ma0;)a;aí0;(rruCnJ;veJ;ni1;a2l(,nMoc6rJ;b#10ebKlJ;inD;#;eKig0éJ;<(;dic0UfaJ;ct9;b*P*NjEldMrK?Jyo;~1o;a2bu1cel0W&Jí26;co4;ío;~J;ín;on6;b3Fc34d2Ve2Tf2Pg2Lje2Jl1Zm1Mn0Xp0Rqu7r07s02tWuPvLzuKé@5ñeJ;jo;caLl37;aL$J;tuJ;@3;n2E&;dO?&húnNtJ;oKóJ;c1Rg[fo,^m5;g%t2HmJp&pul0M;ot9;ga3;az;eMlánLrJ;acJevi1oz;+<;+8;n2o,rJ;/ope2Ir34;%MiKtu2íJ;nc&0;dIlv%tJr6;[1;i0.;aZbYca0dI$WgSio,mRqueológicQrNtJábiF;eLifiKí?J;ic5;/B;sa0;ep$Ki%2WoJ;ce3;+1;os;$6;eKiJ;<;li0nJ;+0;is8;co;ór7;gKm7uJ;ca0;onD;aKuJóc)fo4;%2;iLrJ;$J;>;sa1;a03cho,d00eZfiXgWhid3iUtMuBáLóJ;maJni`;(;(F;eNiJ;aér7c1JguEsubJ;ma0R;a4o4;eo;cK)J;.1K;%9;ma1sóJ;t&po;evi0(sajGos2;b6t)G;ón;jo,xo;=uz,i0.J;[0;ho;e0Tlfabe2rJ;-ja1quJ;isJ;ta;aSbiM#iK.Jpli5;fo;cJnd6;-5;dieMeKgI;uo;ntA;=;?3;&;_,rJ;go,*lJ;a,$2o;a01bZcaYdXeSfonRgOoNpi0tMucKócJ;to0;inóJ;ge0;a4#0o4;ca1;eb[KonqJ;ui0;ica;si0;gMj-dLmJnt0W;-Ján;a4%;)0;@;ea0;li0;-Di0;és;_,^;d@J^;za1;iLrJu_4;adeJio,ícola4ó^`;/1;ta1;ga0icKoJ;rtu06;io05;^;&b6;io;ecQiNjMmini?[+vLul2vJ;#C;so;a4o;un2;cKn>J;la1;ionB;ua1;ampaSep2iaFoOtLuKér)J;`;miQ;iv5uB;=J;!%;gJ[zoM;ed9;go;to;na1;neTo)gSrumQsOuJ;ndKrJ;)1;-J;>4;!s;olut5ur1;a,o;ad9;.;$;ga1;_",
    "City": "true¦!1:#$%&()*+-./<=>?@[]^_`~:an,en,ng,ra,la,on,er,ch,ha,in,al,ar,ta,es,ur,re,lo,ba,il,is,de,or;0:3B;a2Zb29c1Zd1Ue1Tf1Rg1Lh1Di1Bjak<=,k12l0Vm0Hn0Do0Bp00quiZrWsMtDuCv9w4y2z1;ag@b,?i+;#g),e1oko-ma;kat*.1K@v0;<s4e3i1rocl4;ck[w,n1;nipeg,t*th?;lli%t),xf~d;aw;a2i1;$na,lnius;l$cia,ncouv*,rna;l# ]t~,t@+t;a7b^_i,e6he5i4o3r)dheim,u1;nWr1;.,ku;kyo,r)Ju[uD;#j.,l16m_o2Mr#a; -Kss/)iki;gucig/pa,hr0l aviv;i1ll.n,mp*e,%i*,rtu;+u%,n0pU;a4e3h2kopje,t1ydney;ockholm,uttg<t;#g-i,$zh$;oul,v01;.t pet*s0Xl4n1pp~o; 1ti1E;jo1s/v3;se;v1z0T;adW;eykjavik,i2o1;me,s<io,t28;ga,o ` j#eiro;to;a9e7h6i5o3r1ueb(,yo%y#g;a1et~ia;gue;rt1zn0; elizabe4o;ls$,&eus;i(`lphia,nom p$h,o$ix;r1=h tikva;th;l*Lr1t&s;_;d>sa,s1t=wa;aka,[;a3ew 1_;`lW=ip1y~k city;ei;goya,nt>,pl>,v0;a7e6i5o2u1;m]i,ni+;nt2sco1;u,w;evi`o,@/;l0nsk,skolc;`llín,lbo?ne;drid,l6n4r1;ib2se1;^le;~;+>t1d/Yi(;*;mo;a6i3o1vCy);nd1s #gel>;),r>;ege,ma1nz,sb),v*po2;!ss1;ol; p(=,us#ne;a6-rk5i4(ipeda,o2&k1ua( lump3;ow;be,pavog1sice;?;ev,%9;iv;b4mpa(,ndy,ohsiu%,&1unas;c1j;hi;n+eNst#b1̇zmir;ul;a6e4o1; +i mi2ms,u1;stJ;nh;ls.1&kliH;ki;ifa,m1noi,v#a;b?g,^tE;/w5d#4$3h$t,iza,oth$2&z,ua1;da(j0H%zhou;b?g;eVoa,ève;sk;ay;>,r#kfu1;rt;dm)t5.dhovV;a2-ka,o-,u1;blSrb0sh#be;e1k<,mascus,ugavpiK;gu,je1;);a8ebu,h3o1&ioK?iti];[1nst#Kp$-gOrk;gGmbo;$n4i2r_t+?1;+;#g m2c1t=goM;ago;ai;i1lg<y,pe town,&c5;ro;aIeCirmi%hXogoBr6u1;+<4dap4$os air3r1s0;g1sa;as;>;>t;a3_]2usse1;ls;ne;s^Rt_(1;va;=;i4lg&`,r1;g2l1n;.;$;ji1rut;%;ku,n4r1sel;ce[2r#qu^1;(;na;g2ja lu1;ka;/o1kok;@;aDbBhmeda]d,l8m5n3qa2sh1th$s,uckl#d;dod,ga]t;];k1tw*p;a&;m0s1;t*d1;am;ex#dr2ma1;ty;ia;idj0u d-bi;#;lbo2rh1;us;rg",
    "Country": "true¦:!1:#$%&()*+./<=>?@[]^_`~:am,na,ni,ar, a,la,ab,ro, y ,ir,al,et,ne,re,da,ap,ci,ur, s,in,at;a0Le0Fi0Bk&i,l04m02nToMrHs6tiawuk,u4y2zenút,á1í0ú?p;l#,tiah;@$c,ma$p;aug0tic $]t2;&[,^u;)vut,ruan,taun0ásib-04;av;a7e4o0éd<gnU;<2ce^r#,d0j*_esí[;*rS`u_0;eb&á_ot&ime,o@tse;![;l1ta0ve`.)bóts/cD;rime b&a24ts24;aw,lehcyes;mahM%1r0vidl#;omoc,udnoh;@$rg_<.=>]v8pilif;a3egín,o@2ssu,u0;pag%s,s led 0;aXn1V;uce,v)s le;csagad#,tac;c5d`u o%er,g3n1rgen=nom,saf(%krub,t0;osel,pige;*íl,/#0; $s;*ot.@di%rt,noc led(]0ot,rubmexul;l1Utárcom0K;anóm,ixém;emey,i6á1ínQó0ú?mU;bag,mo)sApaj;dus,mo,ri,t0yi*?za;si0ub;jazak,k1n0ugG;agfa,emkrO;[,ebzu,iy~;=sn=hceil,ér0;*;an0odg%k1E;/us,teiv;a3e&2i1)hsr#0;_<1;fr# ed 1Bsa5;si;g1i+tauce 0pen,t>i+ +mit;ae%N;e>s,ut+p;dn^Vt1u<#,yif,énu0;rb;*i0ubiy;rik;]l4d?v ob8l3picnírp.émot oAr2t+n led(1u0;b*miz,qibmazom;e+c;iovi'd =oc,p0;ihc;eb;buc,c0Qd0Me0Jg0IiCk$l /s,lAn5om4r+d$,su,t3ug&acKyobm2zius,í0ñ[T;cul(tn3poite,rgnuh,uqr0;ut;ac;iduas(ibaZlT;as;a2i1oel &?0utuf d$_il)w;is;hc,t>gVvogez?h-a`s6;]0hg,ust5y2;%mod0Prfaort>c0P;#=a0euze>v,og$;ug;bZcXdnTlOn9r5s2uqavFv0;adlOil0;ob;<Heno1^0;!+leI;d%,r]m;agl2e0is,tM;bCg0;`;ub;a7e4o0;dec# 2l1t0;el,se;op;ed08;k,mBv0;ol0;se;b5d+j,m3rcu,t/u2ut1zn0;~;il;#;e1r0^;ib;);a2eg1ogn0;om;ra;mos,rt0ti;sua;<0i;i1n0si;if;~,zaK;aorc,e0$rf;rg,us;i3m1r0;es;a0olI;g,z;l,m0;an;eu+n,not;%ug0rt/e;!(veun(úp0;[;a$rg,$1ubr* y(ugit0;$;gu,l0^;ez(veun,ri;ehc8i0r#a%d;#6gléb,%mod,r0; 3ema fo_=~s2f0;ád0;us; d=`u;~s0;oc;aj;(]l0;búp0;er",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;ax,gw,hr;ax,cn,ndianGst;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Region": "true¦:!1:#$%&()*+-./<=>?@[]^_:na,ra,at,ro,ac,ni,oc,re,sa,tn,an,en,il,uh,im,hs,ah,ci,rb,ss;0:1V;a0Uc0Qd#l0Me05gn02h00iXkUnOoJrHsBt6u5xe_4y1zurca8;d#m&n,e2kcu.ek,li]s,n1r.ev*;(sut,oxas;rrTs+j04;e,us;ohziZs#g;a$jYe3i$y/,nom2u1;]tc<n*,v/J;+v;hlys,sr1;emos,od;a3d2e.e=(-uga,i1ole&m,ttes>ca_0;a+g -)m,o)lli;eY#ld?;cet(az,p2s#k1xet;!$;a0F=uam%;?h-k,oda^al d# d#ld08up1;gnHin0;[#r0c3da&l*,g2hadi,i1or a#t)uq,$te+uq,taujaK;ho,$.o;ladih,#rud;ixemLs1ubm/+p;ab%,=aj;a3eme^,isn*siw,o1;el ove1ge&,k3t03;un;cao2gi2ht-j8ijuf,n>,t(1>]s,wehctak-s;uy;hc?;]wsnu^Dlof1rC;f1&n;us;[g)q,ep,ha@j2iaw[,ppi_i1ruo1sotop siul #s,xg#ij;_?;ar;a1sedarp $t1;tu;?oyw,odg1;#1;ug;e_<nGhcepF)0r3t%s kr1uq-b;oy1; w<;awalBi@1;(#l,d&f9egdi^Bk6m[g)5n4pm[3+tsec1ybrA;i1uolg;el;! w<;l*)l,otpma4;kcub,tton;]wrE&y1;! 1;htrZ;f%s,t+h,xo;ed;m(;et;d3s1yr0;i 1nee4;d$wde ec)rp,edohr;nuofw<;d not2ebe1;uq;g)@1;aw;botin0cZdX@ido,iLkIlHmFn6ol/Or5t2>a>1woi,yhd0;ihc;o1+bE;kad6s<n1;?;aec,th-$h0;a6i1l>k,ozi$;lo$c2$t( %n1;as; ht1;rCu1;os;i2$p,.1;om;d),siuol;aba1=Lohalko;la;(xalt,i>aJ;%/r2-1;la,^F;ak;bmul* @itiBg&eg,hAn4r2t*s av1;on;av8bmuc,eb1;is;a3igriv2&f=(1;! aj5;! tsew;ms2vlysnn1;ep;%;ab;^;av1i&lf;<;axao,isr1;*;am",
    "FemaleName": "true¦!1:#$%&()*+-./<=>?@[]^_`~:an,el,na,le,ie,en,is,et,ri,in,ra,da,on,er,ia,ey,la,yn,ma,ce,ta,il;0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD1cB8dAIe9Gf91g8Hh83i7Sj6Uk60l4Om38n2To2Qp2Fqu2Er1Os0Qt04ursu6vUwOyLzG;aJeHoG;e,[,/;lG%;<,^;<,/;as7EeHol1TvG;+9=B8;&0s)3;#8)dBMhiB3iG;lInG;if3AniGo0;e,f39;a,h$mi0lG^;a,ow;aMeJiG;cHviG;#9X)FY;kCWtor3;<,l^,nus,rG;a,nG=ica;a,i_;&GnesE9;nDIrG;i1y;aSePhNiMoJrGu6y4;acG0iGudy;c3%,sG;h9M`;nHrG;a,i;i9Jya;a5Iff#y,%,s5;al3eGo^si0;a,l^,o6Xres1;g#,o6WrHssG;!a,(;eFi,-7;bNliMmKnIrHs5tGwa0;?0um;a,];iGya;a,ka,s5;a4e4iGmC7/;!ka;a,t5;at5it5;a05car&t2Ye04hUiSkye,oQtMuHyG;b~,lvi1;e,sHzG;#2T+9(,y;#Gi7;!a,e,nG;aEe;aIeG;fGl3DphG;#2;cF5r6;f3nGphi1;d4?,ja,ya;>4lv3m=1nGobh#;dy;aKeGirlBIo0y6;ba,e0i6lIrG;iGrBMyl;!d#;?,lBS;ki4nIrHu0w0yG;[,%;i,&A=,r=;a,<,?,nG=;a,=;l5Yre0;bMdLi8lKmIndHrGs5v#%E;aEi0;/,y;aGi4;nt5/;lBKome;e,(;.1-0;a02eXhViToHuG;by,thBH;bQcPlOnNsHwe0xG;#93(,y;aHeG(,lC;#n7ll1^rBCtB;!lGnn1;iG];e,nG;a,d7W;<,i,%;#8;h$53io;b.,>B];a,cGkki,%,`;h$&,ki;ea,i#n=,oG;<,n12;#0bIgi0i0nG`,y0;aGee;!e,`;a,eG;cca,kaE;chGe,i0mo0ndi,qu$,vDy0;a$,$Gi8;!e,&;e)2?0;aMeLhJoIrG;iGud)_;sc~1Uyamva8;lly,rt3;~ome0oebe,ylG;*,l*;arl,ggy,n$ope,r6t4;ige,m0Fn4Oo6rvati,tHulG;a,+9.1;-cGsy,tA5;a,e,?;c`v3deHfATlGphAT;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeD^;ll1mi;aKcIkG[,%,s5`;iGki;!`;ho&,k8AolG;a,eBE;!mh;l7S%,r*F;dIi^,nHomi,`G;li1s5;cy,+9;eAiCL;a01ck)z2eViLoI-g%y#i,u-$,yG;a,rG;a,%,t&;i4ll9UnG;a,iG;ca,ka,que;a,chOkaNlJmi,nIrGtzi;aG?m;!n8;a,dy,>va,h,n2;a,dIica,lG;iGy;c)t,e;red;!e6;ae6$3G;ag#,gKi,lHrG;edith,*Fyl;#2iGliF;nGsAJ;a,<;!#,h#;b08c9Bd06e,g04i03l01nZrKtJuHv*,x85yGz2;a,b$l,/;de,rG;a,eD;h74~8t2;a,cSgOiJjor2l6In2s5tIyG;!aGb+h,jaAlou;m,n9P;a,ha,i0;!aIb$,eHja,lC%,sGtza;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeH(,oGr3Kue-9;!t;!ry;+3IiB;$Gi61y;a,l1;dG=,ue6;akr#By;iGlory;a,ka,n8;a,re,s2;<Gg2;!l2W;alCd2$Gge,*=,=0;eiA.1];$,&;a0Ie08iWoQuKyG;d3[,nG;!a,dHe9PnGs@;!a,e9O;a,s@;#n,cJ$IiFlH%,pGz;e,iB;a,u;a,[;iGy;a2Ae,l25n8;*,l1GrHtt2uG;$6*1;aIeHi7%,rG;a6Xi7;&i,n1tB;!.1;aQbPd3lLnIsHv3zG;!a,b+h,+9z2;a,+9;a,dG;a,sGy;ay,@,i,y;a,?IlG;iGy;a8De;!n4F;b7Q>ty;!n5Q;aN<,e0iL[,nKoIslAOtGx2;iGt2;c3t3;[,nG/;a,(,o4;a,or1;a,gh,[G;!ni;!h,nG;a,d4e,n4N;cNd=7Pi6kes5rMtKurIvHxGy6;mi;>n1.3;a,eG(,];l,n;as5*5oG;nya,ya;a,*F;@,(,y;aZeUhadija,iMoLrIyG;lG/;a,ee,(;*tGy5A;a,),iGy;!e,n48;-,urtn@;aM>L&y,mIrGzzy;a,stG;),.;!b>lG;eGi,y;e,y;a,stD;!%,/;$6MiJlInHrG;a,i,-;d4%;@,i,l9Ns2y;/,s5;c@,i5UlO^6nyaku^-,rMss5JtJviByG;!e,lG;a,eG;e,igh;a5CeHhGi3PlC-0y;ar5A>5A(,&Dr9Cy;!l]70;a,),iGl4T];!^,n31sF;eigh,i,l2;a04eV~ToMuG;#KdJliGst54;aHeGsF;!nAt0W;!n8U;ith,y;a,iB;!#Lc$Cd5S$&,h#6FlJni,sHva0yG;a,_;eG(;fi0lCph4V;eG(;),n1;!a,e,n36;!i#,lG;!i#;#L&0nIrHsG;ica,sica;i,-;!a,$&,if>,nG;a,+9iGy;!e,f>;a,e6ZiHnG;a,e6YiG;e,n1;cLd1mi,nHqu$iAsm.2Uv(4yAzG;m.7;a7eHiG;_,e,n1s;!lGsFt06;e,&;.Hk2lCqu$G;.1];<,`;<,lPmNnMo0rLsHvaG;!%;aHiGob$;do4;!b$Gdo4;!a,e,l2G;)1i0^;a,di4es,g-d;$8ogG;)1;a,eA?0o0se;aNeK~HoGyac.th;ll2rt)se;aHdG[H;a,egard;ry;ath>,iHlGnr(tBrmiAst>;)24ga;di;i&y,lKnJrGtt2y&y,z$;iGm=y,-4D;+G;!te;aE%E;@,l2;aYeTiOlMold12rIwG;)G]+h;!dolC;acH+G*$8;a,chD;e,(G;![;adys,)Gor3]*;a,<,%;aJgi,lH%,ov6Ys$G;a,e,&;<,liG;#;!n0;mYnIorgHrG;ald33i,m2Rtrude;+9i0;a,eG%;s*,v(ve;b-$3C~,&,rn+,y&;aReOio0loMrG;#He8iG;<,e8;!cG;esHiGo*e;n1sca;!ca;!rG;a,)_;lHrnG;!#8;ec3ic3;rHtiGy7;^;ah,/h;d0Fi&DkBl00mUnid,rRsMtLuKvG;aI$HiG;e,`;.0A];!ng$2F;g)i1[,ni_;h$,`;me/l8p>#JtG;eHhGr$6;>;l2Mr;za;iG^,nest27];cGka,n;a,ka;eJ~ImG;aG(,y;!liA;ee,i1y;lG/ld;<,y;aTeRiMlL^,no4oJsIvG;a,iG;%,/;a,(;iGuiG;se;),(,y;a0c3<,nJsGzaH;aGe;!beG;th;!a,or;#or,nG;!a;.1%;),iG%,wi0;e,th;aWeKiJoG;lores,m.ique,n2XrGtt2;a,eD*,[,othGthy;ea,y;#08%E=Ax2;#PbOde,eNiLja,lIm+r3nGsiree;a,iG;_,se;a,iH[,orGphiA;es,*;a,[h;dGrdG;re;!dee,%;!b29o/E/;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1TyG;&,%;a,by,cH?,lG;a,)1;@,(;a,+9iG;!ca,$17ka;arG?;*;a0Oe0Lh03i01lToIrH]G;di,th3;*2Ay03;lOnLrHurG;tn1B;aId26iGn26-A;!nG;a,e,n1;!l1Q;n2sG;t#Gu$o;_,za;eG&D;),t9;aIeoHotG;~de;!pat4;ir7rIudG;+9iG;a,ne;e,iG;_,sX;a4>4ndG;i,y;aPeMloe,rG;*HyG;s`l;sy,tG;aH),iGy;!#1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;*JlHmG;aiA;a,eGot9;n1t9;!sa;d4$&,tG;al,$&;cGli3E;$3~G;e,?,y;iXlWm~VndUrNsLtGy6;aJeIhG-0;>G&DrCy;.1;-0;li0-0;a2FsG;a2E(;a,iLlJm$IolHrG;(,ol;!e,.1];!a,[;a,eG(,y;ne,y;%,sF;a_,i_;a,e,l1;*Bl2;tlG;.,];arb0CeYi#XlVoTrG;#dRePiIoHyG;#0nn;nwCok7;#2NdgKgid,tG;n@,tG;!aHnG;@,i,y;ny;+G;!t7;#0e,nG;<,%;i7y;bbi7nG;iBn2;#cGossom,ytG;he;ca;aRcky,l.8niBrNssMtIu[EvG;!>lG;@,y;hHsy,tG;e,i0Zy7;!#G;(,y;!(;nGt5yl;adHiG;_;+9iA;!t-G;_,z;a4(,/;aliyah,b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;#Ges5;a,%;a,-l;drIgusHrG;$3;ti0;a,@,i,y;hHtrG;id;aKlGt=;eHi7yG;!n;e,iGy;gh;!nG;ti;iI&HpiB;`;),n1t9;#19$G;&;aYdWeUgQiOja,nHtoGya;.+9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!b$HliFmT;sa;!&;ka,sG`;a,sa;$G(;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;[;bHmGs`s3;ar3;$;aIb>H$3iGy;e,%;!ly;l3n8;<;aTba,eNiKlI^,yG;a,c3sG;a,=,sa;iGys=;e,s=;a,cH%,sGza;a,ha,=,sa;e,?;c3*5jaI%,ssaIxG;aG?;!nd4;nd4;/;?;i0nHyG;ah,%;a,*,%E;c5<,&DmLnslKsG;haElG;.GyW;g,n;!h;@;ee;);at5g2nG;es;(;ha;aVdiS$LrG;eIiG;#L)G;a,e,ne;#0;%;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;=;];!lG;iA];ne;agaJbHiG;!gaI;@,i7y;!e;~;ah",
    "MaleName": "true¦!1:#$%&()*+-./<=>?@[]^_`~:an,on,ar,er,is,nd,as,en,st,ie,ri,in,ol,ha,al,us,th,or,il,nt,le,ia;0:C9;1:BG;2:BX;3:BO;4:B0;5:BU;6:AO;7:9Q;8:B8;9:AS;A:AJ;B:9D;aB0bA4c93d84e7Ef6Xg6Fh5Vi5Hj4Kk4Al3Rm2Pn2Eo28p22qu20r1As0Rt07u06v01wOxavi3yHzC;aC]0;cChid,ne;hDkC;!%y;%50&y;*s2i,oDuC;sEuma;nFsE@C;oCsD;uf;ef;at0g;aKeIiDoCyatt;lfg#g,odrow;lCn1O;bEey,frBFlC;%d,iC;am,e,s;&t,ur;i,)e7sC;!l6t1;de,lDrr5yC;l1ne;lCt3;aBy;aF&n1iC;cD>0nceCrg^,va0;!_;+te,t];l+t<48nBughn;lysses,sm0;aUePhLiJoFrDyC;!l3ro8s1;av(,eC(t0oy,um0;_9Ev],y;bEd7TmCny;!*,mCoh%u;*o,.,y;i*,y;mCt9;!my,o[y;adEeoD~go,omC;!*;!d]e;!de9;dFrC;+BrC;#BeCy;ll,nB;!dy;dgh,ichi,nn3req,ts44;aRcotPeOhKiIoGp+c3tCuraj,ylve8Dzym1;#EeCu%t;f0phABvCw%t;e56.;!(law,l6;lom1nny,uC;`yma8ta;dCl*,m1;!n6;aEeC;lCrm0;d1t1;hid,ne,qu0Uun,wn,y8;am9b*ti0kou,lim,rgio,[,ymour;!tC;!.,y;lDmC_<o,qib,ul;!mAu4;ik,vat]e;aXeThett,iPoGuDyC;#,ou;b6IdDf9p&t,ssC;!elAF;=ph,y;#,bJcIdHel,geGh0l#d,mFnEry,sDyC;!ce;coe,s;?d,nA;#,eo;lio,r;e4Qg3n6=fo,/go;co,ky;bAe9R;cCl6;%do,c5LhDkC;!ey,.,y;%d,.;gDid,ub5x,yCza;#sh,nT;g.,iC;n?d,s;chid,fa4lEmD)Cp>4s>d,ul,ym$d;?9V=ph,y;iro,$;f,ph;+t2<C;cy,t1;aGeEh^Di&re,=,reC;-1;!ip,lip;dro,rcy,tC;%,e2V;blo,draig,t44ul;ctavio,liv3m93rGsDtCum%,w5;(,to;aDc%,vC;?do;ma;i,vK;a[KeIiEoC;aCel,l0ma0r2X;h,m;cDg4^o,kC;h^,=a;h=*,kC=*;!=*;?,d,^,ls1vC;^`;#Cy;!a4i4;aXeUiLoGuDyC;`s,r1;>mDrad,-aC;fa,p>;ed,mG;dibo,e,>mE(es,_DsC@sa;es,he;e,y;ad,ed,mC;ad,ed;cHgu4kFlEnDtchC;!e7;ato,ik;ho@e,o04t1;e,=C;aj;ah,hCk6;a4eC;?,l;hDlv2rC;`,/7v2;di,met;ck,hOlMmPnu4rIs1tEu/cDxC;!im^i#89we7;e,io;eo,hDi*,tC;!eo,hew,~;eC(;@,w;cEio,k83lDqu(,s>7tCv2;i2Hy;<,$;!el,oL@;achCc=m,ik;ai,y;amCdi,moud;adC;ou;aReOiNloyd,oJuDyC;`,)1;cFiEkC[3;aCe;!s;gi,s;*,~C;no;g0nn.,r+EuCwe7;!iC;e,s;!zo;am,$4;a78evi,l#d,nD$C-3vi;!a5Yel;!ny;mDnCrry,ur4Rwr4R;ce,d1;%,$t;aJeE>`d,iCr(t4Tu46y`;&0p,rC;by,k,=los;+0iFnCrmit,v2;!dDnCt5A;e[,y;a7/ck;r,[;nata,rC[em;im,l;aZeRiPoEuC;#,liC-2;#,@;aqu2eKhnJnHrFsC;eDhC~h,ue;!ua;!ph;dCge;#,i,$;!aCny;h,s,[4V;!a[4U.,nA;!l,sCy;ph;#,e,mC;!mA;d,ffHrEsC;sC@;!e;?d,emDmai8oCry;me,nimo;~h,y;!&y,rC;ey,y;cId5kHmGrEsDvi3yC;!d5s1;$,p3;ed,od,rCv(;ett,od;?,es,(1;e,ob,ub;k,ob,quC;es;aObrahNchika,gLkeKlija,nuJrHsEtCv0;ai,sC;uki;aC>0~h,ma4sac;ac,~C;h,s;a,v<Cw2;!g;k,nnguaq;!r;nacC];io;im;<,n;aKeG<ata,oEuCyd%;b&t,gCmb&to,sE;h,o;m3raBsCw%d;se2;aEctDitDnry,rC;b&t,m0;];[;bLlKmza,nJo,rEsDyC;ato,d5;#,s0;lF=d,rEuCv6;hito,ki,tC;a,o;(1y;#,ey;k,s;!im;ib;aReNiMl+LoJrFuC;^l&DsC;!tavo;mo;aEegCov3;!g,]C;io,y;dy,>m,_;nzaCrd1;lo;!n;lbe4Ono,ov#ni;ne,oErC;aCry;ld,rd4S;ffr6rge;b/4l5rCv2;l#d,r3C[,y;aReOiMlK]r0HrC;#EedCitz;!dAeC/ck;/ck;cEkC;!.,lC;<,yn;esJ(C;!co,zek;etch3oC;yd;d4lC$n;ip;d&iDliCng,rn#do;pe,x;co;bi0di;%ZdUfrTit0lNmHnGo2rD-eb0[0uge8vCym5zra;#,&ett;gi,iDnCr=,v2w2;e-44.;c06k;och,/que,zo;aG&FiDmC;aFett;lCrh0;!io;s1y;nu4;b&t,d1iFliEmDt1viCwood;n,s;&,o;ot1Ts;!*,jah,sC;>;a2+;!dAg%,mFuDwC;a25<;%C;do;$d,u);l,nC;e-;aYeOiLoFrEuDwCyl0;ay8ight;a8dl6nc0-2;ag0ew;m<icGnE/0ugDyC;`;!l*;!?d,nCov0;e7.,y;!k;%muDeCll1$,rk;go;id;#Jj0lbeImet/9nG$,rFsEvDwCxt3;ay8ey;+,<;>wn,m$d;ek,/ck;(,nCv3;(,y;rt;!dC;re;lLmJnIrEvC;e,iC;!d;+,iEne7rCyl;eC<,yl;l2Wn;n,o,@;e,i4ny;iC$;#,+,$;e,lC;*;a07e05hXi%0lMoHrFuDyrC;^,@;rtC;!(;aC(tob?;ig;dy,lFnDrC;ey,neli9y;],rC;ad;by,e,<,l2t1;aHeEiCyJ;fC_;f]d,t1;meDt9velaC;);_;rEuDyC;!t1;de;+B;ce;aGeFr(DuC;ck;!tC;i0oph3;-3;d,rlCs;eC.;s,y;cCd/c;^;lFm&1rC;ey,lDro7y;ll;!os,t1;eb,v2;%03eV^UlaToQrDuCyr1;ddy,rtJ;aKeFiEuDyC;#,ce,$;ce,no;#,ce;nDtC;!t;dDtC;!$;#,$;dD)C;+,$;!foCl6y;rd;bDrCyd;(;!by;i8ke;?,lA;nGrCshoi;at,nDtC;!ram;aC.;rd0T;!edict,iDjam2nA;.,y;to;n6rCt;eCy;tt;ey;%0Yb0Od0Kgu-2hm0Hid5j#i,l00mYnQputsiPrGsaFuDveCya0ziz;ry;gu-9-2;@;hi;aJchIi4jun,maGnE$,tCy0;hCuro;ur;av,oC;ld;#,);el;.;ta;aq;dHgel06tC;hoFoC;i8nC;!i03y;ne;ny;reCy;!*,s,w;ir,mCos;%;#,bePd5eJfGi,lF$Eph$It1vC;aN<;$;so,zo;#,+;$DrC;edQ;so;c,jaFks#dEssaFxC;!#d3;&;%,&;)C;ro;rtI;ni;+;ad,eC;d,t;<;aD=fC/0vik;!o;mCn;!a;dGeFraDuC;!bakr,lfazl;hCm;am;!l;?lFel,oulaye,ulC;!lDrahm0;#;ah,o;ah;av,$",
    "FirstName": "true¦:aFeBholiHlem,n5ol7rialb,si4y0;aGbleGdissac,e0llen,rrF;rbua,s0;a0lD;c,k;rk,xela;a2niuq,o0wahsal;i0v2;ram;g1v0;ed;er,rom;duj,i1n0;er,neyehc;m0ssej;aj,maj;e1rdna,ttayn0;ek;hs",
    "LastName": "true¦!1:#$%&()*+-./<=>?@[]:an,in,er,ns,li,ng,to,va,il,es,ar,en,hi,ch,ss,is,rn,as;0:2Z;1:36;2:34;3:2A;4:2T;5:2V;a36b2Wc2Jd2Ae27f22g1Wh1Mi1Hj1Bk14l0Wm0Mn0Io0Fp04rXsMtHvFwCxBy8zh6;a6ou,u;),o;a6eun2Pos=da,un;ma6);da,guc=,mo*,sh1YzaQ;iao,u;a7-6o4right,u;(36s2;gn0lk0),t#abe;a6i+ldi;?-jev,zqu1;a9h8i#,o7r6sui,u[0;#,yn@I;ls*y,rr.,th;at>0omps2;kah0Snaka,ylor;aD>Cemjon3=mizu,iBmiAo9t7u6zabo;/1l(v#,zuD;a6e$0;l$,rm0;sa,u4;[3th;l+,mmo&,)h;midt,neid0ulz;i*,n7sa6*;ki;>1dL*s,z;amBeag#,i9o7u6;iz,sD;b6dri1JgIj],m%o,osevelt,?i,ux;%ts,$s2;c6v%a;ci,h/ds2;ir1os;aEeAh8ic6ow1W;]6hl0;so;a6-(ps;m,n1P;d%s5et8r7t6;e0Lr3;ez,ry;%s;h1Xrk0t6vl3;el,te0H;baBg09(veiZr6;t6w1K;ega,iz;a6e-s2guy5ix2owak,ym#;gy,ka6;ji6muU;ma;aDeBiAo8u6;ll0n6rray,?ol$i,ñ6;oz;l$a,oIr6z/t;al.,eau,r@;hha-3ll0;rci0?i6y0;!%;eVmmad3r6tsu06;$,t$1;aCe8i6op1uo;!n6u;coln,dholm;fe7n$,r6w@;oy;bv6v6;re;mmy,rs5u;aB<nedy,imuAle$,o8u7wo6;k,n;m/,znets3;bay6+cs;]Y;ra;hn,rl9*,ur,zl3;aA<9ha4im<1o6u4;h6nYu4;#6&2;?2;k$s,s5;cks2&se&;gl.i9ke8noue,s=k7*,v#o6;u,v;awa;da;];aBe8it>cock,o7u6;!a4b0ghNynh;a4ffm#n,r+t;m$gw7nde6rM;rs2;ay;&5rrPs7y6;]D.;#3=6;moI;a9-,o8r7u6;o,ti%r1;ay(4ub0;m1nzal1;nd6o,rcia;=;%9lor8o7uj6;ita;st0u[i0;.;n#d1;d7$steGsposi6+K;*;@2w/ds;aBevi,i9om$8u6;bo6r#d;@;gu1;az,mitr3;ov;nkula,rw7vi6;.,s;$;aFhBl/kAo6;h5l6op0rbyn,x;em7(6;&;#;!e;#8e7iu,o6r@te&5u4we;i,),u4w,y;!n,on6u4;!g;mpb7rt0st6;ro;ell;aBe8ha4oyko,r6y[e;ooks,y#t;);ck7ethov5nnett;<;%,ham;>,h8-ey,[6;.,i0;%;k,);dDl9nd6;%s6rA;<,on,s2;on;eks7iy8+r1;ez;ej6;ev;ams",
    "Person": "true¦!1:#$%&()*:in,er,an, ro, w,es,ar;ashton kutchRbQcLdJeHgastMhF#ez,jDkClebron jam),mBnettIoAp8r4s3t2v0;a0irg# maF;lent#o&ssi,n go3;h$)a may,ig$(oods,yra b%ks;addam hussa#,c*lett joh%ssIlobod% milosevic,uA;ay&m%o,e)e(ith$spoHo1ush limbau0;gh;d stew*t,nald0;#ho,o;a0ipI;lmHris hiltC;prah(#frEra;)siaen,itt&mnDub*ek;%ye()t,ief$ suth$l%d,obe bry%t;aime,eff$s8k&wli0;ng;alle b$0itlBulk hog%;ry;ff0m$il lagasse,zekiel;ie;a0enzel(ash#gt2ick(olf;lt1nte;*1l#t0ruz;on;d#al(ols1son0;! palm2;ey;*ack obama,rock;$"
  };

  /* eslint-disable no-empty */
  const BASE = 36;
  const seq = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const cache = seq.split('').reduce(function (h, c, i) {
    h[c] = i;
    return h
  }, {});

  // 0, 1, 2, ..., A, B, C, ..., 00, 01, ... AA, AB, AC, ..., AAA, AAB, ...
  const toAlphaCode = function (n) {
    if (seq[n] !== undefined) {
      return seq[n]
    }
    let places = 1;
    let range = BASE;
    let s = '';
    for (; n >= range; n -= range, places++, range *= BASE) {}
    for (; places > 0; places--) {
      const d = n % BASE;
      s = String.fromCharCode((d < 10 ? 48 : 55) + d) + s;
      n = (n - d) / BASE;
    }
    return s
  };

  const fromAlphaCode = function (s) {
    if (cache[s] !== undefined) {
      return cache[s]
    }
    let n = 0;
    let places = 1;
    let range = BASE;
    let pow = 1;
    for (; places < s.length; n += range, places++, range *= BASE) {}
    for (let i = s.length - 1; i >= 0; i--, pow *= BASE) {
      let d = s.charCodeAt(i) - 48;
      if (d > 10) {
        d -= 7;
      }
      n += d * pow;
    }
    return n
  };

  var encoding = {
    toAlphaCode,
    fromAlphaCode
  };

  const symbols = function (t) {
    const reSymbol = /^([0-9A-Z]+):([0-9A-Z]+)$/;
    for (let i = 0; i < t.nodes.length; i++) {
      if (!t.nodes[i].includes(':')) {
        break
      }
      const m = reSymbol.exec(t.nodes[i]);
      if (!m || m[0].length !== t.nodes[i].length || encoding.fromAlphaCode(m[1]) !== i) {
        throw new SyntaxError('Invalid efrt packed data: symbol definition')
      }
      t.syms.push(encoding.fromAlphaCode(m[2]));
    }
    t.symCount = t.syms.length;
    t.nodes = t.nodes.slice(t.symCount);
    if (t.nodes.length === 0 || t.syms.some((index) => !Number.isSafeInteger(index) || index >= t.nodes.length)) {
      throw new SyntaxError('Invalid efrt packed data: symbol target')
    }
  };

  const unescapeLabel = function (text) {
    return text.replace(/\\([\s\S]|$)/g, (match, char) => {
      if (char === '\\') {
        return '\\'
      }
      if (char >= 'a' && char <= 'j') {
        return String(char.charCodeAt(0) - 97)
      }
      throw new SyntaxError('Invalid efrt packed data: label escape')
    })
  };

  const dictionary = function (trie) {
    if (!trie.nodes[0].startsWith('!1:')) {
      return
    }
    const header = trie.nodes.shift().split(':');
    const tokens = Array.from(header[1]);
    const fragments = (header[2] || '').split(',');
    if (header.length !== 3 || tokens.length === 0 || tokens.length !== fragments.length ||
      new Set(tokens).size !== tokens.length || trie.nodes.length === 0 ||
      tokens.some((token) => token.length !== 1 || token.charCodeAt(0) < 33 ||
        token.charCodeAt(0) > 126 || /[A-Za-z0-9,;!:|]/.test(token) ||
        (trie.versioned && token === '\\')) ||
      fragments.some((text) => !text || /[A-Z0-9,;!:|¦]/.test(text))) {
      throw new SyntaxError('Invalid efrt packed data: fragment dictionary')
    }
    trie.dictionary = Object.create(null);
    for (let i = 0; i < tokens.length; i++) {
      trie.dictionary[tokens[i]] = trie.versioned ? unescapeLabel(fragments[i]) : fragments[i];
    }
  };

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    const target = dnode < trie.symCount ? trie.syms[dnode] : index + dnode + 1 - trie.symCount;
    // The encoder emits nodes in topological order. Every edge must point
    // forward, which also rules out cycles before expansion starts.
    if (!Number.isSafeInteger(target) || target <= index || target >= trie.nodes.length) {
      throw new SyntaxError('Invalid efrt packed data: node reference')
    }
    return target
  };

  const parseNodes = function (trie) {
    return trie.nodes.map((node, index) => {
      if (node === '' && trie.nodes.length !== 1) {
        throw new SyntaxError('Invalid efrt packed data: empty node')
      }
      const terminal = node[0] === '!';
      const body = terminal ? node.slice(1) : node;
      const edges = [];
      // Match only at the current offset. Searching later positions would
      // repeatedly rescan a long malformed fragment before rejecting it.
      const token = /([^A-Z0-9,;!:|¦]+)([A-Z0-9]+|,|$)/y;
      for (let offset = 0; offset < body.length; offset = token.lastIndex) {
        const match = token.exec(body);
        if (!match || match.index !== offset || (match[2] === ',' && token.lastIndex === body.length)) {
          throw new SyntaxError('Invalid efrt packed data: node syntax')
        }
        const ref = match[2];
        const label = trie.versioned ? unescapeLabel(match[1]) : match[1];
        const text = trie.dictionary ? Array.from(label,
          (char) => trie.dictionary[char] || char).join('') : label;
        edges.push({
          text,
          target: ref === '' || ref === ',' ? -1 : indexFromRef(trie, ref, index)
        });
      }
      return { terminal, edges }
    })
  };

  const toArray = function (trie) {
    const nodes = parseNodes(trie);
    const all = [];
    const stack = [{ index: 0, pref: '', edge: -1 }];
    for (; stack.length > 0;) {
      const frame = stack[stack.length - 1];
      const node = nodes[frame.index];
      if (frame.edge === -1) {
        if (node.terminal) {
          all.push(frame.pref);
        }
        frame.edge = 0;
      }
      if (frame.edge === node.edges.length) {
        stack.pop();
        continue
      }
      const edge = node.edges[frame.edge++];
      const word = frame.pref + edge.text;
      if (edge.target === -1) {
        all.push(word);
      } else {
        stack.push({ index: edge.target, pref: word, edge: -1 });
      }
    }
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$1 = function (str, versioned = false) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0,
      versioned
    };
    dictionary(trie);
    //process symbols, if they have them
    if (str.match(':')) {
      symbols(trie);
    }
    return toArray(trie)
  };

  const unpack = function (str) {
    if (str === '' || str === null || str === undefined) {
      return {}
    }
    if (typeof str !== 'string') {
      throw new TypeError('efrt unpack expects a string')
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      if (arr.length !== 2 || Object.prototype.hasOwnProperty.call(h, arr[0])) {
        throw new SyntaxError('Invalid efrt packed data: category separator or duplicate category')
      }
      h[arr[0]] = arr[1];
      return h
    }, Object.create(null));
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      let data = obj[cat];
      const versioned = data.startsWith('!2;');
      if (versioned) {
        data = data.slice(3);
        if (!data || data === ':') {
          throw new SyntaxError('Invalid efrt packed data: missing versioned trie')
        }
      }
      const reversed = data[0] === ':';
      const arr = unpack$1(reversed ? data.slice(1) : data, versioned);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = reversed ? Array.from(arr[i]).reverse().join('') : arr[i];
        if (Object.prototype.hasOwnProperty.call(all, k)) {
          if (Array.isArray(all[k]) === false) {
            if (all[k] !== cat) {
              all[k] = [all[k], cat];
            }
          } else if (!all[k].includes(cat)) {
            all[k].push(cat);
          }
        } else {
          Object.defineProperty(all, k, {
            value: cat,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
    });
    return all
  };

  // the four parts of a model, in the order they are packed
  const sections = ['fwd', 'both', 'rev', 'ex'];

  // characters with a meaning in the packed format - words containing these cannot be learned
  const reserved = /[~|:,{}0-9]/;

  const decodeVal = function (key, str) {
    const m = str.match(/^[0-9]+/);
    const n = m ? Number(m[0]) : 0;
    const tail = m ? str.slice(m[0].length) : str;
    return key.slice(0, key.length - n) + tail
  };

  // apply a model to one word:
  //   1. whole-word exceptions
  //   2. the longest suffix with a rule (a rule may match the entire word)
  //   3. the '' rule, if any, as a fallback (a plain append)
  //   4. otherwise, the word is returned unchanged
  const convert = function (str = '', model = {}) {
    const { ex = {}, fwd = {}, both = {} } = model;
    if (Object.hasOwn(ex, str)) {
      return ex[str]
    }
    for (let len = str.length; len >= 0; len -= 1) {
      const suff = str.slice(str.length - len);
      const stem = str.slice(0, str.length - len);
      if (Object.hasOwn(fwd, suff)) {
        return stem + fwd[suff]
      }
      if (Object.hasOwn(both, suff)) {
        return stem + both[suff]
      }
    }
    return str
  };

  const flipObj = function (obj = {}) {
    return Object.fromEntries(Object.entries(obj).map(([key, val]) => [val, key]))
  };

  // swap the direction of a model
  const reverse = function (model = {}) {
    return {
      reversed: true,
      // these two work both ways
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // and the one-way rules trade places
      fwd: model.rev || {},
      rev: model.fwd || {},
    }
  };

  const invalid = function () {
    throw new Error('suffix-thumb: invalid packed model')
  };

  // suffix-trie → list of keys
  const unpackKeys = function (str, suff = '', out = []) {
    let i = 0;
    do {
      let chain = '';
      while (i < str.length && str[i] !== ',' && str[i] !== '{') {
        chain += str[i];
        i += 1;
      }
      if (reserved.test(chain)) {
        invalid();
      }
      if (str[i] === '{') {
        // find the matching brace
        let depth = 1;
        let j = i + 1;
        while (depth > 0 && j < str.length) {
          if (str[j] === '{') {
            depth += 1;
          } else if (str[j] === '}') {
            depth -= 1;
          }
          j += 1;
        }
        if (depth !== 0 || (j < str.length && str[j] !== ',')) {
          invalid();
        }
        unpackKeys(str.slice(i + 1, j - 1), chain + suff, out);
        i = j;
      } else {
        out.push(chain + suff);
      }
      i += 1; // step over the comma
    } while (i <= str.length)
    return out
  };

  const unpackSection = function (str = '') {
    const obj = Object.create(null);
    if (!str) {
      return { ...obj }
    }
    str.split('|').forEach(group => {
      const i = group.indexOf(':');
      const val = group.slice(0, i);
      const count = val.match(/^[0-9]+/);
      if (i < 0 || !count || reserved.test(val.slice(count[0].length))) {
        invalid();
      }
      unpackKeys(group.slice(i + 1)).forEach(k => {
        if (Number(count[0]) > k.length) {
          invalid();
        }
        obj[k] = decodeVal(k, val);
      });
    });
    return { ...obj }
  };

  // one string → model
  const uncompress = function (str = '') {
    if (typeof str !== 'string' || str[0] === '{') {
      throw new Error('suffix-thumb: uncompress expects a packed string. Models made before v6 must be learned again.')
    }
    const parts = str.split('~');
    // Preserve the empty/default input shorthand for an empty model.
    if (str !== '' && parts.length !== sections.length) {
      invalid();
    }
    const model = {};
    sections.forEach((s, i) => {
      model[s] = unpackSection(parts[i]);
    });
    return model
  };

  // generated in ./lib/models
  var model$1 = {
    "nouns": {
      "plurals": "1ones:uija,visa,mará|0s:o{rerer,riac,áce{st,et,ubi}},n{fa,so,fo,to,i,r},r{nio,onso,sca,e{más,ell,rill,ail,t{as,ás,in,t,o},iv,ov,emi,ff,ó,g,ak,ok,z,p},ou,eu},l{ppe,oo,mai,tai,l},d{ra,le,n,ai,r},sey,oy,ay,sch,ech,ah,í{nd,squ,rr,br,f}|1as:o{ecer,utic,otec,ijad,jul,pectiv,áce,tí}|0nes:stio|0es:n,fin,rin,r,ráter,l,d,s,ori,j,h|1es:lord|2ises:ís|2ases:ás|2oses:ós|2as:tum~0s:|1as:o{i{oiran,r{igato,a{vern,rt,unit,nsignat}},soc,ones,lib},ñorit,ncit,chat,m{rdo,pti,nési,ji},c{i{itón,élt,vét,ént,h,na},ola,men,man,tos,vas,lu},gueñ,diñ,er{n{ca,ia,sardi,gi,nto},billet,cost,part,elad,rand,cal,stal,otel,vi,itr,er,oníf,im,erm,nsaj,tranj,ch{ran,fle,ru},risqu,cas,fres,bañ,eañ,cob},d{iun,i{rd,fr,saparec,ev,romet},a{esur,poder,udic,umin,i{ileg,soc,denunc,n},scuid},iu},ntáne,óne,maj,coj,mplosiv,uap,illiz,ueriz,n{xter,a{i{a,enc,uc,us,sor,ston},evill,git,ropolit,ub,glic,osc,of,ns},i{vant,gent,negr,ter}},edófil,upl,tu,s{rreligio,acio,camo,ivi,rru},cieg,eig}|1etas:triplo,erpa|1itas:a{tav,canill,canan,nn,rud},gordo|3itas:iíta|4íacas:iaco|0as:or{d{a{usc,t{limen,sen,cor,os,l},nz,traliz,r{gu,ar,ust,prepa,fo},ep,hup,aquil,cav,us,res,vas,nu,deñ,ade,rre,nch,sion},mpeti,ati,pende},ecolect,seduct,oemis},gial|2onas:risón,llorón|1onas:apera,uaja|5inolonas:ínola|2quillas:ranca|1illas:jara,iralda|2esas:és{am,irland,n{elo,eo,va,e}}|0itos:nopal,lob|1itos:ruque,o{brac,uine,ochin,zcoch,ntoj}|0citos:rqueo|2itos:ejío|0zos:cerola,cadera|1azos:aquillo,mporro,ampano|1icos:lao|1uelos:ontero|1illos:jopo,neco|0cillos:picor|2ones:ón|0nes:o{erni,blaz,bastr,jug,imat,bis}|1ones:a{hasc,fac,rasp,aleg,uat,pent,pris},luge|4ánones:anon|2enes:én|4ígenes:igen|4ágenes:agen|5írgenes:irgen|5árgenes:argen|5órdenes:orden|4ímenes:imen|6egímenes:égimen|4úmenes:umen|4ámenes:amen|5érmenes:ermen|5ólmenes:olmen|4ómenes:omen|4óvenes:oven|5íquenes:iquen|2anes:án|2ines:ín|4ítines:itin|2unes:ún|1ces:z|1ares:eá|5acteres:ácter|0es:bort,agot,imut,aís,lub,ey,voy,m{bu,ma,te,he},x,ú{d,ab,g,h,t,ap},í|0otes:camal|2onotes:ocón|1es:bcomité|4ijoles:íjol|2eses:és|2uses:ús|1ies:y|1is:rry|6amsters:ámster|4aters:áter|4asars:ásar|7slogans:eslogan|4orums:órum|0er:ied|2a:lum|5anta:ántum|5sdalgo:odalgo|6s-museo:-museo|1i:eu~2o:as{dinari,scret,ocit,tent,umátic,céutic,apotec,loter,vecer,ad{ibr,mand,hij},áce{l,ut,rt,bi,n,lic,m},espectiv,rican,buel}|4a:s{a{parret,acit,ilot,linic,llej},ivisone}|2um:uantas|1:s{a{ochic,peluc,er{onton,scal,istal,uim},érdid,e{antán,lác{su,a}},scoj,gencian,tatu},panecillo,e{n{pe,ne,oci,ei,zi},c{l,go,la,gua,n,au,i{ár,sp,d,rt,pl,él,íl,f,b},r},r{wa,íte,éne,pe,ai,ñi,pu},l{le,rtza,ai,sfi,hi,érbo,pro,do},aud,sed,pos,i{p,er,ur,c,g,ol},matí}}|4:mucas|2:s{utadora,e{n{ilio,ie,tre,ye,a{pl,óg,k,j},cri},r{o,a,e,i,u,ú},l{e,a,i,o,u,ú,í},d{da,ta,ba,li,di,u,e,ú},s{ie,gu,ga,ma,i,o,val,as},rcaj,loj,aori,h{oac,wic,tc,s},a}}|5a:as{nuch,ill{tad,mot}}|4e:itos{tall,aqu,ibr}|3o:toritos|4o:meritos,aficos|8ón:otoncillos|5cio:tzios|3:aestiones|3z:dices{en,r}|4ás:mpases|4ís:ises{n,mb}|4ós:oses{idi,ad}~0es:d,vid,s{me,re,bu,a},n{a{cl,fl,p,c},fi,o{d,i,n,cl,r},ge},rail,a,b,ch,inch,c|0s:e{cin,marin,en,c{ro,ápi,du,a},l{o,tro,a,va,e,de},er},bañera,laico,star|1as:o{tí,chin,african,abuel,mul,esdrújul,discret,mocit,content,ad{mand,am,libr},reumátic,ordinari,loter}|0as:ador{comput,cel}|1icos:grafo|1illas:mota,sentada|1es:lord|1ejas:calla|5anulocitos:ánulo|1etes:té|1itos:mero,libre,taque,talle|1etas:caparra|1ones:ce,erre,cha,guija,mará|0azas:n|3tzios:hercio|1otas:hila|1uchas:pana|0ucas:m,l,r|1ejos:no|1tos:torio|1icas:clina|1itas:taca|2oncillos:botón"
    },
    "adjectives": {
      "f": "0a:|5a:ísimo{pt,ct,n}|5ia:rísimo|1a:úbito,e|5ológica:cólogo|2ana:án|2ina:ín~1a:o|1ísima:iejo|2ona:ón|1illa:paso|1ica:britano,mago|5ofílica:drófilo|6artarica:ártaro|5osofica:ósofo|4íaca:giaco|1ita:oreno|7ófita:ofítico|2esa:és|7ultiplaza:últiplo|3a:bito~1:a{r{ime,rce,o{d,t,s,ñ}},uen,ñol,ial,uz}|1o:a{odor,n{ari{m,s},to,cro,fo},es{il,ru,r,p,i,b},fob,omb}|1ísimo:mena,octa,brupta|3án:ana{em,lm,rdi,tal}|3ín:ina{ar,lorqu}|3ón:tona{e,u}|2ísimo:umaria|4o:nilla|7ólogo:usicológica|1e:onota~1illa:pino",
      "mp": "0os:|5os:ísimo{pt,ct,n}|5ios:rísimo|0s:úbito|5ológicos:cólogo~0s:o,e|4havos:tavo|5ofílicos:trófilo|1icos:ofo|4íacos:giaco|1uitos:amigo|1tos:lacio|3os:bito|0es:l,or|2eses:és|2anes:án|2ones:ón|2ines:ín|1ces:z|0tes:horo~2:os{imer,rcer,uen}|2ísimo:os{men,oct,brupt}|3ísimo:umarios|8ólogo:usicológicos|4o:azos|1:bos{fo,om}|3:nones~1azos:lato|0nes:cano",
      "fp": "0as:|5as:ísimo{pt,ct,n}|5ias:rísimo|1as:úbito,e|5ológicas:cólogo|2anas:án|2inas:ín~1as:o|1ísimas:rboso|2onas:ón|4havas:tavo|1ecillas:uerdo|5onímicas:inónimo|5ofílicas:drófilo|1icas:mago|4íacas:giaco|1ucas:lmo|1itas:gordo,vano,holo|7ófitas:ofítico|2esas:és|1ejas:tordo|7ultiplazas:últiplo|3as:bito~2:as{r{ime,rce,o{d,t,s,ñ}},uen,ñol,ial,uz}|2o:as{odor,n{ari{m,s},to,cro,fo},es{il,ru,r,p,i,b},fob,omb}|2ísimo:as{men,oct,brupt}|4án:anas{em,lm,rdi,tal}|4ín:inas{ar,lorqu}|4ón:tonas{e,u}|3ísimo:umarias|8ólogo:usicológicas|2e:onotas~"
    },
    "presentTense": {
      "first": "1nho:r|2o:r{a{ncost,reneg,vend,scord},e{,end{nsc,ac,st,et},rret,at,rt,pel,oz},i,leti,ivi}|3ío:safiar|6uestro:ostrar|4iego:egar{n,pl}|5ienso:epensar|2io:ear{t{ha,co,s,en},elin,and,cad}|3ço:cer{,e{fal,ol,el,nd,rn}}|3zco:ecer{r,ndur,oscur,nt,l,d,n,iqu,laqu,j,p}|2go:ner,aler,alir|3jo:ger,gir|1jo:tever|3go:zer|3o:uer,guir|4ito:etir|5isto:estir|4imo:emir|4igo:ecir|4ijo:egir|4ido:edir|5igo:eguir|4iro:erir|4ibo:ebir|4ulo:olir|3uyo:üir|2igo:ír|2onho:ôr~2o:r{a{,emend,e{t,nc,uc,es,pas,l,r{c,ar,o,ast},sm,n,qu{lan,o,sa},d,j,lp}},e{met,olv{bs,ss,senv}},ui{bstit,imin,ol,s,etrib,fr}}|3zco:cir,acer,ocer|6urco:orquir|5uelco:olcar|8me quejo:quejarse|8me alejo:alejarse|1jo:rover|5irjo:vergir|5irjo/emerjo:emergir|5irjo/submerjo:bmergir|5quepo:caber|11me preocupo:preocuparse|5ispo:espir|5iento:r{enti,enta{as,l,ec,ev}}|8me siento:sentarse|5into:entir{sm,ss}|10me levanto:levantarse|5uesto:ostar{c,ap}|9me acuesto:acostarse|5iesto:festar|5ierto:r{erti,erta{sp,c}}|5uelto:soltar|4ieto:apretar|5icto:ectir|4uebo:probar|4íbo:ibir{oh,o}|9me afilio:afiliarse|3ío/palio:paliar|1o:orrir,air,prever|2io:ear|1io:crer,ler|5ierro:errar{c,nt,s}|5iebro:uebrar|6iembro:sembrar|5ubro:obrir|4iero:erir{u,h,pref,ug}|4üero:agorar|4uero:orir|9me retiro:retirarse|3iro:erer|2igo:aer|2go:enir|3go:acer{f,h}|5uelgo:olgar|5ienzo:enzar|3zo:vencer,jercer,rcir|5üenzo:onzar|5uerzo:orzar|4iezo:pezar|4uezo:cocer|4ízo:aizar|3úo:uar{d,t{si,c,en,pe},n,l}|5iendo:r{enda,ende{c,t,ef}}|5indo:endir|9me olvido:olvidarse|9me decido:decidirse|10me suicido:suicidarse|5uerdo:order,cordar|5ierdo:erder|4uedo:oder,rodar|8me quedo:quedarse|5ueldo:soldar|4údo:saudar|5uermo:ormir|4ieso:esar{nf,v}|7me caso:casarse|4úso:husar|5usso:ossir|4ueso/engroso:rosar|3ío:r{eí,ia{u,var,nfr,nv,sv,vac,roc,pl,sp}}|2yo:uir|4uelo:oler,volar|6iemblo:emblar|5ueblo:poblar|5íslo:aislar|4iño:eñir|4ueño:oñar|5ierno:ernir,obernar|4ueno:sonar|4ino:evenir|4úno:aunar,eunir|1nho:ter|2enho:vir|5uelvo:olver|5iervo:hervir|5irvo:servir|4uevo:over,enovar|6e muevo:overse|3úo/adecuo:decuar|3ço:r{e{rec{r,lvo,u,d,g,fe},faz},simpedi}|3ço/oiço:uvir|4é:aber|4e:haber|4ei:aver~3cer:ezco|2ger:jo{rote,emer,co,an}|2r:evejo|3egir:ijo{r,el}|2gir:jo{i{ir,er,x,l,d},oa,era,ea,r,fu,n}|1ar:o{orj,rranj,t{rien,vis{tre,a},apar,mi{i,vo,a},dic,reba,escu,ecu},rrib,mai,nsai,heir,mendig,d{sven,brin,uci,que,salu},aviv,eç{r,om,p}}|1er:o{omp,vert,erret,bat,eb,orb,amb,r{of,var,cor,mor},coz,d{en,pon,con,ce,fe},m{te,pre,tre,co},epel,e,tañ,ench,colh,v{fer,or,nvi,re,de},mex,rro,mo}|1ir:o{ump,scup,usp,t{aran,sis,xis,par,mi,dimi,fle,mba,cu},ib,sub,cumb,r{uf,ut,bur,cur,neg,scub,ab,ui,ump,sup,ud},duz,d{n{pa,ci,nfu,ifu,hu},i{iv,c,col,s},ña,va,ua,cu,lu,lau,lo},m{ri,exi,di,su},ull,umpl,upl,ruñ,pun,defin,viv}|5entar:tiento|5ontar:cuento|4estir:visto|3etir:ito{err,mp,ep}|3ebir:ncibo|6ostrar:muestro|6ontrar:uentro|5errar:yerro|3erir:iro{d,f,g,s}|3ír:oigo|7er:o/roigo|3ecir:digo|2zer:ondigo|3eguir:sigo|2er:ngo{po,te},soy|1uir:tingo|4egar:iego|3gar:uego|4ogar:ruego|2ir:salgo|5orcer:tuerzo|3edir:ido{p,r}|3emir:gimo|5ensar:ienso|2iar:fío,crío|3üir:guyo|3olir:engulo|5oler:huelo|4elar:ielo|3r:ponho|2cer:ço{e,en,tor,er,s}|2ar:oy|3ir:voy~2voy:ir|2oy:ser,dar,estar|3ío:iar{conf,cr}|5ienso:pensar|5uerzo:torcer|2o:r{e{barr,le,cre,ard,cos,gem,lam,reviv,tej},i{un,cubr,bat,lat,curt,esculp},a{rim,sum,salient,su}}|4iero:querer|5yerro:errar|4ido:medir|3ego:jugar|5iento:entar{s,t}|6uentro:encontrar|4huelo:oler|2go:valer|4uego:rogar|4ielo:helar|4iego:regar{,f}|5uento:contar|1o:ver,rir|3zco:abastecer|4ulo:olir{ab,p}|3jo:r{agi,rugi,ege{el,r}}|3o:erguer|2onho:pôr|4imo:premir|1jo:rever|2o/roigo:roer|5ierto:verter",
      "second": "1s:r{a{ncost,err{at,b,f},reneg,emend,vend,scord,e{t,nc,uc,es,pas,l,r{c,ar,o,ast},sm,n,qu{lan,o,sa},d,j,lp}},e{end{nsc,ac,st,et},at,rt,olv{bs,ss,senv}},i{u{fr,bstit,imin,etrib,s},orr,a}}|5ientas:entar{as,l,ev,ec}|3ías:iar{roc,vac,u,saf,nv,sv,var,nfr,sp,pl}|6uestras:ostrar|4iegas:egar{n,pl}|5iensas:epensar|2ias:ear{t{ha,co,s,en},elin,and,cad}|3s:haber|2ês:er{cr,tev,rov,rel}|2es:ir{,t{ssen,smen,le,nves},ssegu}|5istes:estir|4iges:egir|4ides:edir|4ienes:enir|4ibes:ebir|3uyes:üir|2ões:ôr~1s:r{,ete{m,rr}}|5uelcas:olcar|8te quejas:quejarse|8te alejas:alejarse|11te preocupas:preocuparse|5uestas:ostar{c,ap}|9te acuestas:acostarse|5iestas:festar|8te sientas:sentarse|10te levantas:levantarse|5iertas:ertar{sp,c}|5ueltas:soltar|4ietas:apretar|9te afilias:afiliarse|3ías/palias:paliar|2ias:ear|5ierras:errar|5iebras:uebrar|6iembras:sembrar|4üeras:agorar|9te retiras:retirarse|5uelgas:olgar|5ienzas:enzar|5üenzas:onzar|4iezas:pezar|5uerzas:orzar|4ízas:aizar|3úas:uar{d,t{si,c,en,pe},n,l}|4uevas:enovar|5iendas:endar|9te olvidas:olvidarse|10te suicidas:suicidarse|5uerdas:cordar|8te quedas:quedarse|4uedas:rodar|5ueldas:soldar|4údas:saudar|4iesas:esar{nf,v}|7te casas:casarse|4úsas:husar|4uesas/engrosas:rosar|4uelas:volar|6iemblas:emblar|5ueblas:poblar|5íslas:aislar|4ueñas:oñar|5iernas:obernar|4uenas:sonar|4únas:aunar|4uebas:probar|3úas/adecuas:decuar|4íbes:ibir{oh,o}|5ientes:entir|5iertes:ertir|4ites:etir|4ueces:cocer|4ices:ecir|4ienes:ener|4ines:evenir|5iernes:ernir|4únes:eunir|4ieres:erir{u,h,pref,ug}|4ueres:orir|4imes:gemir|5uermes:ormir|4oges:fugir|9te decides:decidirse|5iendes:ender{c,t,ef}|5indes:endir|4uedes:oder|2es:ir{simped,gu,olu}|5ierdes:erder|5uerdes:order|2yes:ír,uir|5ospes:uspir|3íes:eír|5igues:eguir|2es/exturques:quir|5uelves:olver|5irves:servir|5ierves:hervir|4ueves:over|7te mueves:moverse|4iñes:eñir|4ueles:oler|4ules:polir|2ões:or|2és:prever|4ás:aver|3óis:oer|2éns:ter,rvir,ovir~6entar:ientas|1r:s{rienta,e{ert,abat,ebat,on,r{que,of,ar,or},g{e,emer,o,an},d{en,on,e,r},omp,rgu,el,val}}|6ontar:cuentas|7ostrar:muestras|7ontrar:uentras|6errar:yerras|5egar:iegas|4gar:uegas|5ogar:ruegas|6ensar:iensas|3iar:ías|5elar:ielas|2ir:es{ib,ub,umb,t,mit,uc,arc,n,r,im,um,g,d,cind,p,breviv,uv,uñ,l,uz,ss}|4ebir:ncibes|5estir:vistes|6orcer:uerces|5enir:vienes|4egir:iges{rr,el}|4edir:ides{p,m,r}|4üir:guyes|6oler:hueles|2ar:tás|2er:ês|2r:ns|3ir:vens~2vas:ir|3eres:ser|4iges:regir|3ías:iar{conf,cr}|5iensas:pensar|5uerces:torcer|4ieres:querer|5yerras:errar|2es:vivir,premir|3egas:jugar|5ientas:entar{s,t}|6uentras:encontrar|4hueles:oler|4uegas:rogar|4ielas:helar|4iegas:regar{,f}|5uentas:contar|2ás:estar|3s:haber|2ês:ler,rever|2ões:pôr|1s:rir,roer,salientar|1ns:ter|5iertes:verter|2ens:vir",
      "third": "1:r{a{ncost,err{at,b,f},reneg,emend,vend,scord,e{t,nc,uc,es,pas,l,r{c,ar,o,ast},sm,n,qu{lan,o,sa},d,j,lp}},e{end{nsc,ac,st,et},at,rt,olv{bs,ss,senv},oz},i{u{fr,bstit,imin,etrib,s},orr,a}}|5ienta:entar{as,l,ev,ec}|3ía:iar{roc,vac,u,saf,nv,sv,var,nfr,sp,pl}|6uestra:ostrar|4iega:egar{n,pl}|5iensa:epensar|2ia:ear{t{ha,co,s,en},elin,and,cad}|2ê:er{cr,tev,rov,rel}|2e:ir{,t{ssen,smen,le,nves},ssegu}|5iste:estir|4ige:egir|4ide:edir|4iene:enir|4ibe:ebir|3uye:üir|2:zir|2õe:ôr~1:r{,ete{m,rr}}|5uelca:olcar|8se queja:quejarse|8se aleja:alejarse|11se preocupa:preocuparse|5uesta:ostar{c,ap}|9se acuesta:acostarse|5iesta:festar|6 sienta:ntarse|10se levanta:levantarse|5ierta:ertar{sp,c}|5uelta:soltar|4ieta:apretar|9se afilia:afiliarse|3ía/palia:paliar|2ia:ear|5ierra:errar|5iebra:uebrar|6iembra:sembrar|4üera:agorar|9se retira:retirarse|5uelga:olgar|5ienza:enzar|5üenza:onzar|4ieza:pezar|5uerza:orzar|4íza:aizar|3úa:uar{d,t{si,c,en,pe},n,l}|4ueva:enovar|5ienda:endar|9se olvida:olvidarse|9e suicida:uicidarse|5uerda:cordar|8se queda:quedarse|4ueda:rodar|5uelda:soldar|4úda:saudar|4iesa:esar{nf,v}|7se casa:casarse|4úsa:husar|4uesa/engrosa:rosar|4uela:volar|6iembla:emblar|5uebla:poblar|5ísla:aislar|4ueña:oñar|5ierna:obernar|4uena:sonar|4úna:aunar|4ueba:probar|3úa/adecua:decuar|4íbe:ibir{oh,o}|5iente:entir|5ierte:ertir|4ite:etir|4uece:cocer|4ice:ecir|4iene:ener|4ine:evenir|5ierne:ernir|4úne:eunir|4ime:gemir|5uerme:ormir|4oge:fugir|9se decide:decidirse|5iende:ender{c,t,ef}|5inde:endir|4uede:oder|2e:ir{simped,gu,olu}|5ierde:erder|5uerde:order|2ye:ír,uir|4iere:erir{u,h,pref,ug}|4uere:orir|5ospe:uspir|3íe:eír|5igue:eguir|2e/exturque:quir|5uelve:olver|5irve:servir|5ierve:hervir|4ueve:over|7se mueve:moverse|4iñe:eñir|4uele:oler|4ule:polir|2õe:or|2é:prever|4á:aver|2:zer,erer|3ói:oer|2ém:ter,rvir,ovir|3/hay:haber~5entar:ienta|0r:rienta,e{ert,abat,ebat,on,g{e,emer,o,an},d{en,on,e,r},ofr,arr,orr,omp,rgu,el,val}|5ontar:cuenta|6ostrar:muestra|6ontrar:uentra|5errar:yerra|4egar:iega|3gar:uega|4ogar:ruega|5ensar:iensa|2iar:ía|4elar:iela|1ir:e{ib,ub,umb,t,mit,uc,arc,n,im,um,g,d,cind,r,p,breviv,uv,uñ,l,ss}|3ebir:ncibe|4estir:viste|5orcer:uerce|4enir:viene|3egir:ige{rr,el}|3edir:ide{p,m,r}|3üir:guye|5oler:huele|2ser:es|1ar:tá|0ir:uz|1er:ê|1r:m|2ir:vem~2va:ir|3es:ser|4ige:regir|3ía:iar{conf,cr}|5iensa:pensar|5uerce:torcer|4iere:querer|5yerra:errar|2e:vivir,premir|3ega:jugar|5ienta:entar{s,t}|6uentra:encontrar|4huele:oler|4uega:rogar|4iela:helar|4iega:regar{,f}|5uenta:contar|2á:estar|2ê:ler,rever|2õe:pôr|1:rir,roer,salientar|1m:ter|5ierte:verter|2em:vir",
      "firstPlural": "4emos:haber|2omos:ôr~1mos:r|8nos quejamos:quejarse|8nos alejamos:alejarse|11nos preocupamos:preocuparse|9nos acostamos:acostarse|8nos sentamos:sentarse|10nos levantamos:levantarse|9nos afiliamos:afiliarse|9nos retiramos:retirarse|9nos olvidamos:olvidarse|10nos suicidamos:suicidarse|8nos quedamos:quedarse|7nos casamos:casarse|7nos movemos:moverse|1mos/hemos:aver|9nos decidimos:decidirse|1mos/podrimos:drir|2ímos:ir{a,u{imin,s,etrib,bstit,fr}}~4er:somos~2vamos:ir|2omos:ser,pôr|4emos:haber",
      "secondPlural": "1s:r{,mi{opri,di,ssu,re}}|1is:r{a{c{i{f{i{ss,ecod,ed,id,dan,on,br,ac,pl,ual,t{or,quan,san,e}},a},bd,ejud,ompl,ripl,cl,rat,nt,rn},adu,hu,e,o{al,sl,t,tr,eb,fof,uf,s},smar,emar,for,fus,is,as,-ata,n},j{e,ele,ra,ga,ru,su,i,n},p{eci,ssi,escul,al,im,hu,socu,ou,ur,s},t{rap,ip,s{a{f,rr,v,p},ate,mpre,nco,go,ssu,cu,i,b},n{rgu,e{s{apre,o,s,i},m{ma,i,r,uple},ost,sc,g,u,b,li},ia,pa,ja,sco,ro,po},r{e{ap,fl,ons,es,b},o{dep,omp,up,f,x},u},o{ad,arr,h,c,ab,g},i{lev,hes,uis,ss,c{ncapa,xer,x,ssus},e,fr,rr,d,ig,ap,bil{ea,ssi},om},l{pu,ssa,xa,co,vo},e,rre,a{ltr,dr,m,b,nt,d,p,g,e},u},i{,c{en,efinan,sso,ma,ndi,li,bu},d{pu,a,se,si},ev,uv,xp,ip,ig},r{a{dep,ap,sc,s},o{im,omem,mpl,ig,rv,nc,h,i,ap,t},t{as,ns,ques,eencon,me,le,nfil,a},r{ate,be,fe,jo,a,u,i},imig,sinteg,b{m{eslu,so,me,le},do,no},i{nsp{o,a},at,e,a,ev},up,op,uad,e{sesp,mp,sacel,rig,sconsid,c,on,ven,in},u{nd,t{a,n,s,u},ap,eg,o,f,m},ecif,son,ac,v},g{i{mast,sl,rl,r},e{ren,r{ng,r,p,sf},c,h,s},u,bju,a{op,str,c,m,v},al,jul,o{dr,v,f,j},xer,n,gas},z{i{n{harmo,ro,ma,e,ter},r{ute,ve,o{it,g,sval,p},t,ia,cula},l{rti,sabi,obi,a{ntr,atu,gin,sin,nacion,ici,foc,v},po},t,otim,rm,rav,c},pre,le,va},u{t{bi,on,a,fe,u},zig,ag,rec,q,m,j,s},d{n{oma,bra,eme,ve,fu,do,so},ca,vi,eluci,ei,r{sco,sbo,eta,e},u{j,sa,sn,t},be,pe,ncomo,po,mol},s{le,ecu,ou,ran,rra,atra,li,ri,ui,scur,s},l{u{ec,ag,ssim,em,pit,at,ot,ab,d},i{sf,ep,ssim,st,ut,z,ac},o,a,sc,e{op,scong,t,r,s,z},uf},e{t{ha,co,s,en},ec,ac,s,r{er,a,est,f},om,em,elin,b,ranqu,faqu,gu,and,cad,z,g,x,h,mp},n{r{ibe,nte,ve,nto,bo},tu,o{i{c{ven,a,di,si,e,p,revolu},s{i,n,s,l},quest,p},r,f},e{nc,oord,i,z,dr,n},i{ncrim,germ,em,ioc,ac,tre,nf,ef,ss,ns,z,ob,d,pl,r},a{ng,b,pl,f},s},f,h{c{in,fe,o,ur},n,l},v{ur,o,ino,ne,tra,sca,ati,rqui,u},m{,fla,tra,defor,lar,acal,nti},b{lo,ba,sa,ga,m,u},x,o,ç},e{mbeb,ceb,mb,c{e{r{lvo,fe,r,u,d,g},t,fal,ol,el,nd,rn,u,o,m,f,h},or,xer,ten,s},leg,reg,ng,d{en{eapr,nsc,ac,st,ev,esp,e},e{ac,rc,ec,f}},erromp,r,t{eme,bme,rre,a,r},v{ol{bs,ss,senv},cre,de,r,i},rem,gem,z,h,o,u,x}}|2áis:ar{implific,fisc,rranc,j{e{d,ns,man,qu,l,par,ot,p},fi},t{trevis,uis,n{ime{l,er},afro},afei,edi,e{r,resp,pl,bj,uj,aqu},u{isfr,imp,sp,jec,cl,f}},i{c{,en{ci,fer,t,s}},d,u,saf,v,var,nfr,p,pal,pl,mb,g,om,n},r{nmasca,rast,gar,usur,asegu},jug,olong,eng,tiz{u,fa,te,n},vid{on,l},l{vo,io,tro,a{ñ,nt,g,sc,u,j},nte},ese,pase,oordin,nf,taf,nov,m{la,ra,r,l,ue,to,s,ti,xi,fu},tumb,nco}|2éis:er{ec{ndur,oscur,nt,iqu,laqu},rr{ba,reco,soco},met}|1des:r{e{cr,tev,rov,rel},orri}|1ndes:r{te,tervi,ovi,o}|2ís:ir{umerg,er{h,u,pref,ug}}|2ondes:ôr~2áis:ar|8os quejáis:quejarse|8os alejáis:alejarse|11os preocupáis:preocuparse|9os acostáis:acostarse|8os sentáis:sentarse|10os levantáis:levantarse|9os afiliáis:afiliarse|9os retiráis:retirarse|8s olvidáis:lvidarse|10os suicidáis:suicidarse|8os quedáis:quedarse|7os casáis:casarse|2éis:er|7os movéis:moverse|1is/heis:aver|1s:ir{ol,r{e,i,ob,eab,p,g,t},g{a,tin,un,i{ol,nfl,rr,d},er,fu},d{re,simpe,li,ilu,ssua,o},t{ssis,nves,ur,demi,smen,ssen,an,ncu,c,le},z,sp,lp,olu,ssegu,b{xi,ni,oi,m},uv,even,pun,s}|3is:quir|2ís:ir|9os decidís:decidirse|2ís/podrís:drir~2r:is|3er:ois|1r:mis,eís,oís|3r:des|4r:ndes~2vais:ir|2ois:ser|2áis:ar{confi,cri,concili,sec,toc,m{a,ani,re,su},mat,instal,col,fund,relacion}|2éis:er{torc,abastec,quer,corr,ro,vert}|1is:r{a{d,lid,n{ace,flexio,mi,tor},ch{a,ra,lan},r{a,o{c,min,m,nam},ge,luc,mig,minist,pi},c{ar,cer,esti,fi},clam,gel,pul,larg,lev,uiv,post,test,rap,vis},ve,rende}|1des:ler,rever,rir|2ondes:pôr|1s:sumir|1ndes:vir",
      "thirdPlural": "1m:r{a{c{,i{f{,i{ss,d,ecod,dan,on,br,ac,l,ort,ant,et}},bd,ejud,ompl,ripl,cl,rat,nt,rn},-ata},j{e,ele,ra,ga,ru,su,i,n},p{eci,ssi,escul,al,im,hu,socu,ou,ur,s},t{rap,ip,s{a{f,rr,v,p},ate,mpre,nco,go,ssu,cu,i,b},n{rgu,e{,apres,m{ma,i,r,uple},ost},ia,pa,ja,o},r{e,o{dep,omp,up,f,x},u},o{ad,arr,h,c,ab,g},i{lev,hes,uis,ss,c{ncapa,xer,x,ssus},e,r,d,ig,ap,bil{ea,ssi},om},l{pu,ssa,xa,o},e,rre,a,ltra,dra,u},i{,c{en,efinan,sso,ma,ndi,li,bu},d{pu,a,se,si},ig},r{a{dep,ap,sc,s},o{im,omem,mpl,ig,rv,c,h,i,ap,t},t,r{,ate,be,fe,jo},imig,sinteg,b{eslum,som,em,do,no},i{nsp,at,e,a,ev},p,uad,e{sesp,mp,sacel,rig,sconsid,c,n},u{nd,t{a,n,s,u},ap,eg,o,f,m},ecif,son,c,v},g{i{mast,sl,rl,r},e,rene,u,a{op,str,c,m,v},al,jul,o{dr,v,f,j},xer,n,gas},z{i{n{harmo,ro,ma,e,ter},r,l{rti,sabi,obi,a{ntr,atu,in,nacion,ici,foc,v},po},t,otim,rm,rav,c},pre,le,va},u,zigu,d{n{oma,bra,eme,ve,fu,o},ca,vi,eluci,ei,r{sco,sbo,eta,e},ju,snu,tu,be,pe,o,ol},s{le,ecu,ou,ran,ra,li,ri,ui,scur,s},l{u{ec,ag,ssim,em,t,ab,d},i{sf,ep,ssim,t,z,ac},o,a,sc,e{op,g,t,r,s,z},uf},n{r,tu,o{i{c{ven,a,i,e,p,revolu},s{i,n,s,l},quest,p},r,f},e{nc,oord,i,z,dr,n},i{ncrim,germ,em,ioc,ac,tre,f,s,z,ob,d,pl,r},a{ng,b,pl,f},s},f,h{,c{in,fe,o,ur}},v{ur,o,ne,tra,sca,ati,ui,u},m{,fla,tra,defor,lar,acal,nti},b{lo,ba,sa,ga,m,u},x,o,ç},e{mb,d{en{eapr,nsc,ac,st,ev,esp,e},e{ac,rc,ec,f}},r,olv{bs,ss,senv}}}|1n:r{a{c{i{,if{,od,impl,cal,cuant}},edu,o{ol,v,h,rr,mb,nf,sof},r{ace,nma,ba,ho},bus,es,fis,a,rran,l},j{e{d,ns,man,qu,l,par,ot,p},fi},t{trevis,uis,n{e{es,m,lim,erim,v,t,r},mo,afro},aler,inser,afei,gri,edi,e{r,resp,pl,bj,uj,aqu},a{r,c,st,l,s},u{isfr,imp,sp,jec,cl,f}},i{c{,en{ci,fer,t,s}},d,iv,bv,mp,op,mb,g,om,n},r{nmasca,eco,t{us,is,ras,en,i,ne},or,gar,usur,inspi,mp,gene,lne,asegu,oluc},njug,olong,eng,iz{r{i,cte,r,ro,uto,mo,gula},final,t{u,fa,te,n}},igu,acu,d{hon,onvi,lvi,acomo},etras,l{titu,stu,nti,io,tro,a{ñ,nt,g,sc,u,j},nte},e{t,nc,uc,es,pas,l,r{c,ar,o,ast},sm,n,qu{lan,o,sa},d,j,lp},n{r{lte,do,eto,a},aicio,afi,esi,oordi},nf,taf,nnov,squiv,m{la,ra,r,l,ue,to,s,ti,xi,fu},tumb,nco},e{ec{ndur,oscur,nt,iqu,laqu},etend,corr{re,so},omet,trev}}|5ientan:entar{as,l,ev,ec}|3ían:iar{roc,vac,u,saf,nv,sv,var,nfr,sp,pl}|4iegan:egar{n,pl}|5iensan:epensar|2iam:ear{t{ha,co,s,en},elin,and,cad}|2êem:er{cr,tev,rov}|1em:reler,orrir|2em:ir{ent{ss,sm},m{opri,di,ssu,re},z}|5isten:estir|4imen:emir|4iden:edir|2en:ir{gu,r{f,r,ub,a,d}}|4ienen:enir|4iben:ebir|3uyen:üir|2õem:ôr~1n:r{,a{rient,cuestr,eg{l,tr,agr,v,p},ch},e{jerc,tem,teg,barr}}|5uelcan:olcar|8se quejan:quejarse|8se alejan:alejarse|11se preocupan:preocuparse|5uestan:ostar|9se acuestan:acostarse|5iestan:festar|6 sientan:ntarse|10se levantan:levantarse|5iertan:ertar{sp,c}|5ueltan:soltar|4ietan:apretar|9se afilian:afiliarse|3ían/palian:paliar|6uestran:ostrar|5ierran:errar|5iebran:uebrar|6iembran:sembrar|4üeran:gorar|9se retiran:retirarse|5uelgan:olgar|5ienzan:enzar|5üenzan:onzar|4iezan:pezar|5uerzan:orzar|4ízan:aizar|3úan:uar{d,t{si,c,en,pe},n,l}|4uevan:enovar|5iendan:endar|9se olvidan:olvidarse|9e suicidan:uicidarse|5uerdan:cordar|8se quedan:quedarse|4uedan:rodar|5ueldan:soldar|4iesan:esar{nf,v}|7se casan:casarse|4úsan:husar|4uesan/engrosan:rosar|4uelan:volar|6iemblan:emblar|5ueblan:poblar|5íslan:aislar|4ueñan:oñar|5iernan:obernar|4uenan:sonar|4únan:aunar|3n:haber|4ueban:probar|3úan/adecuan:decuar|2en:ir{,aflig,umerg,iv}|4íben:ohibir|5ienten:entir|5ierten:ertir|4iten:etir|4uecen:cocer|4icen:ecir|4ienen:ener|5iernen:ernir|4únen:eunir|5uermen:ormir|4igen:egir|9se deciden:decidirse|5ienden:ender{c,t,ef}|5inden:endir|4ueden:oder|5ierden:erder|5uerden:order|2yen:ír,uir|4ieren:erir{u,h,pref,ug}|4ueren:orir|3íen:eír|5iguen:eguir|5uelven:olver|5irven:servir|5ierven:hervir|4ueven:over|7se mueven:moverse|4iñen:eñir|4uelen:oler|2én:prever|1m:er{z,t{a,r,rre,me},c{e{r{r,lvo,u,d,g,fe},o,m,ol,el,fal,t,u,f,h,rn,nd},r,s,ten},ng,eg,v,h,em,ceb,mbeb,o,erromp,u,x}|2em:ir{t{ssis,nves,ur,demi,le,n,ncu,c},ol,g{tin,un,a,li,rri,di,er},uv,d{simpe,li,ilu,ssua,o},r,a,xib,nib,mb,sp,lp,u{imin,sseg,ol,s,etrib,bstit,fr},pun,s}|4ulem:polir|4ogem:fugir|4idem:redir|2õem:or|4íbem:oibir|5ospem:uspir|2em/exturquem:quir|4inem:evenir|4údam:saudar|2iam:ear|2êm:ter,vir|4ão:aver~6entar:ientan|6ontar:uentan|7ontrar:uentran|6errar:yerran|4gar:egan|5egar:iegan|5ogar:ruegan|6ensar:iensan|3iar:ían|5elar:ielan|1r:en{eb,ab,rb,et,c,on,om,am,erg,og,d{en,on,e,r},orr,omp,v,añ,a,el,val,e,s,o,j},m{,e{d,uer,rr,fr,amb}}|4ebir:nciben|2ir:en{mit,uc,rc,ig{ir,er,x},cind},uzem,mem|5estir:visten|6orcer:uercen|5enir:vienen|4emir:gimen|4edir:iden{p,m}|4üir:guyen|6oler:huelen|2er:on|2ar:án|2r:em|3er:êem~2van:ir|2on:ser|3ían:iar{conf,cr}|5iensan:pensar|5uercen:torcer|4ieren:querer|1n:r{a{sec,toc,marc,m{a,ani,re,su},at,mat,instal,col,congel,concili,filtr,fund,relacion,valoriz},e{met,corr,v,abastec,ro}}|5yerran:errar|3egan:jugar|5ientan:entar{s,t}|6uentran:encontrar|4huelen:oler|4uegan:rogar|4ielan:helar|4iegan:regar{,f}|2en:abrir|5uentan:contar|2án:estar|1m:r{a{acen,flexion,min,ch{a,ra,lan},r{a,ge,mig,minist,mino,mo,namo,pi},clam,estic,larg,lev,lid,post,test,pul,rap,vis},rende}|1em:ler,rir|2õem:pôr|2em:mir{pre,su}|2êem:rever|5ierten:verter"
    },
    "pastTense": {
      "first": "1:r|2í:er|3fui:ser|4í:rse{e,i{t,m,d,r,l}}|6use:onerse|6uve:enerse|4é:arse|4ué:garse|5qué:carse|4fui:irse~2é:ar|3qué:car|2ué:gar|3cé:zar|3üé:guar|2í:ir,oser|4use:oner|4ise:erer|4uve:ener|3je:cir|2je:raer|4ije:ecir|4ice:acer{f,h}|4ine:enir|4ude:oder|4upe:aber|2e:guiar~3carse:equé|1arse:é{uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam}|1er:í{eb,met,c,lv,prev,em,om,teg,og,ced,nd,rd,rr,p,cre,le,añ,ol,val,a},vi|1irse:pentí,llí|1erse:oví,eví|1ir:urrí|0r:eí,oí|3ar:uve{d,st}|1ar:i|3ir:fui~2fui:ir|2uve:andar,estar|4í:sentirse|2i:dar,ver",
      "second": "2iste:er|3fuiste:ser|4udiste:oder|3ste:rse{,i{t,m,d,r,l}}|4iste:erse|6usiste:onerse|6uviste:enerse|4fuiste:irse~1ste:r|4iciste:acer{f,h}|4usiste:oner|4isiste:erer|2iste:oser|4uviste:ener|3jiste:cir|2jiste:aer|4ijiste:ecir|4upiste:aber|4iniste:enir|2íste:eer,caer~3rse:ste{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},penti,lli}|4er:ste{i{eb,met,c,v,em,om,teg,og,ced,nd,rd,rr,p,añ,ol,val},creí}|4erse:viste{o,tre}|6ar:uviste{d,st}|3r:ste{rvi,ivi,urri,reí}|6ir:fuiste|6oder:pudiste~2fuiste:ir|2uviste:andar,estar|3ste:sentirse|2iste:dar",
      "third": "1ó:r|3fue:ser|2ió:oser|2ó:ñer,ñir|2yó:ír|3ió:eír|4ió:erse|6uso:onerse|6uvo:enerse|4ó:rse{a,li}|4o:riarse|4fue:irse|7irtió:ertirse|7intió:entirse|7istió:estirse|7urmió:ormirse|3ó:irse{d,r}~2ó:ar|2ió:er|5intió:entir|5irtió:ertir|4itió:etir|5istió:estir|5irvió:ervir|4idió:edir|5urmió:ormir|4igió:egir|1ó:guir|5iguió:eguir|4irió:erir|4urió:orir|2yó:uir,eer,caer|4iñó:eñir|4uso:oner|4iso:erer|4uvo:ener|3jo:cir|2jo:aer|4ijo:ecir|4izo:acer{f,h}|2o:iar{cr,gu}|4ino:enir|4udo:oder|4upo:aber~1arse:ó{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam}|1r:ió{ib,ub,t{r,mi,sis,a},iv,cid,ud,ad,im,um,g{iri,xi,fli,r,n},ufr,urr,br,n,sal,pl}|1ar:ió{c{un,va,pre,vor,o,i,u},nv,liv,od,tud,u,f,ar,p}|2er:ió{noc,rr,omp},vio|5entirse:pintió|2erse:vió{o,tre}|2eír:rió,rio|1irse:ulló|1er:tañó|1ir:uñó|3ar:uvo{d,st}|2ar:io|3ir:fue~2fue:ir|2uvo:andar,estar|2yó:oír|7intió:sentirse|2io:dar,ver|3io:reír",
      "firstPlural": "2imos:er|3fuimos:ser|4udimos:oder|3mos:rse{,i{t,m,d,r,l}}|4imos:erse|6usimos:onerse|6uvimos:enerse|4fuimos:irse~1mos:r|4icimos:acer{f,h}|4usimos:oner|4isimos:erer|2imos:oser|4uvimos:ener|3jimos:cir|2jimos:aer|4ijimos:ecir|4upimos:aber|4inimos:enir|2ímos:eer,caer~3rse:mos{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},penti,lli}|4er:mos{i{eb,met,c,v,em,om,teg,og,ced,nd,rd,rr,p,añ,ol,val},creí}|4erse:vimos{o,tre}|6ar:uvimos{d,st}|3r:mos{rvi,ivi,urri,reí}|6ir:fuimos|6oder:pudimos~2fuimos:ir|2uvimos:andar,estar|3mos:sentirse|2imos:dar",
      "secondPlural": "2isteis:er|3fuisteis:ser|4udisteis:oder|3steis:rse{,i{t,m,d,r,l}}|4isteis:erse|6usisteis:onerse|6uvisteis:enerse|4fuisteis:irse~1steis:r|4icisteis:acer{f,h}|4usisteis:oner|4isisteis:erer|2isteis:oser|4uvisteis:ener|3jisteis:cir|2jisteis:aer|4ijisteis:ecir|4upisteis:aber|4inisteis:enir|2ísteis:eer,caer~5rse:steis{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},penti,lli}|6er:steis{i{eb,met,c,v,em,om,teg,og,ced,nd,rd,rr,p,añ,ol,val},creí}|6erse:visteis{o,tre}|8ar:uvisteis{d,st}|5r:steis{rvi,ivi,urri,reí}|8ir:fuisteis|8oder:pudisteis~2fuisteis:ir|2uvisteis:andar,estar|3steis:sentirse|2isteis:dar",
      "thirdPlural": "3fueron:ser|2ieron:oser|0on:ñer|1eron:ir|3ieron:eír|2on:se|4ieron:erse|6usieron:onerse|6uvieron:enerse|4fueron:irse|7irtieron:ertirse|7intieron:entirse|7istieron:estirse|7urmieron:ormirse|3eron:irse{d,r}~0on:|2ieron:er|5intieron:entir|5irtieron:ertir|4itieron:etir|5istieron:estir|4icieron:acer{f,h}|4usieron:oner|4isieron:erer|4uvieron:ener|5irvieron:ervir|5urmieron:ormir|4igieron:egir|4idieron:edir|4udieron:oder|4irieron:erir|4urieron:orir|4upieron:aber|4inieron:enir|1eron:guir|5iguieron:eguir|3jeron:cir|2jeron:aer|4ijeron:ecir|2yeron:r{í,ui,ee,cae}|2eron:ñir|4iñeron:eñir|4eron:lirse~2se:aron{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam}|4r:ieron{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|8entirse:pintieron|5erse:vieron{o,tre}|7ar:uvieron{d,st}|5eír:rieron|5er:rrieron|6ir:fueron|2:añeron~2fueron:ir|2uvieron:andar,estar|7intieron:sentirse|2ieron:dar"
    },
    "imperfectTense": {
      "first": "2ía:ir|1a:ír|3ba:rse|4ía:rse{i,e}~1ba:r|2ía:er~2rse:aba{fili,icid}|2ir:ía{ib,ub,umb,t{,ver{i,d,n},rre,pe,le},c{de,trade,u,ar},n,im,rm,um,g,d,u,r,sorr,urr,p,erv,breviv,uv,ñ,scontra,btra,sa,l{bo,go,po,sa,l,p},uz,ü,ss}|2er:ía{t{on,man,er,e,us,aba,eba,b},dec{a,an,be},on,ten,g{te,emer,o,an},d{ce,fe,en,on,po,r},rgu,ofr,rr,cr,omp,cre,ferv,añ}|1r:reía|3ser:era~1ba:ir|3era:ser|2ía:r{quere,te,vi,vivi,premi}|1a:oír|1ía:ver",
      "second": "2ías:ir|1as:ír|3bas:rse|4ías:rse{i,e}~1bas:r|2ías:er~3rse:abas{fili,icid}|3ir:ías{ib,ub,umb,t{,ver{i,d,n},rre,pe,le},c{de,trade,u,ar},n,im,rm,um,g,d,u,r,sorr,urr,p,erv,breviv,uv,ñ,scontra,btra,sa,l{bo,go,po,sa,l,p},uz,ü,ss}|3er:ías{t{on,man,er,e,us,aba,eba,b},dec{a,an,be},on,ten,g{te,emer,o,an},d{ce,fe,en,on,po,r},rgu,ofr,rr,cr,omp,cre,ferv,añ}|2r:reías|4ser:eras~1bas:ir|3eras:ser|2ías:r{quere,te,vi,vivi,premi}|1as:oír|1ías:ver",
      "third": "2ía:ir|1a:ír|3ba:rse|4ía:rse{i,e}~1ba:r|2ía:er~2rse:aba{fili,icid}|2ir:ía{ib,ub,umb,t{,ver{i,d,n},rre,pe,le},c{de,trade,u,ar},n,im,rm,um,g,d,u,r,sorr,urr,p,erv,breviv,uv,ñ,scontra,btra,sa,l{bo,go,po,sa,l,p},uz,ü,ss}|2er:ía{t{on,man,er,e,us,aba,eba,b},dec{a,an,be},on,ten,g{te,emer,o,an},d{ce,fe,en,on,po,r},rgu,ofr,rr,cr,omp,cre,ferv,añ}|1r:reía|3ser:era~1ba:ir|3era:ser|2ía:r{quere,te,vi,vivi,premi}|1a:oír|1ía:ver",
      "firstPlural": "1amos:r|2íamos:ir|4ábamos:arse|4íamos:rse{i,e}~2ábamos:ar|2íamos:er~6arse:ábamos{fili,icid}|6ir:íbamos|5ir:íamos{ib,ub,umb,t{,ver{i,d,n},rre,pe,le},c{de,trade,u,ar},n,im,rm,um,g,d,u,r,sorr,urr,p,erv,breviv,uv,ñ,scontra,btra,sa,l{bo,go,po,sa,l,p},uz,ü,ss}|5er:íamos{t{on,man,er,e,us,aba,eba,b},dec{a,an,be},on,ten,g{te,emer,o,an},d{ce,fe,en,on,po,r},rgu,ofr,rr,cr,omp,cre,ferv,añ}|4r:reíamos|6ser:éramos~2íbamos:ir|3éramos:ser|2íamos:r{quere,te,vi,vivi,premi}|1amos:oír|1íamos:ver",
      "secondPlural": "2íais:ir|1ais:ír|3bais:rse|4íais:rse{i,e}~1bais:r|2íais:er~4rse:abais{fili,icid}|4ir:íais{ib,ub,umb,t{,ver{i,d,n},rre,pe,le},c{de,trade,u,ar},n,im,rm,um,g,d,u,r,sorr,urr,p,erv,breviv,uv,ñ,scontra,btra,sa,l{bo,go,po,sa,l,p},uz,ü,ss}|4er:íais{t{on,man,er,e,us,aba,eba,b},dec{a,an,be},on,ten,g{te,emer,o,an},d{ce,fe,en,on,po,r},rgu,ofr,rr,cr,omp,cre,ferv,añ}|3r:reíais|5ser:erais~1bais:ir|3erais:ser|2íais:r{quere,te,vi,vivi,premi}|1ais:oír|1íais:ver",
      "thirdPlural": "2ían:ir|1an:ír|3ban:rse|4ían:rse{i,e}~1ban:r|2ían:er~3rse:aban{fili,icid}|3ir:ían{ib,ub,umb,t{,ver{i,d,n},rre,pe,le},c{de,trade,u,ar},n,im,rm,um,g,d,u,r,sorr,urr,p,erv,breviv,uv,ñ,scontra,btra,sa,l{bo,go,po,sa,l,p},uz,ü,ss}|3er:ían{t{on,man,er,e,us,aba,eba,b},dec{a,an,be},on,ten,g{te,emer,o,an},d{ce,fe,en,on,po,r},rgu,ofr,rr,cr,omp,cre,ferv,añ}|2r:reían|4ser:eran~1ban:ir|3eran:ser|2ían:r{quere,te,vi,vivi,premi}|1an:oír|1ían:ver"
    },
    "futureTense": {
      "first": "2dré:enir,alir|2iré:ír|2é:se|4dré:nerse~0é:|3ré:acer{f,h}|2dré:ner,aler|2ré:er{od,er,ab}~1se:ré{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|1:aré{nf,ch}|3ír:iré{e,o}|3ir:dré{ven,sal}~2é:sentirse|4iré:decir",
      "second": "2drás:enir,alir|2irás:ír|2ás:se|4drás:nerse~0ás:|3rás:acer{f,h}|2drás:ner,aler|2rás:er{od,er,ab}~2se:rás{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|2:arás{nf,ch}|4ír:irás{e,o}|4ir:drás{ven,sal}~2ás:sentirse|4irás:decir",
      "third": "2drá:enir,alir|2irá:ír|2á:se|4drá:nerse~0á:|3rá:acer{f,h}|2drá:ner,aler|2rá:er{od,er,ab}~1se:rá{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|1:ará{nf,ch}|3ír:irá{e,o}|3ir:drá{ven,sal}~2á:sentirse|4irá:decir",
      "firstPlural": "2dremos:enir,alir|2iremos:ír|2emos:se|4dremos:nerse~0emos:|3remos:acer{f,h}|2dremos:ner,aler|2remos:er{od,er,ab}~4se:remos{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|4:aremos{nf,ch}|6ír:iremos{e,o}|6ir:dremos{ven,sal}~2emos:sentirse|4iremos:decir",
      "secondPlural": "2dréis:enir,alir|2iréis:ír|2éis:se|4dréis:nerse~0éis:|3réis:acer{f,h}|2dréis:ner,aler|2réis:er{od,er,ab}~3se:réis{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|3:aréis{nf,ch}|5ír:iréis{e,o}|5ir:dréis{ven,sal}~2éis:sentirse|4iréis:decir",
      "thirdPlural": "2drán:enir,alir|2irán:ír|2án:se|4drán:nerse~0án:|3rán:acer{f,h}|2drán:ner,aler|2rán:er{od,er,ab}~2se:rán{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|2:arán{nf,ch}|4ír:irán{e,o}|4ir:drán{ven,sal}~2án:sentirse|4irán:decir"
    },
    "conditional": {
      "first": "2dría:enir,alir|2iría:ír|2ía:se|4dría:nerse~0ía:|3ría:acer{f,h}|2dría:ner,aler|2ría:er{od,er,ab}~2se:ría{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|2:aría{nf,ch}|4ír:iría{e,o}|4ir:dría{ven,sal}~2ía:sentirse|4iría:decir",
      "second": "2drías:enir,alir|2irías:ír|2ías:se|4drías:nerse~0ías:|3rías:acer{f,h}|2drías:ner,aler|2rías:er{od,er,ab}~3se:rías{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|3:arías{nf,ch}|5ír:irías{e,o}|5ir:drías{ven,sal}~2ías:sentirse|4irías:decir",
      "third": "2dría:enir,alir|2iría:ír|2ía:se|4dría:nerse~0ía:|3ría:acer{f,h}|2dría:ner,aler|2ría:er{od,er,ab}~2se:ría{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|2:aría{nf,ch}|4ír:iría{e,o}|4ir:dría{ven,sal}~2ía:sentirse|4iría:decir",
      "firstPlural": "2dríamos:enir,alir|2iríamos:ír|2íamos:se|4dríamos:nerse~0íamos:|3ríamos:acer{f,h}|2dríamos:ner,aler|2ríamos:er{od,er,ab}~5se:ríamos{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|5:aríamos{nf,ch}|7ír:iríamos{e,o}|7ir:dríamos{ven,sal}~2íamos:sentirse|4iríamos:decir",
      "secondPlural": "2dríais:enir,alir|2iríais:ír|2íais:se|4dríais:nerse~0íais:|3ríais:acer{f,h}|2dríais:ner,aler|2ríais:er{od,er,ab}~4se:ríais{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|4:aríais{nf,ch}|6ír:iríais{e,o}|6ir:dríais{ven,sal}~2íais:sentirse|4iríais:decir",
      "thirdPlural": "2drían:enir,alir|2irían:ír|2ían:se|4drían:nerse~0ían:|3rían:acer{f,h}|2drían:ner,aler|2rían:er{od,er,ab}~3se:rían{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},ove,treve,penti,lli}|3:arían{nf,ch}|5ír:irían{e,o}|5ir:drían{ven,sal}~2ían:sentirse|4irían:decir"
    },
    "subjunctive": {
      "first": "2a:er|2ga:ner,ler|3ja:ger|4iera:erer|4iegue:negar|5iente:lentar|2e:cuar|3zca:cir|4iga:ecir|2iga:ír|4e:arse|7iebre:ebrarse|5que:carse|7iente:entarse|7ueste:ostarse|7ierte:ertarse|5íe:riarse|7uerde:ordarse|5úe:uarse|6iegue:egarse|4a:rse{e,di,ri}|4ga:nerse|5zca:cerse|6ueva:overse|4vaya:irse|7ienta:entirse|7ista:estirse|7ierta:ertirse|7uerma:ormirse~2a:ir|3zca:cer|2ya:uir|3a:guir|3ga:acer{f,h}|2ga:enir,alir|5iga:eguir|2iga:aer|4ita:etir|5ienta:entir|5ista:estir|5ierta:ertir|5uerma:ormir|4ueda:oder|5ienda:ender{c,t,ef}|4ida:edir|5ierda:erder|4iera:erir|4uera:orir|3ja:gir|4ija:egir|4iña:eñir|5uelva:olver|5irva:ervir|5ierva:hervir|4ueva:over|4epa:aber|5quepa:caber|1a:ver|4a:lirse|4uela:oler|3ía:eír|4íba:ohibir|3za:cer{r,n}|5uerza:orcer|2e:ar|2ue:gar|5uelgue:olgar|4uegue:ogar|3que:car|5ueste:ostar|5uente:contar|5ierte:ertar|4iete:apretar|6uestre:ostrar|6uentre:ontrar|5ierre:errar|4üere:gorar|5iebre:uebrar|3ce:zar|4iece:pezar|5uerce:orzar|5ience:enzar|5uerde:cordar|5iende:endar|4ueve:ovar|4ueñe:oñar|3íe:iar{r,u,ac,f,nv}|5ierne:ernar|4uene:sonar|4uele:volar|5iense:ensar|4úse:husar|4iese:esar{v,f}|3úe:uar|4uebe:probar|3üe:guar~3cir:uzca|4ir:vaya|2er:ga{ten,on,val}|3ecir:diga|3ír:oiga|1ir:a{mit,sist,cid,urr,pl}|1er:a{et,om,em,ed,nd,rr,añ,p,e,s,eb}|5entirse:pienta|2gir:ija{ir,fl,x}|2ger:eja,oja|1erse:eva|1r:sea|5oler:huela|5egar:iegue|4gar:juegue|5entar:iente|1arse:e{ct,ter,uej,nce}|5errar:yerre|4elar:iele|1ar:é~5iente:sentar|5yerre:errar|4huela:oler|2é:estar,dar|4iele:helar|4iegue:regar|1a:ser|2vaya:ir|3egue:jugar|4iera:querer",
      "second": "2as:er|2gas:ner,ler|3jas:ger|4ieras:erer|4iegues:negar|5ientes:lentar|2es:cuar|3zcas:cir|4igas:ecir|2igas:ír|4es:arse|7iebres:ebrarse|5ques:carse|7ientes:entarse|7uestes:ostarse|7iertes:ertarse|5íes:riarse|7uerdes:ordarse|5úes:uarse|6iegues:egarse|4as:rse{e,di,ri}|4gas:nerse|5zcas:cerse|6uevas:overse|4vayas:irse|7ientas:entirse|7istas:estirse|7iertas:ertirse|7uermas:ormirse~2as:ir|3zcas:cer|2yas:uir|3as:guir|3gas:acer{f,h}|2gas:enir,alir|5igas:eguir|2igas:aer|4itas:etir|5ientas:entir|5istas:estir|5iertas:ertir|5uermas:ormir|4uedas:oder|5iendas:ender{c,t,ef}|4idas:edir|5ierdas:erder|4ieras:erir|4ueras:orir|3jas:gir|4ijas:egir|4iñas:eñir|5uelvas:olver|5irvas:ervir|5iervas:hervir|4uevas:over|4epas:aber|5quepas:caber|1as:ver|4as:lirse|4uelas:oler|3ías:eír|4íbas:ohibir|3zas:cer{r,n}|5uerzas:orcer|2es:ar|2ues:gar|5uelgues:olgar|4uegues:ogar|3ques:car|5uestes:ostar|5uentes:contar|5iertes:ertar|4ietes:apretar|6uestres:ostrar|6uentres:ontrar|5ierres:errar|4üeres:gorar|5iebres:uebrar|3ces:zar|4ieces:pezar|5uerces:orzar|5iences:enzar|5uerdes:cordar|5iendes:endar|4ueves:ovar|4ueñes:oñar|3íes:iar{r,u,ac,f,nv}|5iernes:ernar|4uenes:sonar|4ueles:volar|5ienses:ensar|4úses:husar|4ieses:esar{v,f}|3úes:uar|4uebes:probar|3ües:guar~4cir:uzcas|5ir:vayas|3er:gas{ten,on,val}|4ecir:digas|4ír:oigas|2ir:as{mit,sist,cid,urr,pl}|2er:as{et,om,em,ed,nd,rr,añ,p,e,s,eb}|6entirse:pientas|3gir:ijas{ir,fl,x}|3ger:jas{e,o}|2erse:evas|2r:seas|6oler:huelas|6egar:iegues|5gar:juegues|6entar:ientes|2arse:es{ct,ter,uej,nce}|6errar:yerres|5elar:ieles|2ar:és~5ientes:sentar|5yerres:errar|4huelas:oler|2és:estar|4ieles:helar|4iegues:regar|1as:ser|2vayas:ir|3egues:jugar|4ieras:querer",
      "third": "2a:er|2ga:ner,ler|3ja:ger|4iera:erer|4iegue:negar|5iente:lentar|2e:cuar|3zca:cir|4iga:ecir|2iga:ír|4e:arse|7iebre:ebrarse|5que:carse|7iente:entarse|7ueste:ostarse|7ierte:ertarse|5íe:riarse|7uerde:ordarse|5úe:uarse|6iegue:egarse|4a:rse{e,di,ri}|4ga:nerse|5zca:cerse|6ueva:overse|4vaya:irse|7ienta:entirse|7ista:estirse|7ierta:ertirse|7uerma:ormirse~2a:ir|3zca:cer|2ya:uir|3a:guir|3ga:acer{f,h}|2ga:enir,alir|5iga:eguir|2iga:aer|4ita:etir|5ienta:entir|5ista:estir|5ierta:ertir|5uerma:ormir|4ueda:oder|5ienda:ender{c,t,ef}|4ida:edir|5ierda:erder|4iera:erir|4uera:orir|3ja:gir|4ija:egir|4iña:eñir|5uelva:olver|5irva:ervir|5ierva:hervir|4ueva:over|4epa:aber|5quepa:caber|1a:ver|4a:lirse|4uela:oler|3ía:eír|4íba:ohibir|3za:cer{r,n}|5uerza:orcer|2e:ar|2ue:gar|5uelgue:olgar|4uegue:ogar|3que:car|5ueste:ostar|5uente:contar|5ierte:ertar|4iete:apretar|6uestre:ostrar|6uentre:ontrar|5ierre:errar|4üere:gorar|5iebre:uebrar|3ce:zar|4iece:pezar|5uerce:orzar|5ience:enzar|5uerde:cordar|5iende:endar|4ueve:ovar|4ueñe:oñar|3íe:iar{r,u,ac,f,nv}|5ierne:ernar|4uene:sonar|4uele:volar|5iense:ensar|4úse:husar|4iese:esar{v,f}|3úe:uar|4uebe:probar|3üe:guar~3cir:uzca|4ir:vaya|2er:ga{ten,on,val}|3ecir:diga|3ír:oiga|1ir:a{mit,sist,cid,urr,pl}|1er:a{et,om,em,ed,nd,rr,añ,p,e,s,eb}|5entirse:pienta|2gir:ija{ir,fl,x}|2ger:eja,oja|1erse:eva|1r:sea|5oler:huela|5egar:iegue|4gar:juegue|5entar:iente|1arse:e{ct,ter,uej,nce}|5errar:yerre|4elar:iele|1ar:é~5iente:sentar|5yerre:errar|4huela:oler|2é:estar,dar|4iele:helar|4iegue:regar|1a:ser|2vaya:ir|3egue:jugar|4iera:querer",
      "firstPlural": "2gamos:ner,alir|1amos:ever|3jamos:ger|2amos:ir|3zcamos:cir|4igamos:ecir|2igamos:ír|4emos:arse|5quemos:carse|4uemos:garse|4amos:rse{e,di,ri}|4gamos:nerse|5zcamos:cerse|4vayamos:irse|7intamos:entirse|7istamos:estirse|7irtamos:ertirse|7urmamos:ormirse~2amos:er|3zcamos:cer|2yamos:uir|3amos:guir|3gamos:acer{f,h}|2gamos:enir,aler|5igamos:eguir|2igamos:aer|4itamos:etir|5intamos:entir|5istamos:estir|5irtamos:ertir|5urmamos:ormir|4idamos:edir|4iramos:erir|4uramos:orir|3jamos:gir|4ijamos:egir|4iñamos:eñir|5irvamos:ervir|4epamos:aber|5quepamos:caber|4amos:lirse|3iamos:eír|3zamos:cer{r,n}|2emos:ar|2uemos:gar|3quemos:car|3cemos:zar|3üemos:guar~6cir:uzcamos|7ir:vayamos|5er:ngamos{te,o}|6ecir:digamos|6ír:oigamos|5ir:salgamos|4ir:amos{t,mit,sist,um,im,cid,ad,ud,fr,br,urr,uñ,iv,pl,b,n}|4er:amos{et,ol,eb}|7entirse:pintamos|5gir:ijamos{ir,fl,x}|5ger:jamos{e,o}|4erse:evamos|4r:eamos{v,s}|4arse:emos{ct,ter,uej,nce}~1amos:ver,ser|2vayamos:ir",
      "secondPlural": "2gáis:ner,alir|1áis:ever|3jáis:ger|2éis:opezar|2áis:ir|3zcáis:cir|4igáis:ecir|2igáis:ír|4éis:arse|5quéis:carse|4uéis:garse|4áis:rse{e,di,ri}|4gáis:nerse|5zcáis:cerse|4vayáis:irse|7intáis:entirse|7istáis:estirse|7irtáis:ertirse|7urmáis:ormirse~2áis:er|3zcáis:cer|2yáis:uir|3áis:guir|3gáis:acer{f,h}|2gáis:enir,aler|5igáis:eguir|2igáis:aer|4itáis:etir|5intáis:entir|5istáis:estir|5irtáis:ertir|5urmáis:ormir|4idáis:edir|4iráis:erir|4uráis:orir|3jáis:gir|4ijáis:egir|4iñáis:eñir|5irváis:ervir|4epáis:aber|5quepáis:caber|4áis:lirse|3iáis:eír|3záis:cer{r,n}|2éis:ar|2uéis:gar|3quéis:car|3céis:zar|3üéis:guar~5cir:uzcáis|6ir:vayáis|4er:ngáis{te,o}|5ecir:digáis|5ír:oigáis|4ir:salgáis|3ir:áis{t,mit,sist,um,im,cid,ad,ud,fr,br,urr,uñ,iv,pl,b,n}|3er:áis{et,ol,eb}|6entirse:pintáis|4gir:ijáis{ir,fl,x}|4ger:jáis{e,o}|3erse:eváis|3r:eáis{v,s}|3arse:éis{ct,ter,uej,nce}|3ar:eis~2eis:dar|1áis:ver,ser|2vayáis:ir",
      "thirdPlural": "2an:er|2gan:ner,ler|3jan:ger|4ieran:erer|4ieguen:negar|5ienten:lentar|2en:cuar|3zcan:cir|4igan:ecir|2igan:ír|4en:arse|7iebren:ebrarse|5quen:carse|7ienten:entarse|7uesten:ostarse|7ierten:ertarse|5íen:riarse|7uerden:ordarse|5úen:uarse|6ieguen:egarse|4an:rse{e,di,ri}|4gan:nerse|5zcan:cerse|6uevan:overse|4vayan:irse|7ientan:entirse|7istan:estirse|7iertan:ertirse|7uerman:ormirse~2an:ir|3zcan:cer|2yan:uir|3an:guir|3gan:acer{f,h}|2gan:enir,alir|5igan:eguir|2igan:aer|4itan:etir|5ientan:entir|5istan:estir|5iertan:ertir|5uerman:ormir|4uedan:oder|5iendan:ender{c,t,ef}|4idan:edir|5ierdan:erder|4ieran:erir|4ueran:orir|3jan:gir|4ijan:egir|4iñan:eñir|5uelvan:olver|5irvan:ervir|5iervan:hervir|4uevan:over|4epan:aber|5quepan:caber|1an:ver|4an:lirse|4uelan:oler|3ían:eír|4íban:ohibir|3zan:cer{r,n}|5uerzan:orcer|2en:ar|2uen:gar|5uelguen:olgar|4ueguen:ogar|3quen:car|5uesten:ostar|5uenten:contar|5ierten:ertar|4ieten:apretar|6uestren:ostrar|6uentren:ontrar|5ierren:errar|4üeren:gorar|5iebren:uebrar|3cen:zar|4iecen:pezar|5uercen:orzar|5iencen:enzar|5uerden:cordar|5ienden:endar|4ueven:ovar|4ueñen:oñar|3íen:iar{r,u,ac,f,nv}|5iernen:ernar|4uenen:sonar|4uelen:volar|5iensen:ensar|4úsen:husar|4iesen:esar{v,f}|3úen:uar|4ueben:probar|3üen:guar~4cir:uzcan|5ir:vayan|3er:gan{ten,on,val}|4ecir:digan|4ír:oigan|2ir:an{mit,sist,cid,urr,pl}|2er:an{et,om,em,ed,nd,rr,añ,p,e,s,eb}|6entirse:pientan|3gir:ijan{ir,fl,x}|3ger:jan{e,o}|2erse:evan|2r:sean|6oler:huelan|6egar:ieguen|5gar:jueguen|6entar:ienten|2arse:en{ct,ter,uej,nce}|6errar:yerren|5elar:ielen|2ar:én~5ienten:sentar|5yerren:errar|4huelan:oler|2én:estar|4ielen:helar|4ieguen:regar|1an:ser|2vayan:ir|3eguen:jugar|4ieran:querer"
    },
    "imperfectSubjunctive": {
      "first": "3fuera:ser|2iera:oser|0a:ñer|1era:ir|3iera:eír|2a:se|4iera:erse|6usiera:onerse|6uviera:enerse|4fuera:irse|7irtiera:ertirse|7intiera:entirse|7istiera:estirse|7urmiera:ormirse|3era:irse{d,r}~0a:|2iera:er|5intiera:entir|5irtiera:ertir|4itiera:etir|5istiera:estir|4iciera:acer{f,h}|4usiera:oner|4isiera:erer|4uviera:ener|5irviera:ervir|5urmiera:ormir|4igiera:egir|4idiera:edir|4udiera:oder|4iriera:erir|4uriera:orir|4upiera:aber|4iniera:enir|1era:guir|5iguiera:eguir|3jera:cir|2jera:aer|4ijera:ecir|2yera:r{í,ui,ee,cae}|2era:ñir|4iñera:eñir|4era:lirse~1se:ara{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam}|3r:iera{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|7entirse:pintiera|4erse:viera{o,tre}|6ar:uviera{d,st}|4eír:riera|4er:rriera|5ir:fuera|1:añera~2fuera:ir|2uviera:andar,estar|7intiera:sentirse|2iera:dar",
      "second": "3fueras:ser|2ieras:oser|0as:ñer|1eras:ir|3ieras:eír|2as:se|4ieras:erse|6usieras:onerse|6uvieras:enerse|4fueras:irse|7irtieras:ertirse|7intieras:entirse|7istieras:estirse|7urmieras:ormirse|3eras:irse{d,r}~0as:|2ieras:er|5intieras:entir|5irtieras:ertir|4itieras:etir|5istieras:estir|4icieras:acer{f,h}|4usieras:oner|4isieras:erer|4uvieras:ener|5irvieras:ervir|5urmieras:ormir|4igieras:egir|4idieras:edir|4udieras:oder|4irieras:erir|4urieras:orir|4upieras:aber|4inieras:enir|1eras:guir|5iguieras:eguir|3jeras:cir|2jeras:aer|4ijeras:ecir|2yeras:r{í,ui,ee,cae}|2eras:ñir|4iñeras:eñir|4eras:lirse~2se:aras{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam}|4r:ieras{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|8entirse:pintieras|5erse:vieras{o,tre}|7ar:uvieras{d,st}|5eír:rieras|5er:rrieras|6ir:fueras|2:añeras~2fueras:ir|2uvieras:andar,estar|7intieras:sentirse|2ieras:dar",
      "third": "3fuera:ser|2iera:oser|0a:ñer|1era:ir|3iera:eír|2a:se|4iera:erse|6usiera:onerse|6uviera:enerse|4fuera:irse|7irtiera:ertirse|7intiera:entirse|7istiera:estirse|7urmiera:ormirse|3era:irse{d,r}~0a:|2iera:er|5intiera:entir|5irtiera:ertir|4itiera:etir|5istiera:estir|4iciera:acer{f,h}|4usiera:oner|4isiera:erer|4uviera:ener|5irviera:ervir|5urmiera:ormir|4igiera:egir|4idiera:edir|4udiera:oder|4iriera:erir|4uriera:orir|4upiera:aber|4iniera:enir|1era:guir|5iguiera:eguir|3jera:cir|2jera:aer|4ijera:ecir|2yera:r{í,ui,ee,cae}|2era:ñir|4iñera:eñir|4era:lirse~1se:ara{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam}|3r:iera{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|7entirse:pintiera|4erse:viera{o,tre}|6ar:uviera{d,st}|4eír:riera|4er:rriera|5ir:fuera|1:añera~2fuera:ir|2uviera:andar,estar|7intiera:sentirse|2iera:dar",
      "firstPlural": "1éramos:r|3fuéramos:ser|2iéramos:oser|2éramos:ñer|3iéramos:eír|4iéramos:erse|6usiéramos:onerse|6uviéramos:enerse|4áramos:arse|4fuéramos:irse|7irtiéramos:ertirse|7intiéramos:entirse|7istiéramos:estirse|7urmiéramos:ormirse|3éramos:irse{d,r}~2áramos:ar|2iéramos:er|5intiéramos:entir|5irtiéramos:ertir|4itiéramos:etir|5istiéramos:estir|4iciéramos:acer{f,h}|4usiéramos:oner|4isiéramos:erer|4uviéramos:ener|5irviéramos:ervir|5urmiéramos:ormir|4igiéramos:egir|4idiéramos:edir|4udiéramos:oder|4iriéramos:erir|4uriéramos:orir|4upiéramos:aber|4iniéramos:enir|1éramos:guir|5iguiéramos:eguir|3jéramos:cir|2jéramos:aer|4ijéramos:ecir|2yéramos:r{í,ui,ee,cae}|2éramos:ñir|4iñéramos:eñir|4éramos:lirse~6arse:áramos{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam}|6r:iéramos{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|10entirse:pintiéramos|7erse:viéramos{o,tre}|9ar:uviéramos{d,st}|7eír:riéramos|7er:rriéramos|8ir:fuéramos|6er:añéramos~2fuéramos:ir|2uviéramos:andar,estar|7intiéramos:sentirse|2iéramos:dar",
      "secondPlural": "3fuerais:ser|2ierais:oser|0ais:ñer|1erais:ir|3ierais:eír|2ais:se|4ierais:erse|6usierais:onerse|6uvierais:enerse|4fuerais:irse|7irtierais:ertirse|7intierais:entirse|7istierais:estirse|7urmierais:ormirse|3erais:irse{d,r}~0ais:|2ierais:er|5intierais:entir|5irtierais:ertir|4itierais:etir|5istierais:estir|4icierais:acer{f,h}|4usierais:oner|4isierais:erer|4uvierais:ener|5irvierais:ervir|5urmierais:ormir|4igierais:egir|4idierais:edir|4udierais:oder|4irierais:erir|4urierais:orir|4upierais:aber|4inierais:enir|1erais:guir|5iguierais:eguir|3jerais:cir|2jerais:aer|4ijerais:ecir|2yerais:r{í,ui,ee,cae}|2erais:ñir|4iñerais:eñir|4erais:lirse~3se:arais{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam}|5r:ierais{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|9entirse:pintierais|6erse:vierais{o,tre}|8ar:uvierais{d,st}|6eír:rierais|6er:rrierais|7ir:fuerais|3:añerais~2fuerais:ir|2uvierais:andar,estar|7intierais:sentirse|2ierais:dar",
      "thirdPlural": "3fueran:ser|2ieran:oser|0an:ñer|1eran:ir|3ieran:eír|2an:se|4ieran:erse|6usieran:onerse|6uvieran:enerse|4fueran:irse|7irtieran:ertirse|7intieran:entirse|7istieran:estirse|7urmieran:ormirse|3eran:irse{d,r}~0an:|2ieran:er|5intieran:entir|5irtieran:ertir|4itieran:etir|5istieran:estir|4icieran:acer{f,h}|4usieran:oner|4isieran:erer|4uvieran:ener|5irvieran:ervir|5urmieran:ormir|4igieran:egir|4idieran:edir|4udieran:oder|4irieran:erir|4urieran:orir|4upieran:aber|4inieran:enir|1eran:guir|5iguieran:eguir|3jeran:cir|2jeran:aer|4ijeran:ecir|2yeran:r{í,ui,ee,cae}|2eran:ñir|4iñeran:eñir|4eran:lirse~2se:aran{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam}|4r:ieran{ib,ub,t{r,mi,sis,a},iv,im,um,g{iri,xi,fli,r,n},d{ci,cu,au,a},ufr,urr,br,n,sal,pl}|8entirse:pintieran|5erse:vieran{o,tre}|7ar:uvieran{d,st}|5eír:rieran|5er:rrieran|6ir:fueran|2:añeran~2fueran:ir|2uvieran:andar,estar|7intieran:sentirse|2ieran:dar"
    },
    "imperative": {
      "first": "~~~",
      "second": "1:r{e{c{ya,e{en,aman,or,fr,bl,aqu},n},vend,pond},a{tig,rag,t{,n{gu,me,se,a}},r{mo,do,dmi,aspi,espi,p,r,a,ju,ig,nt,eb},z{oli,ti,ra,ha,van},preserv,iv,ev,c{e,lo,ovo,i{t,l,if{er,ur,s},r},ar,ta},pañ,bañ,d{ra,fa,abor,uar,u,in,ue,i},goci,uci,vi,j{a,i,se,o},en,in,amin,m,l{uil,r,ve,ña,g,i,gu,ab},us,cas,ns,e{c,pl,s,t},uch,ech,gu,ab,y}}|2as:ter,rer|2gas:detener|4iere:erer|4uevas:over|5uestes:costar|2es:ar{vant,prepar,erm,am,cu}|5iertes:ertar|3úa:ectuar|5igas:rseguir|4ige:egir|3zcas:cir|2e:hibir|4gas:erse|5zcas:cerse|4as:rse{de,ri}|4es:arse|7ientes:sentarse|5ques:carse|7uerdes:ordarse|4vayas:irse|7ientas:sentirse~1:r{,ega{p,v}}|2e:ir{duc{n,a},mbat,it,insist,fr,scubr,curr,um,v,ud,ad,g,l,gu}|4ice:edecir|6iégate:egarse|6écate:ecarse|6ócate:ocarse|7ércate:ercarse|7íllate:illarse|7úrlate:urlarse|5íate:iarse|7úntate:guntarse|7iéntate:entarse|7ústate:ustarse|6émate:emarse|7álmate:almarse|7ásmate:asmarse|7ánsate:ansarse|6ásate:asarse|6édate:edarse|6ídate:idarse|6ójate:ojarse|6éjate:ejarse|7úchate:ucharse|5úate:uarse|6áñate:añarse|8órciate:orciarse|7iébrate:ebrarse|7uérmete:ormirse|7iéntete:entirse|6ídete:idirse|6écete:uecerse|6évete:everse|4ite:mpetir|5iente:entir|5iste:estir|5ierte:ertir|4uere:orir|4iere:uerir|4iñe:eñir|5uerme:ormir|4ueve:lover|5ierve:hervir|5iende:ender{nc,t}|3íe:eír|2ye:r{í,ui{h,nstr,b,fl}}|5igue:eguir|2as:r{i,e{p,d,om,le}}|6uevas:overse|5uelvas:olver|5irvas:ervir|2yas:uir|3zcas:cer|4itas:etir|5ientas:sentir|7istas:estirse|7iertas:ertirse|5iertas:nvertir|4uedas:oder|5iendas:ender{nt,c,ef}|4idas:edir|5ierdas:erder|2gas:ner,ler,enir|3as:stinguir|4igas:ecir|2igas:caer|4ieras:erir|4as:lirse|4uelas:oler|3jas:oger|4iñas:reñir|4íbas:ohibir|3ías:nreír|3zas:rcer|5uerzas:orcer|2es:ar{,t{n,o,is,mi,vi,osi,bor,epor,nsul,fal,pe},min,scin,afirm,nform,astim}|4üeres:gorar|6uentres:ontrar|7uestes:ostarse|7iertes:ertarse|2ues:gar|4uegues:ogar|5uelgues:olgar|3ques:car|3íes:iar{u,ar,f}|5iernes:ernar|5uerdes:cordar|3ces:zar|5iences:enzar|4úses:husar|4ieses:esar{v,f}|5ienses:ensar|3úes:tuar|4uebes:probar|4iega:negar|5uesta:ostar|5ienta:lentar|5uenta:contar|4ieta:apretar|5ierra:errar|6uestra:ostrar|5iebra:uebrar|4ieza:pezar|5uerza:orzar|4ueña:oñar|5uerda:ecordar|5ienda:endar|4uela:volar|3ía:iar{r,ac,nv}|4uena:sonar|3úa:uar|4ueva:ovar|4ieva:nevar|4ón:poner{u,ro}|4én:ener|3z:acer{h,f}|2é:ever|2:alir~3edir:ide|3egir:ige{rr,el}|0r:ege,oge|1ir:ibe|5ir:vayas|4cerse:jezcas|4cir:uzcas|2er:etas,rras|2ir:sistas,cidas|3erse:tengas|4eguir:sigas|2irse:urras|6oler:huelas|4egir:ijas|2r:eas|2arse:es{r{te,mo,eg,mb},t,unt,ce,in,m,ud,fad,ll,icul,h}|7ostrar:uestres|6errar:yerres|6entar:ientes|6egar:iegues|2ar:illes,nches|5elar:ieles|3gar:ega|4obar:ueba|0er:n|1ar:á~2gas:tener|4gas:ponerse|7ientas:sentirse|1:r{dura,unta,e{parec,nac,v,cog}}|4huelas:oler|2es:amar|4ide:pedir|4ueba:probar|5igas:seguir|2á:estar|4ieles:helar|2:poner|4iegues:regar|2e:escribir|5uestes:costar|4iere:querer|5ientes:sentar|1as:ser|5yerres:errar|2vayas:ir|3ega:jugar|5iente:sentir|6uestres:mostrar|4ijas:regir",
      "secondPlural": "1d:r{e{ec{d,aman,r,al,j},orr,evolv,ov,scog},a{g{esti,ne,pe,ve,a,r},t{,es,vis,cos,men,esi,xpor},r{o{m,g,ll,d},ti,pi,bor,a,su,nt,eb},z{e,i{ir,eal,vil,an},u,r,ha,ca,lan},iv,nev,ov,c{e,ivo,i{t,epl,apl,if{or,ur,c,s},ed,p,n,r},r,us,sa,u},pañ,bañ,nseñ,ap,d{fa,uar,u,ren,lvi},i{gu,c{go,e,anun,i},r,ud,op,iv},j,n{e,do,io,i{cam,rm,oc,e,t}},m{ir,asti,u,l,s},l{zc,r,he,ve,ga,ña,i,gu,vo,io},us,pres,is,e,ch{du,cu,e},u,y},i{nsegu,onsist,ed,ñad,eprim,produc,educ,edec}}|3zcáis:ecer{sagrad,apar,fr}|2gáis:detener,mponer,enir|2éis:preparar,yudar|3quéis:aticar|5urmáis:ormir|4igáis:ecir|2áis:ubir|5zcáis:cerse|4éis:arse|4vayáis:irse|4áis:irse{d,r}~1d:r|4áis:rse{e,ti}|5irváis:servir|2áis:r{e{lv,p,omet,em,d{ven,ten,con,r},re,r,ñ,tos,sol,deb},i{dmit,ist,mbat,m,d,br,uñ,pl}}|2yáis:uir{estr,l}|4epáis:aber|5quepáis:caber|3zcáis:cir,ecer,enacer|4itáis:retir|7irtáis:ertirse|5irtáis:onvertir|7urmáis:ormirse|4idáis:medir|1áis:ver|4ijáis:regir|3jáis:xigir,rgir,oger|4iráis:erir{g,u}|4iñáis:reñir|3áis:guir|4gáis:enerse|2gáis:ntener,aler|5igáis:eguir|2igáis:aer|3záis:cer{or,nven}|2éis:ar{,re,ele,nu,t{n{gu,e,ca,o},ci,si,vi,s,ra,por,p,vo},uj,iaj}|2uéis:gar|3quéis:car|5quéis:rcarse|4éis:callarse|3céis:zar|3os:rse{a{or,mbr,tr,g,c,ud,ad,ll,rl,i,t{i,us,r,an,len},am,lm,sm,oj,ñ,as,ech},ne}|4íos:irse{pent,l}~6ir:vayáis|5cerse:ezcáis{aqu,j}|6entir:intáis|3irse:áis{id,urr}|4ir:vengáis|4er:ongáis|5ecir:digáis|3ir:báis|3arse:éis{ter,egr,ebr,e,u,t,cost,ued,lvid,ein,icul,erm,em,duch,ach,j}|3r:ais|4eír:iais~1d:r{a{reserv,pas,d{,bor,agra,an},am,alent,gust},trae}|2gáis:oponer|3iais:reír|2áis:escribir|1ais:ser|2vayáis:ir|5intáis:sentir",
      "firstPlural": "~~~",
      "third": "2a:er|2ga:ner,ler|4iera:erer|3ja:ger|4iegue:negar|5iente:lentar|5iebre:uebrar|2e:cuar|5ista:estir|5uerma:ormir|3zca:cir|4iga:ecir|2iga:ír|4ga:erse|5zca:cerse|4e:arse|7iente:entarse|7ueste:ostarse|5íe:riarse|5úe:uarse|4a:irse|7ienta:entirse|7ierta:ertirse~2a:ir|3zca:cer|2ya:uir|4epa:aber|5quepa:caber|4ita:etir|5ienta:entir|7ista:estirse|5ierta:ertir|4ueda:oder|5ienda:ender{t,c,ef}|4ida:edir|5ierda:erder|4iera:erir|4uera:orir|7uerma:ormirse|4iña:eñir|5uelva:olver|5irva:ervir|5ierva:hervir|4ueva:over|3a:guir|2ga:enir,alir|3ga:acer{h,f}|5iga:eguir|2iga:aer|1a:ver|3ja:gir|4ija:egir|4uela:oler|3ía:eír|4íba:ohibir|3za:cer{r,n}|5uerza:orcer|2e:ar|6évase:everse|6uévase:overse|6ídase:idirse|7óndase:onderse|7úrrase:urrirse|6óngase:oponerse|6órese:orarse|6árese:ararse|6iéguese:egarse|6équese:ecarse|6óquese:ocarse|6íquese:icarse|7érquese:ercarse|5éese:earse|6údese:udarse|7uérdese:ordarse|6ídese:idarse|7íllese:illarse|7állese:hallarse|7óllese:ollarse|7úrlese:urlarse|7úntese:guntarse|7ántese:antarse|7iértese:ertarse|7áctese:actarse|7áchese:acharse|7échese:echarse|7ánsese:ansarse|6ásese:asarse|7éinese:einarse|6ámese:amarse|7érmese:ermarse|7álmese:almarse|6éjese:ejarse|4iese:esar{v,f}|5iense:ensar|4úse:husar|2ue:gar|4uegue:ogar|5uelgue:olgar|3que:car|4üere:gorar|5ierre:errar|6uestre:ostrar|6uentre:ontrar|7iebre:ebrarse|5ueste:ostar|5uente:contar|5ierte:ertar|4iete:apretar|3ce:zar|4iece:pezar|5uerce:orzar|5ience:enzar|4ueve:ovar|4ieve:nevar|4ueñe:oñar|5uerde:cordar|5iende:endar|3íe:iar{u,r,f,ac,nv}|5ierne:ernar|4uene:sonar|4uele:volar|3úe:uar|4uebe:probar|3üe:guar~3cerse:ezca{aqu,j}|3cir:uzca|4ir:vaya|1er:a{p,et,ed,nd,rr,em,om,añ,e,s,eb}|1ir:a{mit,sist,cid,urr}|5entirse:pienta|5ertirse:ivierta|2er:ga{ten,on,val}|2erse:detenga|3ecir:diga|3ír:oiga|1r:sea|2gir:ija{ir,fl,x}|2ger:oja,eja|5oler:huela|1irse:lla|6irse:váyase|5egar:iegue|4gar:juegue|1arse:e{ter,egr,mbr,junt,eit,fad,ued,em,sm,call,icul}|5errar:yerre|5ostarse:acueste|5entar:iente|4elar:iele|2uarse:dúe|1ar:é~4ga:ponerse|7ienta:sentirse|4huela:oler|2é:estar,dar|4iele:helar|4iegue:regar|4iera:querer|5iente:sentar|1a:ser|5yerre:errar|2vaya:ir|4váyase:irse|3egue:jugar",
      "thirdPlural": "2an:er|2gan:ner,ler|4ieran:erer|4uevan:over|3jan:ger|4ieguen:negar|5ienten:lentar|5ierten:ertar|2en:cuar|5uerman:ormir|3zcan:cir|4igan:ecir|2igan:ír|4gan:erse|5zcan:cerse|4an:rse{de,i}|4en:arse|7ienten:entarse|7uesten:ostarse|5quen:carse~2an:ir|3zcan:cer|6uevan:overse|5uelvan:olver|5irvan:ervir|5iervan:hervir|2yan:uir|4epan:aber|5quepan:caber|4itan:etir|5ientan:entir|5istan:estir|5iertan:ertir|4uedan:oder|5iendan:ender{t,c,ef}|4idan:edir|5ierdan:erder|4ieran:erir|4ueran:orir|7uerman:ormirse|4iñan:eñir|3an:guir|2gan:enir,alir|3gan:acer{h,f}|5igan:eguir|2igan:aer|1an:ver|3jan:gir|4ijan:egir|4uelan:oler|3ían:eír|4íban:ohibir|3zan:cer{r,n}|5uerzan:orcer|2en:ar|2uen:gar|6ieguen:egarse|4ueguen:ogar|5uelguen:olgar|3quen:car|5uesten:ostar|5uenten:contar|7ierten:ertarse|4ieten:apretar|5ierren:errar|6uestren:ostrar|6uentren:ontrar|5iebren:uebrar|4üeren:gorar|3cen:zar|4iecen:pezar|5uercen:orzar|5iencen:enzar|4ueven:ovar|4ieven:nevar|4ueñen:oñar|5uerden:cordar|5ienden:endar|3íen:iar{u,r,f,ac,nv}|5iernen:ernar|4uenen:sonar|4uelen:volar|5iensen:ensar|4úsen:husar|4iesen:esar{v,f}|3úen:uar|4ueben:probar|3üen:guar|6érense:erarse|6órense:orarse|8ístrense:istrarse|7égrense:egrarse|7iébrense:ebrarse|5éense:earse|6équense:ecarse|6údense:udarse|6édense:edarse|7uérdense:ordarse|6ádense:adarse|6ídense:idarse|7íllense:illarse|7úrlense:urlarse|5íense:riarse|7úntense:guntarse|7éitense:eitarse|7ústense:ustarse|7áctense:actarse|7ánsense:ansarse|6ásense:asarse|7éinense:einarse|6ójense:ojarse|7úchense:ucharse|7échense:echarse|5úense:uarse|6áñense:añarse|7álmense:almarse|7ásmense:asmarse|6ávense:avarse|7iéntanse:entirse|7ístanse:estirse|7iértanse:ertirse|6ézcanse:uecerse|6évanse:everse|7úrranse:urrirse~4cerse:jezcan|4cir:uzcan|5over:luevan|5ir:vayan|2er:an{p,et,ed,nd,rr,em,om,añ,e,s,eb}|2ir:an{mit,sist,urr}|2irse:cidan,llan|3er:gan{ten,on,val}|3erse:detengan|4ecir:digan|4ír:oigan|2r:sean|3gir:ijan{ir,fl,x}|3ger:jan{o,e}|6oler:huelan|6egar:rieguen|5gar:jueguen|4carse:erquen|6ostarse:acuesten|2arse:en{junt,mbr,uej,erm,em,lam,ll,icul,ach}|6entar:ienten|6errar:yerren|2ar:illen,én|5elar:ielen|7irse:váyanse~4gan:ponerse|4huelan:oler|2én:estar|4ielen:helar|4ieguen:regar|4ieran:querer|5ienten:sentar|1an:ser|5yerren:errar|2vayan:ir|4váyanse:irse|3eguen:jugar"
    },
    "gerunds": {
      "gerunds": "2yendo:oer|1ndo:ñer|1endo:ir|4ibiendo:ebir|3uyendo:üir|3iendo:eír~1ndo:r|2iendo:er|4iniendo:enir|5istiendo:estir|5irtiendo:ertir|4itiendo:etir|5intiendo:entir|4iciendo:ecir|1endo:ir{gu,qu,red}|5iguiendo:eguir|5indiendo:endir|4udiendo:poder|4idiendo:edir|4igiendo:egir|5urmiendo:ormir|5irviendo:ervir|4iriendo:erir|4uriendo:orir|5udriendo:odrir|2yendo:r{í,ui,ee,ae}|4iñendo:eñir|2endo:llir~4r:iendo{ib,ub,mb,un,fin,rn,t{,sis,xis,mi},uc,unc,arc,d{un,an,cin,u,a,ci,vi,si},g{i{ir,er,fl,x},n,ur,umer,u},l{sa,p,bo,u},im,um,iv,r{ur,qui{d,n},uf,b,t},as,p}|7ebir:ncibiendo|5er:endo{i{ert,et,er,rr,omp},roy}|5eír:riendo|6üir:guyendo~2yendo:ir"
    },
    "perfecto": {
      "perfecto": "0ado:|2ido:er,over|3do:rse|4ido:erse|6uesto:onerse~1do:r,ndecir|2ía cepillado:pillar|2ído:eer,aer|4to:mper|4uesto:oner|2isto:ver|5uelto:olver|3to:ribir|3ito:freír|4uerto:orir|3ierto:brir|4echo:acer{f,h}|4icho:ecir~2rse:do{a{ec,uej,junt,eit,ct,prepar,ter,ued,mud,hall,nce,lam},penti,lli}|3:mitado|3er:ido{eb,ab,met,c,s,em,om,teg,og,d{ce,n,o,r},rr,ten,añ,ol,val}|2r:do{uci,urri,nreí}|3erse:vido{o,e}~2ido:querer|3do:sentirse|1do:reír"
    }
  };

  // uncompress them
  Object.keys(model$1).forEach(k => {
    Object.keys(model$1[k]).forEach(form => {
      model$1[k][form] = uncompress(model$1[k][form]);
    });
  });

  const { gerunds } = model$1;
  // =-=-
  const m$3 = {
    fromGerund: reverse(gerunds.gerunds),
    toGerund: gerunds.gerunds,
  };

  const fromGerund = function (str) {
    return convert(str, m$3.fromGerund)
  };
  const toGerund$1 = function (str) {
    return convert(str, m$3.toGerund)
  };

  const { perfecto } = model$1;

  // =-=-
  const m$2 = {
    fromPerfecto: reverse(perfecto.perfecto),
    toPerfecto: perfecto.perfecto,
  };

  const fromPerfecto = function (str) {
    return convert(str, m$2.fromPerfecto)
  };
  const toPerfecto$1 = function (str) {
    return convert(str, m$2.toPerfecto)
  };

  // generate all reflexive forms of this verb
  const toReflexive$1 = function (str) {
    return {
      first: str + 'me',
      firstPlural: str + 'nos',
      second: str + 'te',
      secondPlural: str + 'os',
      third: str + 'se',
      thirdPlural: str + 'se'
    }
  };

  const stripReflexive$3 = function (str) {
    str = str.replace(/(me|nos|te|os|se)$/, ''); // 🤞
    return str
  };

  const { presentTense: presentTense$1, pastTense: pastTense$1, imperfectTense: imperfectTense$1, futureTense: futureTense$1, conditional: conditional$1, subjunctive: subjunctive$1, imperfectSubjunctive, imperative: imperative$1 } = model$1;

  const doEach = function (str, m) {
    return {
      first: convert(str, m.first),
      second: convert(str, m.second),
      third: convert(str, m.third),
      firstPlural: convert(str, m.firstPlural),
      secondPlural: convert(str, m.secondPlural),
      thirdPlural: convert(str, m.thirdPlural)
    }
  };

  const toPresent$1 = (str) => doEach(str, presentTense$1);
  const toPast$1 = (str) => doEach(str, pastTense$1);
  const toImperfect$1 = (str) => doEach(str, imperfectTense$1);
  const toFuture$1 = (str) => doEach(str, futureTense$1);
  const toSubjunctive$1 = (str) => doEach(str, subjunctive$1);
  // 'si pudiera...' (-ra series)
  const toImperfectSubjunctive$1 = (str) => doEach(str, imperfectSubjunctive);
  // 'si pudiese...' - the -se series is a regular respelling of the -ra one
  const toImperfectSubjunctiveSe$1 = (str) => {
    const obj = toImperfectSubjunctive$1(str);
    return {
      first: obj.first ? obj.first.replace(/ra$/, 'se') : obj.first,
      second: obj.second ? obj.second.replace(/ras$/, 'ses') : obj.second,
      third: obj.third ? obj.third.replace(/ra$/, 'se') : obj.third,
      firstPlural: obj.firstPlural ? obj.firstPlural.replace(/ramos$/, 'semos') : obj.firstPlural,
      secondPlural: obj.secondPlural ? obj.secondPlural.replace(/rais$/, 'seis') : obj.secondPlural,
      thirdPlural: obj.thirdPlural ? obj.thirdPlural.replace(/ran$/, 'sen') : obj.thirdPlural,
    }
  };
  const toConditional$1 = (str) => doEach(str, conditional$1);
  const toImperative$1 = (str) => {
    const obj = doEach(str, imperative$1);
    // imperative has no first-person
    // because ...you can't tell yourself to do something.
    obj.first = '';
    obj.firstPlural = '';
    return obj
  };

  // an array of every inflection, for '{inf}' syntax
  const all$2 = function (str) {
    let res = [str]
      .concat(
        Object.values(toPresent$1(str)),
        Object.values(toPast$1(str)),
        Object.values(toImperfect$1(str)),
        Object.values(toFuture$1(str)),
        Object.values(toConditional$1(str)),
        Object.values(toImperative$1(str)),
        Object.values(toSubjunctive$1(str)),
        Object.values(toImperfectSubjunctive$1(str)),
        Object.values(toImperfectSubjunctiveSe$1(str)),
        Object.values(toReflexive$1(str)), //infinitive reflexive - 'quemarme'
        toGerund$1(str),
        toPerfecto$1(str)
      )
      .filter((s) => s);
    res = new Set(res);
    return Array.from(res)
  };

  const { presentTense, pastTense, imperfectTense, futureTense, conditional, subjunctive, imperative } = model$1;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse(m[k]);
      return h
    }, {})
  };

  // suffix-thumb v6 applies its closest rule to any input, so a word the model
  // never saw still comes back changed - only accept a root that conjugates
  // back into the word we started with
  const safe = (str, rev, fwd) => {
    const out = convert(str, rev);
    return convert(out, fwd) === str ? out : str
  };

  const presentRev = revAll(presentTense);
  const pastRev = revAll(pastTense);
  const imperfectRev = revAll(imperfectTense);
  const futureRev = revAll(futureTense);
  const conditionalRev = revAll(conditional);
  const subjunctRev = revAll(subjunctive);
  const imperativeRev = revAll(imperative);

  //relajarse -> relajar
  const stripReflexive$2 = function (str) {
    str = str.replace(/arse$/, 'ar');
    str = str.replace(/arte$/, 'ir');
    str = str.replace(/arme$/, 'ar');

    str = str.replace(/irse$/, 'ir');
    str = str.replace(/irte$/, 'ir');

    str = str.replace(/erse$/, 'er');
    str = str.replace(/ose$/, 'o');
    return str
  };

  const fromPresent = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, presentRev.first, presentTense.first),
      'SecondPerson': (s) => safe(s, presentRev.second, presentTense.second),
      'ThirdPerson': (s) => safe(s, presentRev.third, presentTense.third),
      'FirstPersonPlural': (s) => safe(s, presentRev.firstPlural, presentTense.firstPlural),
      'SecondPersonPlural': (s) => safe(s, presentRev.secondPlural, presentTense.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, presentRev.thirdPlural, presentTense.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromPast = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, pastRev.first, pastTense.first),
      'SecondPerson': (s) => safe(s, pastRev.second, pastTense.second),
      'ThirdPerson': (s) => safe(s, pastRev.third, pastTense.third),
      'FirstPersonPlural': (s) => safe(s, pastRev.firstPlural, pastTense.firstPlural),
      'SecondPersonPlural': (s) => safe(s, pastRev.secondPlural, pastTense.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, pastRev.thirdPlural, pastTense.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromImperfect = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, imperfectRev.first, imperfectTense.first),
      'SecondPerson': (s) => safe(s, imperfectRev.second, imperfectTense.second),
      'ThirdPerson': (s) => safe(s, imperfectRev.third, imperfectTense.third),
      'FirstPersonPlural': (s) => safe(s, imperfectRev.firstPlural, imperfectTense.firstPlural),
      'SecondPersonPlural': (s) => safe(s, imperfectRev.secondPlural, imperfectTense.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, imperfectRev.thirdPlural, imperfectTense.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    // person-ambiguous forms ('hablaba' is 1st or 3rd) - try third-person
    return safe(str, imperfectRev.third, imperfectTense.third)
  };

  const fromFuture = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, futureRev.first, futureTense.first),
      'SecondPerson': (s) => safe(s, futureRev.second, futureTense.second),
      'ThirdPerson': (s) => safe(s, futureRev.third, futureTense.third),
      'FirstPersonPlural': (s) => safe(s, futureRev.firstPlural, futureTense.firstPlural),
      'SecondPersonPlural': (s) => safe(s, futureRev.secondPlural, futureTense.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, futureRev.thirdPlural, futureTense.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromConditional = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, conditionalRev.first, conditional.first),
      'SecondPerson': (s) => safe(s, conditionalRev.second, conditional.second),
      'ThirdPerson': (s) => safe(s, conditionalRev.third, conditional.third),
      'FirstPersonPlural': (s) => safe(s, conditionalRev.firstPlural, conditional.firstPlural),
      'SecondPersonPlural': (s) => safe(s, conditionalRev.secondPlural, conditional.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, conditionalRev.thirdPlural, conditional.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromSubjunctive = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, subjunctRev.first, subjunctive.first),
      'SecondPerson': (s) => safe(s, subjunctRev.second, subjunctive.second),
      'ThirdPerson': (s) => safe(s, subjunctRev.third, subjunctive.third),
      'FirstPersonPlural': (s) => safe(s, subjunctRev.firstPlural, subjunctive.firstPlural),
      'SecondPersonPlural': (s) => safe(s, subjunctRev.secondPlural, subjunctive.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, subjunctRev.thirdPlural, subjunctive.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return str
  };

  const fromImperative = (str, form) => {
    const forms = {
      'FirstPerson': (s) => safe(s, imperativeRev.first, imperative.first),
      'SecondPerson': (s) => safe(s, imperativeRev.second, imperative.second),
      'ThirdPerson': (s) => safe(s, imperativeRev.third, imperative.third),
      'FirstPersonPlural': (s) => safe(s, imperativeRev.firstPlural, imperative.firstPlural),
      'SecondPersonPlural': (s) => safe(s, imperativeRev.secondPlural, imperative.secondPlural),
      'ThirdPersonPlural': (s) => safe(s, imperativeRev.thirdPlural, imperative.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return str
  };

  const pRev = reverse(model$1.nouns.plurals);

  const toPlural$1 = (str) => convert(str, model$1.nouns.plurals);
  const toSingular$1 = (str) => convert(str, pRev);

  const all$1 = function (str) {
    const plur = toPlural$1(str);
    if (str === plur) {
      return [str]
    }
    return [str, plur]
  };
  // console.log(toFemale("principesco") === "principesca")
  // console.log(fromFemale("principesca") === "principesco")
  // console.log(toPlural("principesco") === "principescos")
  // console.log(toSingular("principescos") === "principesco")
  // console.log(toSingular("sombras") === "sombra")

  const toMasculine = function (str) {
    const arr = [
      ['ieta', 'ieto'],
      ['erra', 'erro'],
      ['rica', 'rico'],
      ['esta', 'esto'],
      ['ueña', 'ueño'],
      ['lera', 'lero'],
      ['rata', 'rato'],
      ['uida', 'uido'],
      ['anda', 'ando'],
      ['uela', 'uelo'],
      ['desa', 'dés'],
      ['adas', 'ados'],
      ['oras', 'ores'],
      ['chas', 'chones'],
      ['amas', 'amones'],
      ['ica', 'ico'],
      ['iza', 'izo'],
      ['ona', 'ón'],
      ['ada', 'ado'],
      ['ora', 'or'],
      ['oga', 'ogo'],
      ['era', 'ero'],
      ['ana', 'ano'],
      ['iva', 'ivo'],
      ['ica', 'ico'],
      ['ina', 'ino'],
      ['ita', 'ito'],
      ['cia', 'ción'],
      ['ia', 'io'],
      ['ea', 'eo'],
      ['a', 'o'],
      ['as', 'os'],
    ];
    for (let i = 0; i < arr.length; i += 1) {
      const [suff, repl] = arr[i];
      if (str.endsWith(suff)) {
        str = str.substr(0, str.length - suff.length);
        str += repl;
        return str
      }
    }
    return str
  };

  const { f: f$2, mp, fp } = model$1.adjectives;

  const fRev = reverse(f$2);
  const mpRev = reverse(mp);
  const fpRev = reverse(fp);

  const toFemale = (str) => convert(str, f$2);
  const toPlural = (str) => convert(str, mp);
  const toFemalePlural = (str) => convert(str, fp);
  const fromFemale = (str) => convert(str, fRev);
  const toSingular = (str) => convert(str, mpRev);
  const fromFemalePlural = (str) => convert(str, fpRev);

  const all = function (str) {
    let arr = [str];
    arr.push(toFemale(str));
    arr.push(toPlural(str));
    arr.push(toFemalePlural(str));
    arr = arr.filter(s => s);
    arr = new Set(arr);
    return Array.from(arr)
  };

  var adjective = {
    all,
    toFemale,
    toPlural,
    toFemalePlural,
    fromFemale,
    toSingular,
    fromFemalePlural,
  };
  // console.log(toFemale("principesco") === "principesca")
  // console.log(fromFemale("principesca") === "principesco")
  // console.log(toPlural("principesco") === "principescos")
  // console.log(toSingular("principescos") === "principesco")

  var methods$1 = {
    verb: {
      fromGerund,
      fromPresent,
      fromPast,
      fromImperfect,
      fromFuture,
      fromConditional,
      fromSubjunctive,
      fromImperative,
      toPresent: toPresent$1,
      toPast: toPast$1,
      toImperfect: toImperfect$1,
      toFuture: toFuture$1,
      toConditional: toConditional$1,
      toGerund: toGerund$1,
      toSubjunctive: toSubjunctive$1,
      toImperfectSubjunctive: toImperfectSubjunctive$1,
      toImperfectSubjunctiveSe: toImperfectSubjunctiveSe$1,
      toImperative: toImperative$1,
      fromPerfecto,
      toPerfecto: toPerfecto$1,
      toReflexive: toReflexive$1,
      stripReflexive: stripReflexive$3,
      all: all$2
    },
    noun: {
      toPlural: toPlural$1,
      toSingular: toSingular$1,
      toMasculine,
      all: all$1
    },
    adjective
  };

  // hand-curated entries that win over everything else in the lexicon.
  // spanish marks question-words with an accent - 'qué es' vs 'creo que es'
  const lex = {
    // reflexive/impersonal clitic - 'se habla español'
    se: 'Pronoun',
    // 'yo sé' (saber) + imperative of ser
    'sé': ['Verb', 'PresentTense', 'FirstPerson'],

    // unaccented forms are conjunctions/relativizers
    que: 'Conjunction',
    como: 'Conjunction',
    donde: 'Pronoun',
    cuando: 'Conjunction',
    // accented forms are question-words
    'qué': 'QuestionWord',
    'cómo': 'QuestionWord',
    'dónde': 'QuestionWord',
    'cuándo': 'QuestionWord',
    'quién': 'QuestionWord',
    'quiénes': 'QuestionWord',
    'cuál': 'QuestionWord',
    'cuáles': 'QuestionWord',
    'cuánto': 'QuestionWord',
    'cuánta': 'QuestionWord',
    'cuántos': 'QuestionWord',
    'cuántas': 'QuestionWord',
    'por qué': 'QuestionWord',

    lo: 'Pronoun',
    algo: 'Pronoun',

    si: 'Condition',
    'sí': 'Adverb', // yes

    // impersonal 'there is/are' - present of haber
    hay: ['Verb', 'PresentTense'],

    no: 'Negative',
    nunca: 'Negative', //never

    // imperfect of ser
    era: ['Copula', 'Imperfect'],
    eras: ['Copula', 'Imperfect'],
    'éramos': ['Copula', 'Imperfect'],
    erais: ['Copula', 'Imperfect'],
    eran: ['Copula', 'Imperfect'],

    irse: ['Reflexive', 'Infinitive']
  };

  // possessive determiners - 'mi casa', not pronouns ('la mía')
  const possDet = [
    'mi', // singular  my (masculine and feminine)
    'mis', // plural my (masculine and feminine)
    'tu', // singular  your (informal singular, masculine and feminine)
    'tus', // plural your (informal singular, masculine and feminine)
    'su', // singular" his/her/its/your (formal singular, masculine and feminine)
    'sus', // plural  his/her/its/your/their (masculine and feminine)
    'nuestro', // singular masculine our
    'nuestra', // singular feminine  our
    'nuestros', // plural masculine  our
    'nuestras', // plural feminine   our
    'vuestro', // singular masculine your (informal plural)
    'vuestra', // singular feminine  your (informal plural)
    'vuestros', // plural masculine  your (informal plural)
    'vuestras' // plural feminine     your (informal plural)
  ];
  possDet.forEach((str) => {
    lex[str] = ['Determiner', 'Possessive'];
  });

  // possessive pronouns - 'la casa es mía'
  const possPro = [
    'mío', 'mía', 'míos', 'mías',
    'tuyo', 'tuya', 'tuyos', 'tuyas',
    'suyo', 'suya', 'suyos', 'suyas',
  ];
  possPro.forEach((str) => {
    lex[str] = ['Pronoun', 'Possessive'];
  });

  const {
    toPresent,
    toPast,
    toImperfect,
    toFuture,
    toConditional,
    toGerund,
    toPerfecto,
    toImperative,
    toSubjunctive,
    toImperfectSubjunctive,
    toImperfectSubjunctiveSe,
    toReflexive
  } = methods$1.verb;
  const lexicon$1 = {};

  const tagMap = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural'
  };

  const addWords = function (obj, tag, lex) {
    // when two persons share a form ('hablaba' is 1st + 3rd person),
    // don't pick one - just tag the tense
    const counts = {};
    Object.keys(obj).forEach((k) => {
      counts[obj[k]] = (counts[obj[k]] || 0) + 1;
    });
    Object.keys(obj).forEach((k) => {
      const w = obj[k];
      if (!w || lex[w]) {
        return
      }
      if (counts[w] > 1) {
        lex[w] = [tag];
      } else {
        lex[w] = [tag, tagMap[k]];
      }
    });
  };

  // attach the reflexive clitic to affirmative imperatives - 'lávate', 'lávese'
  const toImperativeReflexive = function (obj) {
    const out = {};
    if (obj.second) {
      out.second = obj.second + 'te';
    }
    if (obj.third) {
      out.third = obj.third + 'se';
    }
    if (obj.firstPlural) {
      out.firstPlural = obj.firstPlural + 'nos';
    }
    if (obj.thirdPlural) {
      out.thirdPlural = obj.thirdPlural + 'se';
    }
    return out
  };

  Object.keys(lexData).forEach((tag) => {
    const wordsObj = unpack(lexData[tag]);
    Object.keys(wordsObj).forEach((w) => {
      lexicon$1[w] = tag;

      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        // add present tense
        let obj = toPresent(w);
        addWords(obj, 'PresentTense', lexicon$1);
        // add past tense
        obj = toPast(w);
        addWords(obj, 'PastTense', lexicon$1);
        // add imperfect
        obj = toImperfect(w);
        addWords(obj, 'Imperfect', lexicon$1);
        // add future tense
        obj = toFuture(w);
        addWords(obj, 'FutureTense', lexicon$1);
        // add conditional
        obj = toConditional(w);
        addWords(obj, 'Conditional', lexicon$1);
        // add gerund
        let str = toGerund(w);
        lexicon$1[str] = lexicon$1[str] || 'Gerund';
        // add perfecto
        str = toPerfecto(w);
        lexicon$1[str] = lexicon$1[str] || 'Perfecto';
        // add reflexive infinitive forms
        obj = toReflexive(w);
        addWords(obj, 'Reflexive', lexicon$1);
        // add imperative
        obj = toImperative(w);
        addWords(obj, 'Imperative', lexicon$1);
        // add reflexive for some imperative forms
        obj = toImperativeReflexive(obj);
        addWords(obj, 'Reflexive', lexicon$1);
        // add toSubjunctive
        obj = toSubjunctive(w);
        addWords(obj, 'Subjunctive', lexicon$1);
        // imperfect subjunctive - 'si pudiera', 'si pudiese'
        obj = toImperfectSubjunctive(w);
        addWords(obj, 'Subjunctive', lexicon$1);
        obj = toImperfectSubjunctiveSe(w);
        addWords(obj, 'Subjunctive', lexicon$1);
      }
      if (tag === 'Adjective') {
        const f = methods$1.adjective.toFemale(w);
        lexicon$1[f] = lexicon$1[f] || ['Adjective', 'FemaleAdjective', 'SingularAdjective'];
        const fs = methods$1.adjective.toFemalePlural(w);
        lexicon$1[fs] = lexicon$1[fs] || ['Adjective', 'FemaleAdjective', 'PluralAdjective'];
      }
      if (tag === 'Cardinal') {
        lexicon$1[w] = ['Cardinal', 'TextValue'];
      }
      if (tag === 'Ordinal') {
        lexicon$1[w] = ['Ordinal', 'TextValue'];
      }
    });
  });

  // hand-curated entries always win
  Object.assign(lexicon$1, lex);

  const verbForm = function (term) {
    const want = [
      'FirstPerson',
      'SecondPerson',
      'ThirdPerson',
      'FirstPersonPlural',
      'SecondPersonPlural',
      'ThirdPersonPlural'
    ];
    return want.find((tag) => term.tags.has(tag))
  };

  //relajarse -> relajar
  const stripReflexive$1 = function (str) {
    str = str.replace(/se$/, '');
    str = str.replace(/te$/, '');
    str = str.replace(/me$/, '');
    return str
  };

  const root = function (view) {
    const { verb, noun, adjective } = view.world.methods.two.transform;
    view.docs.forEach((terms) => {
      terms.forEach((term) => {
        // 'machine' may hold a clitic-stripped stem - 'dámelo' → 'da'
        let str = term.implicit || term.machine || term.normal || term.text;

        if (term.tags.has('Verb')) {
          // copulas are a closed set - ser + estar
          if (term.tags.has('Copula')) {
            term.root = /^est/.test(str) ? 'estar' : 'ser';
            return
          }
          // get infinitive form of the verb
          if (term.tags.has('Reflexive')) {
            term.root = stripReflexive$1(str);
            return
          }
          const form = verbForm(term);
          if (term.tags.has('Gerund')) {
            term.root = verb.fromGerund(str, form);
          } else if (term.tags.has('Perfecto')) {
            term.root = verb.fromPerfecto(str, form);
          } else if (term.tags.has('Imperfect')) {
            term.root = verb.fromImperfect(str, form);
          } else if (term.tags.has('PresentTense')) {
            term.root = verb.fromPresent(str, form);
          } else if (term.tags.has('PastTense')) {
            term.root = verb.fromPast(str, form);
          } else if (term.tags.has('FutureTense')) {
            term.root = verb.fromFuture(str, form);
          } else if (term.tags.has('Conditional')) {
            term.root = verb.fromConditional(str, form);
          } else if (term.tags.has('Imperative')) {
            term.root = verb.fromImperative(str, form);
          } else {
            // guess!
            term.root = verb.fromPresent(str, form);
          }
        }

        // nouns -> singular masculine form
        if (term.tags.has('Noun')) {
          if (term.tags.has('Plural')) {
            str = noun.toSingular(str);
          }
          if (term.tags.has('FemaleNoun')) ;
          term.root = str;
        }

        // nouns -> singular masculine form
        if (term.tags.has('Adjective')) {
          if (term.tags.has('PluralAdjective')) {
            if (term.tags.has('FemaleAdjective')) {
              str = adjective.fromFemalePlural(str);
            } else {
              str = adjective.toSingular(str);
            }
          }
          if (term.tags.has('FemaleAdjective')) {
            str = adjective.fromFemale(str);
          }
          term.root = str;
        }
      });
    });
    return view
  };

  var lexicon = {
    words: lexicon$1,
    compute: { root: root },
    methods: {
      two: {
        transform: methods$1
      }
    },
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E


  // á	Alt + 0225
  // é	Alt + 0233
  // í	Alt + 0237
  // ó	Alt + 024
  // ú	Alt + 0250
  // ü	Alt + 0252
  // ñ	Alt + 0241
  // ¿	Alt + 0191
  // ¡	Alt + 0161

  const compact = {
    '?': 'Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÃÅãåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'þƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    i: 'ĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇії',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÕØðõøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'µŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰμυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  const unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });

  var contractions = [
    { word: 'al', out: ['a', 'el'] },
    { word: 'del', out: ['de', 'el'] },
  ];

  var tokenizer = {
    mutate: (world) => {
      world.model.one.unicode = unicode;

      world.model.one.contractions = contractions;

      // 'que' -> 'quebec'
      delete world.model.one.lexicon.que;
    }
  };

  const hasApostrophe = /['‘’‛‵′`´]/;

  // normal regexes
  const doRegs = function (str, regs) {
    for (let i = 0; i < regs.length; i += 1) {
      if (regs[i][0].test(str) === true) {
        return regs[i]
      }
    }
    return null
  };

  const checkRegex = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    const { regexText, regexNormal, regexNumbers } = world.model.two;
    const normal = term.machine || term.normal;
    let text = term.text;
    // keep dangling apostrophe?
    if (hasApostrophe.test(term.post) && !hasApostrophe.test(term.pre)) {
      text += term.post.trim();
    }
    let arr = doRegs(text, regexText) || doRegs(normal, regexNormal);
    // hide a bunch of number regexes behind this one
    if (!arr && /[0-9]/.test(normal)) {
      arr = doRegs(normal, regexNumbers);
    }
    if (arr) {
      setTag([term], arr[1], world, false, `1-regex- '${arr[2] || arr[0]}'`);
      term.confidence = 0.6;
      return true
    }
    return null
  };

  const titleCase = /^\p{Lu}[\p{Ll}'’]/u;
  const hasNumber = /[0-9]/;
  const notProper = ['Date', 'Month', 'WeekDay', 'Unit', 'Expression'];

  const tagTitleCase = function (terms, index, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[index];
    const str = term.text || '';
    // titlecase and not first word of sentence
    if (index !== 0 && titleCase.test(str) === true && hasNumber.test(str) === false) {
      // skip Dates and stuff
      if (notProper.find((tag) => term.tags.has(tag))) {
        return
      }
      // first word in a quotation?
      if (/["']$/.test(term.pre)) {
        return
      }
      if (term.normal === 'the') {
        return
      }
      setTag([term], ['ProperNoun', 'Noun'], world, false, '2-titlecase');
    }
  };

  const min = 1400;
  const max = 2100;

  const dateWords = new Set(['pendant', 'dans', 'avant', 'apres', 'pour', 'en']);

  const seemsGood = function (term) {
    if (!term) {
      return false
    }
    if (dateWords.has(term.normal)) {
      return true
    }
    if (term.tags.has('Date') || term.tags.has('Month') || term.tags.has('WeekDay')) {
      return true
    }
    return false
  };

  const seemsOkay = function (term) {
    if (!term) {
      return false
    }
    if (term.tags.has('Ordinal')) {
      return true
    }
    return false
  };

  // recognize '1993' as a year
  const tagYear = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      const num = Number(term.normal);
      // number between 1400 and 2100
      if (num && !isNaN(num)) {
        if (num > min && num < max) {
          if (seemsGood(terms[i - 1]) || seemsGood(terms[i + 1])) {
            setTag([term], 'Year', world, false, '1-tagYear');
            return true
          }
          // or is it really-close to a year?
          if (num > 1950 && num < 2025) {
            if (seemsOkay(terms[i - 1]) || seemsOkay(terms[i + 1])) {
              setTag([term], 'Year', world, false, '1-tagYear-close');
              return true
            }
          }
        }
      }
    }
    return null
  };

  const oneLetterAcronym = /^[A-ZÄÖÜ]('s|,)?$/;
  const isUpperCase = /^[A-Z-ÄÖÜ]+$/;
  const periodAcronym = /([A-ZÄÖÜ]\.)+[A-ZÄÖÜ]?,?$/;
  const noPeriodAcronym = /[A-ZÄÖÜ]{2,}('s|,)?$/;
  const lowerCaseAcronym = /([a-zäöü]\.)+[a-zäöü]\.?$/;



  const oneLetterWord = {
    I: true,
    A: true,
  };
  // just uppercase acronyms, no periods - 'UNOCHA'
  const isNoPeriodAcronym = function (term, model) {
    const str = term.text;
    // ensure it's all upper-case
    if (isUpperCase.test(str) === false) {
      return false
    }
    // long capitalized words are not usually either
    if (str.length > 5) {
      return false
    }
    // 'I' is not a acronym
    if (oneLetterWord.hasOwnProperty(str)) {
      return false
    }
    // known-words, like 'PIZZA' is not an acronym.
    if (model.one.lexicon.hasOwnProperty(term.normal)) {
      return false
    }
    //like N.D.A
    if (periodAcronym.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym.test(str) === true) {
      return true
    }
    return false
  };

  const isAcronym = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    //these are not acronyms
    if (term.tags.has('RomanNumeral') || term.tags.has('Acronym')) {
      return null
    }
    //non-period ones are harder
    if (isNoPeriodAcronym(term, world.model)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-no-period-acronym');
      return true
    }
    // one-letter acronyms
    if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym.test(term.text)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-one-letter-acronym');
      return true
    }
    //if it's a very-short organization?
    if (term.tags.has('Organization') && term.text.length <= 3) {
      setTag([term], 'Acronym', world, false, '3-org-acronym');
      return true
    }
    // upper-case org, like UNESCO
    if (term.tags.has('Organization') && isUpperCase.test(term.text) && term.text.length <= 6) {
      setTag([term], 'Acronym', world, false, '3-titlecase-acronym');
      return true
    }
    return null
  };

  // spanish attaches object/reflexive pronouns to the end of infinitives,
  // gerunds and affirmative imperatives - 'quemarme', 'diciéndoselo', 'dámelo'.
  // attaching them usually adds a written accent to preserve stress,
  // so we de-accent the stem before checking it.

  // indirect-object clitics can stack before a direct-object one - 'me lo'
  const indirect = ['me', 'te', 'se', 'nos', 'os', 'le', 'les'];
  const direct = ['lo', 'los', 'la', 'las', 'le', 'les'];
  let endings = [];
  indirect.forEach(a => {
    direct.forEach(b => {
      endings.push(a + b);
    });
  });
  endings = endings.concat(indirect, direct);
  // longest-first, so 'melo' is tried before 'lo'
  endings.sort((a, b) => b.length - a.length);

  const accents = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
  const deAccent = (str) => str.replace(/[áéíóú]/g, (c) => accents[c]);

  const isGerund = /(ando|iendo|yendo)$/;
  const isInfinitive = /(ar|er|ir)$/;

  const verbish = ['Imperative', 'PresentTense', 'Infinitive', 'Verb', 'Copula', 'Subjunctive'];
  const isVerb = function (entry) {
    if (!entry) {
      return false
    }
    const tags = typeof entry === 'string' ? [entry] : entry;
    return tags.some(t => verbish.includes(t))
  };

  const tryStem = function (stem, ending, lexicon) {
    const plain = deAccent(stem);
    // 'levantándose', 'diciéndomelo'
    if (isGerund.test(plain)) {
      return { tags: ['Gerund'], stem: plain }
    }
    // 'quemarme', 'mezclarlo' - verify against the lexicon,
    // or accept a long-enough infinitive shape ('bloguearlo')
    if (isInfinitive.test(plain)) {
      if (isVerb(lexicon[plain]) || plain.length >= 5) {
        return { tags: ['Infinitive'], stem: plain }
      }
      return null
    }
    // affirmative imperative - 'dámelo' → 'da', 'hazme' → 'haz'
    if (isVerb(lexicon[plain])) {
      return { tags: ['Imperative', 'SecondPerson'], stem: plain }
    }
    // 'vámonos' → 'vamos' (the final -s is dropped before 'nos')
    if (ending.startsWith('nos') && isVerb(lexicon[plain + 's'])) {
      return { tags: ['Imperative', 'FirstPersonPlural'], stem: plain + 's' }
    }
    return null
  };

  const checkEnclitic = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const lexicon = world.model.one.lexicon;
    const term = terms[i];
    if (term.tags.size > 0) {
      return null
    }
    const str = term.machine || term.normal;
    for (let k = 0; k < endings.length; k += 1) {
      const e = endings[k];
      if (str.length - e.length >= 2 && str.endsWith(e)) {
        const stem = str.slice(0, str.length - e.length);
        const found = tryStem(stem, e, lexicon);
        if (found !== null) {
          // let the root-computation see through the clitics
          term.machine = found.stem;
          setTag([term], found.tags, world, false, '2-enclitic');
          term.confidence = 0.8;
          return true
        }
      }
    }
    return null
  };

  // const isTitleCase = function (str) {
  //   return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  // }

  // const hasNoVerb = function (terms) {
  //   return !terms.find(t => t.tags.has('#Verb'))
  // }

  const fallback = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.size === 0) {
      setTag([term], 'Noun', world, false, '2-fallback');
    }
  };

  //sweep-through all suffixes
  const suffixLoop = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 1; i -= 1) {
      const suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        const tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const suffixes = world.model.two.suffixPatterns;
    const term = terms[i];
    if (term.tags.size === 0) {
      let tag = suffixLoop(term.normal, suffixes);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-suffix');
        term.confidence = 0.7;
        return true
      }
      // try implicit form of word, too
      if (term.implicit) {
        tag = suffixLoop(term.implicit, suffixes);
        if (tag !== null) {
          setTag([term], tag, world, false, '2-implicit-suffix');
          term.confidence = 0.7;
          return true
        }
      }
    }
    return null
  };

  // deduce gender of a noun, but it's suffix
  const guessNounGender = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const guessGender = world.methods.two.guessGender;
    const term = terms[i];
    if (term.tags.has('Noun') && !term.tags.has('FemaleNoun') && !term.tags.has('MaleNoun') && !term.tags.has('Pronoun')) {
      const str = term.machine || term.normal;
      const found = guessGender(str);
      if (found) {
        const tag = found === 'm' ? 'MaleNoun' : 'FemaleNoun';
        setTag([term], tag, world, false, '3-guessGender');
      }
    }
  };

  // deduce plurality of a noun, by its suffix
  const guessPlural = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const looksPlural = world.methods.two.looksPlural;
    const term = terms[i];
    if (term.tags.has('Noun') && !term.tags.has('Singular') && !term.tags.has('Plural') && !term.tags.has('Pronoun')) {
      const str = term.machine || term.normal;
      if (looksPlural(str)) {
        setTag([term], 'Plural', world, false, '3-guessPlural');
      }
    }
  };

  // deduce plurality of an adjective, by its suffix
  const guessAdjPlural = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const looksPlural = world.methods.two.looksPlural;
    const term = terms[i];
    if (term.tags.has('Adjective') && !term.tags.has('SingularAdjective') && !term.tags.has('PluralAdjective')) {
      const str = term.machine || term.normal;
      if (looksPlural(str) === true) {
        setTag([term], 'PluralAdjective', world, false, '3-guessPlural');
      } else {
        setTag([term], 'SingularAdjective', world, false, '3-guessPlural');
      }
    }
  };

  // only -o/-a adjectives are gendered.
  // '-e' and consonant endings are common-gender ('grande', 'feliz', 'azul')
  const guessGender$1 = function (str) {
    if (str.endsWith('o') || str.endsWith('os')) {
      return 'm'
    }
    if (str.endsWith('a') || str.endsWith('as')) {
      return 'f'
    }
    return null
  };

  // deduce gender of an adjective, by its suffix
  const guessAdjGender = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('Adjective') && !term.tags.has('FemaleAdjective') && !term.tags.has('MaleAdjective')) {
      const str = term.machine || term.normal;
      const found = guessGender$1(str);
      if (found === 'f') {
        setTag([term], 'FemaleAdjective', world, false, '3-guessGender');
      } else if (found === 'm') {
        setTag([term], 'MaleAdjective', world, false, '3-guessGender');
      }
    }
  };

  let rules = [
    // present-tense
    ['o', ['FirstPerson', 'PresentTense']],
    ['as', ['SecondPerson', 'PresentTense']],
    ['a', ['ThirdPerson', 'PresentTense']],
    ['mos', ['FirstPersonPlural', 'PresentTense']],
    ['áis', ['SecondPersonPlural', 'PresentTense']],
    ['éis', ['SecondPersonPlural', 'PresentTense']],
    ['an', ['ThirdPersonPlural', 'PresentTense']],
    // past-tense
    ['é', ['FirstPerson', 'PastTense']],
    ['ste', ['SecondPerson', 'PastTense']],
    ['ó', ['ThirdPerson', 'PastTense']],
    ['mos', ['FirstPersonPlural', 'PastTense']],
    ['eis', ['SecondPersonPlural', 'PastTense']],
    ['on', ['ThirdPersonPlural', 'PastTense']],
    // imperfect - 'hablaba' is 1st or 3rd person, so no person tag
    ['aba', ['Imperfect']],
    ['abas', ['SecondPerson', 'Imperfect']],
    ['ábamos', ['FirstPersonPlural', 'Imperfect']],
    ['abais', ['SecondPersonPlural', 'Imperfect']],
    ['aban', ['ThirdPersonPlural', 'Imperfect']],
    ['ías', ['SecondPerson', 'Imperfect']],
    ['íamos', ['FirstPersonPlural', 'Imperfect']],
    ['íais', ['SecondPersonPlural', 'Imperfect']],
    ['ían', ['ThirdPersonPlural', 'Imperfect']],
    // future-tense
    ['ré', ['FirstPerson', 'FutureTense']],
    ['rás', ['SecondPerson', 'FutureTense']],
    ['rá', ['ThirdPerson', 'FutureTense']],
    ['remos', ['FirstPersonPlural', 'FutureTense']],
    ['réis', ['SecondPersonPlural', 'FutureTense']],
    ['rán', ['ThirdPersonPlural', 'FutureTense']],
    // conditional-tense
    ['ría', ['FirstPerson', 'Conditional']],
    ['rías', ['SecondPerson', 'Conditional']],
    // ['ría', ['ThirdPerson','Conditional']], //(same)
    ['ríamos', ['FirstPersonPlural', 'Conditional']],
    ['ríais', ['SecondPersonPlural', 'Conditional']],
    ['rían', ['ThirdPersonPlural', 'Conditional']],
  ];
  // sort by suffix length
  rules = rules.sort((a, b) => {
    if (a[0].length > b[0].length) {
      return -1
    } else if (a[0].length < b[0].length) {
      return 1
    }
    return 0
  });

  const forms = [
    'FirstPerson',
    'SecondPerson',
    'ThirdPerson',
    'FirstPersonPlural',
    'SecondPersonPlural',
    'ThirdPersonPlural',
    'PresentTense',
    'PastTense',
    'Imperfect',
    'FutureTense',
    'Conditional'
  ];

  //relajarse -> relajar
  const stripReflexive = function (str) {
    str = str.replace(/se$/, '');
    str = str.replace(/te$/, '');
    str = str.replace(/me$/, '');
    return str
  };

  // deduce gender of an adjective, but it's suffix
  const guessVerbForm = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('Verb')) {
      // skip non-finite forms and moods - 'comprado' ends in -o but is not first-person
      if (
        term.tags.has('Infinitive') ||
        term.tags.has('Auxiliary') ||
        term.tags.has('Negative') ||
        term.tags.has('Gerund') ||
        term.tags.has('Perfecto') ||
        term.tags.has('Participle') ||
        term.tags.has('Imperative') ||
        term.tags.has('Subjunctive') ||
        term.tags.has('Copula')
      ) {
        return
      }
      // do we already have both?
      if (forms.filter(tag => term.tags.has(tag)).length >= 2) {
        return
      }
      let str = term.machine || term.normal;

      //relajarse -> relajar
      str = stripReflexive(str);
      for (let k = 0; k < rules.length; k += 1) {
        const [suff, tag] = rules[k];
        if (str.endsWith(suff)) {
          setTag([term], tag, world, true, '3-guessForm');
          break
        }
      }
    }
  };

  // auxiliary forms we don't have conjugations of
  const isAux = new Set([
    //  imperfect subjunctive of 'poder'
    'pudiera',
    'pudieras',
    'pudiera',
    'pudiéramos',
    'pudierais',
    'pudieran',
    'pudiese',
    'pudieses',
    'pudiese',
    'pudiésemos',
    'pudieseis',
    'pudiesen',
    // Ser (to be)
    // First set (-ara/-ase endings):
    'fuera',
    'fueras',
    'fuera',
    'fuéramos',
    'fuerais',
    'fueran',
    // Second set (-iera/-iese endings):
    'fuese',
    'fueses',
    'fuese',
    'fuésemos',
    'fueseis',
    'fuesen',

    // Haber (to have, when used as an auxiliary)
    // First set (-ara/-ase endings):
    'hubiera',
    'hubieras',
    'hubiera',
    'hubiéramos',
    'hubierais',
    'hubieran',

    // Second set (-iera/-iese endings):
    'hubiese',
    'hubieses',
    'hubiese',
    'hubiésemos',
    'hubieseis',
    'hubiesen',

    // Estar (to be, in the context of state / condition)
    // First set (-ara/-ase endings):
    'estuviera',
    'estuvieras',
    'estuviera',
    'estuviéramos',
    'estuvierais',
    'estuvieran',
    // Second set (-iera/-iese endings):
    'estuviese',
    'estuvieses',
    'estuviese',
    'estuviésemos',
    'estuvieseis',
    'estuviesen',

    'estado',
    'estando',
    'estar',
    'ha',
    'habéis',
    'haber',
    'había',
    'habíais',
    'habíamos',
    'habían',
    'habías',
    'habrá',
    'habrán',
    'habrás',
    'habré',
    'habréis',
    'habremos',
    'habría',
    'habríais',
    'habríamos',
    'habrían',
    'habrías',
    'han',
    'has',
    'haya',
    'hayáis',
    'hayan',
    'hayas',
    'he',
    'hemos',
    'hube',
    'hubiera',
    'hubierais',
    'hubiéramos',
    'hubieran',
    'hubieras',
    'hubiere',
    'hubiereis',
    'hubiéremos',
    'hubieren',
    'hubieres',
    'hubieron',
    'hubiese',
    'hubieseis',
    'hubiesen',
    'hubieses',
    'hubimos',
    'hubiste',
    'hubisteis',
    'hubo',

    // Tener (to have, in the context of possession', 'obligation)
    // First set (-ara/-ase endings):
    'tuviera',
    'tuvieras',
    'tuviera',
    'tuviéramos',
    'tuvierais',
    'tuvieran',
    // Second set (-iera/-iese endings):
    'tuviese',
    'tuvieses',
    'tuviese',
    'tuviésemos',
    'tuvieseis',
    'tuviesen',

    // Hacer (to do, to make)
    // First set (-ara/-ase endings):
    'hiciera',
    'hiciese',
    'hicieras',
    'hicieses',
    'hiciera',
    'hiciese',
    'hiciéramos',
    'hiciésemos',
    'hicierais',
    'hicieseis',
    'hicieran',
    'hiciesen',

    // Venir (to come)
    // First set (-ara/-ase endings):
    'viniera',
    'vinieras',
    'viniera',
    'viniéramos',
    'vinierais',
    'vinieran',
    // Second set (-iera/-iese endings):
    'viniese',
    'vinieses',
    'viniese',
    'viniésemos',
    'vinieseis',
    'viniesen'
  ]);

  const tagAuxVerb = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    // only when an actual verb follows - 'fuera de la ciudad' is not an auxiliary
    if (isAux.has(term.normal) && term.tags.has('Verb') && terms[i + 1] && terms[i + 1].tags.has('Verb')) {
      setTag([term], 'Auxiliary', world, false, '3-auxiliary');
    }
  };

  // '¡Corre más rápido!' - a sentence-initial verb in an exclamation is a command.
  // tú/usted commands share their form with the present-tense, so they need this context to disambiguate
  const checkImperative = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (i !== 0 || !term.pre.includes('¡')) {
      return
    }
    if (
      term.tags.has('PresentTense') &&
      (term.tags.has('SecondPerson') || term.tags.has('ThirdPerson'))
    ) {
      setTag([term], 'Imperative', world, false, '3-exclamation-imperative');
    }
  };

  // 1st pass

  // these methods don't care about word-neighbours
  const firstPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      //  is it titlecased?
      const found = tagTitleCase(terms, i, world);
      // try look-like rules
      found || checkRegex(terms, i, world);
      // turn '1993' into a year
      tagYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      let found = isAcronym(terms, i, world);
      found = found || checkEnclitic(terms, i, world);
      found = found || suffixCheck(terms, i, world);
      // found = found || neighbours(terms, i, world)
      found || fallback(terms, i, world);
    }
  };

  const thirdPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      guessNounGender(terms, i, world);
      guessPlural(terms, i, world);
      guessAdjPlural(terms, i, world);
      guessAdjGender(terms, i, world);
      tagAuxVerb(terms, i, world);
      guessVerbForm(terms, i, world);
      checkImperative(terms, i, world);
    }
  };

  const tagger = function (view) {
    const world = view.world;
    view.docs.forEach((terms) => {
      firstPass(terms, world);
      secondPass(terms, world);
      thirdPass(terms, world);
    });
    return view
  };

  var regexNormal = [
    //web tags
    [/^[\w.]+@[\w.]+\.[a-z]{2,3}$/, 'Email'],
    [/^(https?:\/\/|www\.)+\w+\.[a-z]{2,3}/, 'Url', 'http..'],
    [/^[a-z0-9./].+\.(com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)/, 'Url', '.com'],

    // timezones
    [/^[PMCE]ST$/, 'Timezone', 'EST'],

    //names
    [/^ma?c'.*/, 'LastName', "mc'neil"],
    [/^o'[drlkn].*/, 'LastName', "o'connor"],
    [/^ma?cd[aeiou]/, 'LastName', 'mcdonald'],

    //slang things
    [/^(lol)+[sz]$/, 'Expression', 'lol'],
    [/^wo{2,}a*h?$/, 'Expression', 'wooah'],
    [/^(hee?){2,}h?$/, 'Expression', 'hehe'],
    [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, 'Verb', 'un-vite'],

    // m/h
    [/^(m|k|cm|km)\/(s|h|hr)$/, 'Unit', '5 k/m'],
    // μg/g
    [/^(ug|ng|mg)\/(l|m3|ft3)$/, 'Unit', 'ug/L'],
  ];

  var regexNumbers = [

    [/^@1?[0-9](am|pm)$/i, 'Time', '3pm'],
    [/^@1?[0-9]:[0-9]{2}(am|pm)?$/i, 'Time', '3:30pm'],
    [/^'[0-9]{2}$/, 'Year'],
    // times
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, 'Time', '3:12:31'],
    [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/i, 'Time', '1:12pm'],
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/i, 'Time', '1:12:31pm'], //can remove?

    // iso-dates
    [/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/i, 'Date', 'iso-date'],
    [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, 'Date', 'iso-dash'],
    [/^[0-9]{1,4}\/[0-9]{1,2}\/[0-9]{1,4}$/, 'Date', 'iso-slash'],
    [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, 'Date', 'iso-dot'],
    [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, 'Date', '12-dec-2019'],

    // timezones
    [/^utc ?[+-]?[0-9]+$/, 'Timezone', 'utc-9'],
    [/^(gmt|utc)[+-][0-9]{1,2}$/i, 'Timezone', 'gmt-3'],

    //phone numbers
    [/^[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '421-0029'],
    [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '1-800-'],


    //money
    //like $5.30
    [
      /^[-+]?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6][-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?([kmb]|bn)?\+?$/,
      ['Money', 'Value'],
      '$5.30',
    ],
    //like 5.30$
    [
      /^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]\+?$/,
      ['Money', 'Value'],
      '5.30£',
    ],
    //like
    [/^[-+]?[$£]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ['Money', 'Value'], '$400usd'],

    //numbers
    // 50 | -50 | 3.23  | 5,999.0  | 10+
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ['Cardinal', 'NumericValue'], '5,999'],
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th|°)$/, ['Ordinal', 'NumericValue'], '53rd'],
    // .73th
    [/^\.[0-9]+\+?$/, ['Cardinal', 'NumericValue'], '.73th'],
    //percent
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ['Percent', 'Cardinal', 'NumericValue'], '-4%'],
    [/^\.[0-9]+%$/, ['Percent', 'Cardinal', 'NumericValue'], '.3%'],
    //fraction
    [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ['Fraction', 'NumericValue'], '2/3rds'],
    //range
    [/^[0-9.]{1,3}[a-z]{0,2}[-–—][0-9]{1,3}[a-z]{0,2}$/, ['Value', 'NumberRange'], '3-4'],
    //time-range
    [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-–—] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ['Time', 'NumberRange'], '3-4pm'],
    //with unit
    [/^[0-9.]+([a-z]{1,4})$/, 'Value', '9km'],
  ];

  var regexText = [
    // #coolguy
    [/^#[a-z0-9_\u00C0-\u00FF]{2,}$/i, 'HashTag'],

    // @spencermountain
    [/^@\w{2,}$/, 'AtMention'],

    // period-ones acronyms - f.b.i.
    [/^([A-ZÄÖÜ]\.){2}[A-ZÄÖÜ]?/i, ['Acronym', 'Noun'], 'F.B.I'], //ascii-only

    // ending-apostrophes
    [/.{3}[lkmnp]in['‘’‛‵′`´]$/, 'Gerund', "chillin'"],
    [/.{4}s['‘’‛‵′`´]$/, 'Possessive', "flanders'"],
  ];

  const rb = 'Adverb';
  const nn = 'Noun';
  const vb = 'Verb';
  const jj = 'Adjective';
  const cond = 'Conditional';
  const fut = 'FutureTense';
  // const inf = 'Infinitive'
  const g = 'Gerund';
  const ref = 'Reflexive';
  const imp = 'Imperfect';
  const pl = ['Noun', 'Plural'];

  var suffixPatterns = [
    null,
    {
      // one-letter suffixes
      'ó': vb,
    },
    {
      // two-letter suffixes
      al: jj,
      ño: jj,
      // no: jj,
      // do: vb,
      // ar: vb,
      // an: vb, - too greedy - 'pan', 'plan', 'capitán'
      'ió': vb,
      // en: vb, - too greedy - 'examen', 'imagen', 'orden'
      ir: vb,
      er: vb,
      'tó': vb,
    },
    {
      // three-letter suffixes
      ico: jj,
      // ica: jj,
      ble: jj,
      nal: jj,
      ial: jj,
      oso: jj,
      iso: jj,
      ito: jj,
      ita: jj,
      izo: jj,
      cto: jj,
      ana: jj,
      eos: jj,
      // ado: vb,
      // ndo: first, - 'ando'/'endo' gerund rules cover this
      // ada: vb, - 'llegada', 'mirada' are nouns
      ron: vb,
      // ido: vb,
      aba: imp,
      tar: vb,
      gar: vb,
      nar: vb,
      'ían': imp,
      rar: vb,
      // ría: cond, - 'librería', 'categoría' - see aría/ería/iría below
      aré: fut,
      iré: fut,
      eré: fut,
      rás: fut,
      ará: fut,
      ado: vb,
      pto: jj,
      osa: jj,
      tos: pl,

      // ida: vb,
    },
    {
      // four-letter suffixes
      itas: jj,
      itos: jj,
      icos: jj,
      icas: jj,
      tico: jj,
      fica: jj,
      gica: jj,
      mica: jj,
      nica: jj,
      lica: jj,
      tica: jj,
      able: jj,
      tivo: jj,
      sivo: jj,
      esco: jj,
      iaco: jj,
      íaco: jj,
      áceo: jj,
      áneo: jj,
      icio: jj,
      culo: jj,
      aria: jj,
      bles: jj,
      tiva: jj,
      ante: jj,
      ente: jj,
      ánea: jj,
      siva: jj,
      ular: jj,
      osas: jj,
      ales: jj,
      iles: jj,
      anos: jj,
      osos: jj,
      'ción': nn,
      idad: nn,
      ento: nn,
      ncia: nn,
      'sión': nn,
      ando: g,
      endo: g,
      // ados: vb,
      aron: vb,
      adas: vb,
      // tado: first, - 'cantado' is a participle, not first-person
      // amos: cond, - '-amos' is present/preterite, never conditional
      // rías: cond, - 'librerías' - see arías/erías/irías below
      // rían: cond,
      abas: imp,
      aban: imp,
      'íais': imp,
      'aría': cond,
      // ería: cond, - 'librería', 'panadería' - too many -ería nouns
      'iría': cond,
      'dría': cond, // podría, tendría
      'bría': cond, // habría, sabría
      réis: fut,
      arán: fut,
      // refexive verbs
      arse: ref,
      arte: ref,
      arme: ref,
      irse: ref,
      irte: ref,
      erse: ref,
      dose: ref,
      ario: jj,
      orio: jj,
      iano: jj,
      dero: jj,
      fero: jj,
      jero: jj,
      lero: jj,
      nero: jj,
      tero: jj,
      ares: pl, // lugares, hogares
      ores: pl, // profesores, flores
      rios: jj,
      ivos: jj,
    },
    { // five-letter suffixes
      'ación': nn,
      mente: rb,
      ísimo: jj,
      icano: jj,
      ntino: jj,
      tivas: jj,
      andés: jj,
      adora: jj,
      antes: jj,
      iendo: g,
      yendo: g,
      ieron: vb,
      remos: fut,
      iente: jj,
      entes: jj,
      'íamos': imp,
      'arías': cond,
      // erías: cond, - 'librerías'
      'irías': cond,
      'drías': cond,
      'brías': cond,
      'arían': cond,
      'erían': cond,
      'irían': cond,
      'drían': cond,
      'brían': cond,
    },
    {
      // six-letter suffixes
      ística: jj,
      ciones: nn,
      'ábamos': imp,
      'ríamos': cond,
    },
    {
      // seven-letter suffixes
      aciones: nn
    }
  ];

  var model = {
    regexNormal,
    regexNumbers,
    regexText,
    suffixPatterns
  };

  const m$1 = 'm';
  const f$1 = 'f';

  // learned in ./learn/wikicorpus
  var suffixes = [
    {},
    {
      o: m$1,
      e: m$1, //this one is only 75% correct
      s: m$1,
      l: m$1,
      a: f$1
    },
    {
      os: m$1,
      to: m$1,
      io: m$1,
      or: m$1,
      do: m$1,
      ro: m$1,
      no: m$1,
      mo: m$1,
      lo: m$1,
      te: m$1,
      co: m$1,
      go: m$1,
      so: m$1,
      je: m$1,
      as: f$1,
      ia: f$1,
      ra: f$1,
      'ía': f$1,
      ta: f$1,
      da: f$1,
      na: f$1,
      la: f$1,
      ca: f$1,
      za: f$1,
      sa: f$1
    },
    {
      tos: m$1,
      dos: m$1,
      ios: m$1,
      ado: m$1,
      ros: m$1,
      nos: m$1,
      los: m$1,
      rio: m$1,
      les: m$1,
      ero: m$1,
      cos: m$1,
      ras: f$1,
      ias: f$1,
      tas: f$1,
      las: f$1,
      nas: f$1,
      ura: f$1,
      das: f$1,
      'ría': f$1,
      ada: f$1,
      era: f$1,
      'ías': f$1,
      ica: f$1,
      ina: f$1
    },
    {
      ento: m$1,
      ores: m$1,
      ador: m$1,
      ismo: m$1,
      ados: m$1,
      'ción': f$1,
      idad: f$1,
      'sión': f$1,
      tura: f$1
    },
    {
      entos: m$1,
      'ación': f$1,
      encia: f$1,
      lidad: f$1,
      'cción': f$1,
      dades: f$1,
      ncias: f$1,
      'ición': f$1
    },
    {
      miento: m$1,
      adores: m$1,
      ciones: f$1,
      'tación': f$1,
      'ración': f$1,
      'cación': f$1
    },
    {
      amiento: m$1,
      aciones: f$1,
      'ización': f$1
    }
  ];

  // some common exceptions to our rules (limited)
  const m = new Set([
    'nombre', 'año', 'tiempo', 'grupo', 'sistema',
    'and', 'sur', 'tipo', 'álbum', 'nivel',
    'origen', 'poder', 'cuerpo', 'hecho',
    'campo', 'papel', 'carácter',
    'tamaño', 'aire', 'problema', 'metal',
    'idioma', 'corazón', 'video', 'pie',
    'latín', 'obispo', 'single', 'príncipe',
    'catalán', 'deseo', 'alemán',
    'filósofo', 'huevo', 'tubo', 'géographique',
    'cráneo', 'reflejo', 'vértice', 'timbre',
    'día', 'mapa', 'planeta', 'sofá', 'clima',
    'tema', 'drama', 'programa', 'poema', 'tranvía',
  ]);

  const f = new Set([
    'ciudad', 'parte', 'forma', 'vez', 'serie',
    'the', 'región', 'muerte', 'agua',
    'capital', 'final', 'línea', 'área',
    'orden', 'edad', 'madre', 'mujer',
    'superficie', 'especie', 'luz', 'voz',
    'hija', 'lengua', 'imagen',
    'fecha', 'sede', 'sociedad', 'noche',
    'gente', 'calle', 'ley', 'clase',
    'mano', 'foto', 'moto', 'flor', 'radio',
    'sal', 'piel', 'miel', 'nube', 'sangre',
  ]);
  var exceptions$1 = { f, m };

  //sweep-through all suffixes
  const bySuffix = function (str) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 0; i -= 1) {
      const suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        const tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  const guessGender = function (str) {
    if (exceptions$1.f.has(str)) {
      return 'f'
    }
    if (exceptions$1.m.has(str)) {
      return 'm'
    }
    return bySuffix(str)
  };

  // roughly, split a document by comma or semicolon
  const splitOn = function (terms, i) {
    const isNum = /^[0-9]+$/;
    const term = terms[i];
    // early on, these may not be dates yet:
    if (!term) {
      return false
    }
    const maybeDate = new Set(['may', 'april', 'august', 'jan']);
    // veggies, like figs
    if (term.normal === 'like' || maybeDate.has(term.normal)) {
      return false
    }
    // toronto, canada  - tuesday, march
    if (term.tags.has('Place') || term.tags.has('Date')) {
      return false
    }
    if (terms[i - 1]) {
      const lastTerm = terms[i - 1];
      // thursday, june
      if (lastTerm.tags.has('Date') || maybeDate.has(lastTerm.normal)) {
        return false
      }
      // pretty, nice, and fun
      if (lastTerm.tags.has('Adjective') || term.tags.has('Adjective')) {
        return false
      }
    }
    // don't split numbers, yet
    const str = term.normal;
    if (str.length === 1 || str.length === 2 || str.length === 4) {
      if (isNum.test(str)) {
        return false
      }
    }
    return true
  };

  // kind-of a dirty sentence chunker
  const quickSplit = function (document) {
    const splitHere = /[,:;]/;
    const arr = [];
    document.forEach(terms => {
      let start = 0;
      terms.forEach((term, i) => {
        // does it have a comma/semicolon ?
        if (splitHere.test(term.post) && splitOn(terms, i + 1)) {
          arr.push(terms.slice(start, i + 1));
          start = i + 1;
        }
      });
      if (start < terms.length) {
        arr.push(terms.slice(start, terms.length));
      }
    });
    return arr
  };

  // singular words that end in -s
  const exceptions = new Set([
    'análisis',
    'jueves',
    'ciempiés',
    // weekdays
    'lunes',
    'martes',
    'miércoles',
    'viernes',
    // invariants + singulars in -s
    'crisis',
    'tesis',
    'dosis',
    'sintaxis',
    'énfasis',
    'paréntesis',
    'oasis',
    'virus',
    'campus',
    'dios',
    'adiós',
    'vals',
  ]);

  const looksPlural = function (str) {
    // not long enough to be plural - 'gas', 'mes', 'res', 'tos'
    if (!str || str.length <= 3) {
      return false
    }
    if (exceptions.has(str)) {
      return false
    }
    if (!str.endsWith('s')) {
      return false
    }
    // stressed final syllable - 'país', 'inglés', 'autobús', 'cortés'
    if (/[áéíóú]s$/.test(str)) {
      return false
    }
    // 'crisis'-type words
    if (str.endsWith('sis') || str.endsWith('xis')) {
      return false
    }
    return true
  };

  var methods = {
    two: {
      quickSplit,
      looksPlural,
      guessGender: guessGender,
    }
  };

  var preTagger = {
    compute: {
      preTagger: tagger
    },
    model: {
      two: model
    },
    methods,
    hooks: ['preTagger']
  };

  var matches = [
    // east berlin
    { match: '[este] #Place', group: 0, tag: 'Adjective', reason: 'este-place' },
    // hundred and two
    { match: '#Value [y] #Value', group: 0, tag: 'TextValue', reason: 'num-y-num' },
    // minus 8
    { match: '[menos] #Value', group: 0, tag: 'TextValue', reason: 'minus 4' },
    // 3 pintas de cerveza
    { match: '#Value [#PresentTense] de #Noun', group: 0, tag: 'Plural', reason: '3-pintas' },

    // adjective-noun
    { match: '#Determiner [#Adjective]$', group: 0, tag: 'Noun', reason: 'det-adj' },
    // la tarde
    { match: '#Determiner [#Adverb]$', group: 0, tag: 'Noun', reason: 'det-adv' },
    // el final de
    { match: '#Determiner [#Adjective] (de|del)', group: 0, tag: 'Noun', reason: 'det-adj' },

    // homographs - 'él vino a casa' (he came home)
    { match: '#Pronoun [vino] (a|de|en|con)', group: 0, tag: ['Verb', 'PastTense', 'ThirdPerson'], reason: 'el-vino' },
    // 'la cura', 'el canto' - determiner + verb-form is a noun
    { match: '(el|la|un|una) [#PresentTense]$', group: 0, tag: 'Noun', reason: 'la-cura' },
    { match: '(el|la|un|una) [#PresentTense] #Preposition', group: 0, tag: 'Noun', reason: 'el-canto-de' },
    // 'las casas' - plural determiner + verb-form is a plural noun
    { match: '(los|las|unos|unas) [#PresentTense]$', group: 0, tag: 'Plural', reason: 'las-casas' },
    // 'gran parte de', 'forma parte de'
    { match: '(gran|mayor|buena|toda|esa|esta) [parte]', group: 0, tag: 'Noun', reason: 'gran-parte' },

    // no exageres
    { match: 'no [#Noun]', group: 0, tag: 'Verb', reason: 'no-noun' },

    // moods
    // 'espero que tengas' - a command-form after 'que' is subjunctive
    { match: 'que [#Imperative]', group: 0, tag: 'Subjunctive', reason: 'que-subjunctive' },
    // 'ojalá llueva mañana'
    { match: '(ojalá|quizás|quizá) [#Imperative]', group: 0, tag: 'Subjunctive', reason: 'ojalá-subjunctive' },
    // 'no hables tan alto' - a negative command borrows the subjunctive form
    { match: '^no [#Subjunctive]', group: 0, tag: 'Imperative', reason: 'negative-imperative' },

    // auxiliary verbs
    { match: '[#Modal] #Verb', group: 0, tag: 'Auxiliary', reason: 'modal-verb' },
    // alcanzar + infinitive (to manage to do)
    // comenzar + infinitive (to begin doing)
    // resultar + infinitive (to end up doing)
    {
      match: '[(alcanzar|comenzar|resultar)] #Infinitive',
      group: 0,
      tag: 'Auxiliary',
      reason: 'alcanzar-inf'
    },
    // haber de + infinitive (to have to do)
    // parar de + infinitive (to stop doing)
    { match: '[{haber/verb} de] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'haber-de-inf' },
    { match: '[{parar/verb} de] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'haber-de-inf' },
    // seguir + gerund (to keep on doing, to continue to do)
    { match: '[{seguir/verb}] #Gerund', group: 0, tag: 'Auxiliary', reason: 'seguir-gerund' },
    // be walking
    { match: '[{estar/verb}] #Gerund', group: 0, tag: 'Auxiliary', reason: 'estar-gerund' },
    // andar + present participle (to go about done)
    { match: '[{andar/verb}] #Verb', group: 0, tag: 'Auxiliary', reason: 'andar-verb' },
    // acabar (present tense) de + past participle (to have recently done)
    { match: '[{acabar/verb}] #Verb de', group: 0, tag: 'Auxiliary', reason: 'acabar-verb-de' },
    // echar a + infinitive (to begin doing)
    { match: '[{echar/verb}] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'echar-inf' },
    // quedar en + infinitive (to arrange to do )
    { match: '[{quedar/verb} en] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'quedar-en-inf' },
    // poder  "to be able to"
    { match: '[{poder/verb}] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'poder-inf' },
    // any missing estar
    { match: '[#Copula] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'copula-inf' },

    // possessives - 'my taste'
    { match: '(#Possessive && #Determiner) [#FirstPerson]', group: 0, tag: 'Noun', reason: 'mi-gusto' },
    //Los avances en
    { match: '(los|las) [#Verb] #Preposition', group: 0, tag: 'Plural', reason: 'los-advances' },
    //confundo los numbres
    { match: '#Verb (los|las) [#Verb]$', group: 0, tag: 'Plural', reason: 'los-numbres' },
    //de la cola
    { match: 'de (la|las) [#Verb]', group: 0, tag: 'Noun', reason: 'de-la-cola' },
    //of the #verb
    { match: 'del [#Verb]', group: 0, tag: 'Noun', reason: 'del-verb' }
  ];

  let net = null;

  // rules like 'la-cura' flip a verb into a noun, after the preTagger's
  // gender-pass already ran - so give those new nouns a gender here
  const nounGender = function (view) {
    const world = view.world;
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        guessNounGender(terms, i, world);
      }
    });
  };

  const postTagger$1 = function (view) {
    const { world } = view;
    const { methods } = world;
    // rebuild this only lazily
    net = net || methods.one.buildNet(matches, world);
    // perform these matches on a comma-seperated document
    const document = methods.two.quickSplit(view.document);
    const ptrs = document.map(terms => {
      const t = terms[0];
      return [t.index[0], t.index[1], t.index[1] + terms.length]
    });
    const m = view.update(ptrs);
    m.cache();
    m.sweep(net);
    view.uncache();
    nounGender(view);
    // view.cache()
    return view
  };

  var postTagger = {
    compute: {
      postTagger: postTagger$1
    },
    hooks: ['postTagger']
  };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns$1 = {
    Noun: {
      aliases: [null, 'Sustantivo'],
      not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
    },
    Singular: {
      is: 'Noun',
      not: ['Plural'],
    },
    ProperNoun: {
      aliases: [null, 'NombrePropio'],
      is: 'Noun',
    },
    Person: {
      aliases: [null, 'Persona'],
      is: 'Singular',
      also: ['ProperNoun'],
      not: ['Place', 'Organization', 'Date'],
    },
    FirstName: {
      aliases: [null, 'Nombre'],
      is: 'Person',
    },
    MaleName: {
      aliases: [null, 'NombreMasculino'],
      is: 'FirstName',
      not: ['FemaleName', 'LastName'],
    },
    FemaleName: {
      aliases: [null, 'NombreFemenino'],
      is: 'FirstName',
      not: ['MaleName', 'LastName'],
    },
    LastName: {
      aliases: [null, 'Apellido'],
      is: 'Person',
      not: ['FirstName'],
    },
    Honorific: {
      aliases: [null, 'Título'],
      is: 'Noun',
      not: ['FirstName', 'LastName', 'Value'],
    },
    Place: {
      aliases: [null, 'Lugar'],
      is: 'Singular',
      not: ['Person', 'Organization'],
    },
    Country: {
      aliases: [null, 'País'],
      is: 'Place',
      also: ['ProperNoun'],
      not: ['City'],
    },
    City: {
      aliases: [null, 'Ciudad'],
      is: 'Place',
      also: ['ProperNoun'],
      not: ['Country'],
    },
    Region: {
      aliases: [null, 'Región'],
      is: 'Place',
      also: ['ProperNoun'],
    },
    Address: {
      aliases: [null, 'Dirección'],
      // is: 'Place',
    },
    Organization: {
      aliases: [null, 'Organización'],
      is: 'ProperNoun',
      not: ['Person', 'Place'],
    },
    SportsTeam: {
      aliases: [null, 'Equipo'],
      is: 'Organization',
    },
    School: {
      aliases: [null, 'Escuela'],
      is: 'Organization',
    },
    Company: {
      aliases: [null, 'Empresa'],
      is: 'Organization',
    },
    Plural: {
      is: 'Noun',
      not: ['Singular'],
    },
    Uncountable: {
      aliases: [null, 'Incontable'],
      is: 'Noun',
    },
    Pronoun: {
      aliases: [null, 'Pronombre'],
      is: 'Noun',
      not: entity,
    },
    Actor: {
      is: 'Noun',
      not: entity,
    },
    Activity: {
      aliases: [null, 'Actividad'],
      is: 'Noun',
      not: ['Person', 'Place'],
    },
    Unit: {
      aliases: [null, 'Unidad'],
      is: 'Noun',
      not: entity,
    },
    Demonym: {
      aliases: [null, 'Gentilicio'],
      is: 'Noun',
      also: ['ProperNoun'],
      not: entity,
    },
    // a feature-tag - applies to determiners ('mi casa') and pronouns ('es mío')
    Possessive: {
      aliases: [null, 'Posesivo'],
    },

    FemaleNoun: {
      aliases: [null, 'SustantivoFemenino'],
      is: 'Noun',
      not: ['MaleNoun']
    },
    MaleNoun: {
      aliases: [null, 'SustantivoMasculino'],
      is: 'Noun',
      not: ['FemaleNoun']
    },

  };

  var verbs$1 = {
    Verb: {
      aliases: [null, 'Verbo'],
      not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
    },
    PresentTense: {
      aliases: [null, 'Presente'],
      is: 'Verb',
      not: ['PastTense'],
    },
    // non-finite - 'hablar' is not a present-tense form in spanish
    Infinitive: {
      aliases: [null, 'Infinitivo'],
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'FutureTense', 'Gerund'],
    },
    // non-finite - 'hablando'
    Gerund: {
      aliases: [null, 'Gerundio'],
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'FutureTense', 'Copula'],
    },
    PastTense: {
      aliases: [null, 'Pasado'],
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'FutureTense'],
    },
    // pretérito imperfecto - 'hablaba'
    Imperfect: {
      aliases: [null, 'Imperfecto'],
      is: 'PastTense',
      not: ['Conditional'],
    },
    FutureTense: {
      aliases: [null, 'Futuro'],
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'PastTense'],
    },
    Copula: {
      aliases: [null, 'Cópula'],
      is: 'Verb',
    },
    // a feature-tag - 'no', 'nunca' are not verbs
    Negative: {
      aliases: [null, 'Negación'],
    },
    Modal: {
      is: 'Verb',
      not: ['Infinitive'],
    },
    PerfectTense: {
      aliases: [null, 'PretéritoPerfecto'],
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      aliases: [null, 'Pluscuamperfecto'],
      is: 'Verb',
    },
    Participle: {
      aliases: [null, 'Participio'],
      is: 'PastTense',
    },
    PhrasalVerb: {
      is: 'Verb',
    },
    Particle: {
      is: 'PhrasalVerb',
      not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
    },
    Auxiliary: {
      aliases: [null, 'Auxiliar'],
      is: 'Verb',
      not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
    },
    Conditional: {
      aliases: [null, 'Condicional'],
      is: 'Verb',
      not: ['Infinitive', 'Imperative'],
    },
    Reflexive: {
      aliases: [null, 'Reflexivo'],
      is: 'Verb',
    },
    // sometimes 'pretérito'
    Perfecto: {
      is: 'Verb',
    },
    // moods
    Imperative: {
      aliases: [null, 'Imperativo'],
      is: 'Verb',
      not: ['Subjunctive']
    },
    Subjunctive: {
      aliases: [null, 'Subjuntivo'],
      is: 'Verb',
      not: ['Imperative']
    },


    // 
    FirstPerson: {
      aliases: [null, 'PrimeraPersona'],
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPerson: {
      aliases: [null, 'SegundaPersona'],
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPerson: {
      aliases: [null, 'TerceraPersona'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    FirstPersonPlural: {
      aliases: [null, 'PrimeraPersonaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPersonPlural: {
      aliases: [null, 'SegundaPersonaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPersonPlural: {
      aliases: [null, 'TerceraPersonaPlural'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
    },
  };

  var values = {
    Value: {
      aliases: [null, 'Número'],
      not: ['Verb', 'Adjective', 'Adverb'],
    },
    Ordinal: {
      is: 'Value',
      not: ['Cardinal'],
    },
    Cardinal: {
      is: 'Value',
      not: ['Ordinal'],
    },
    Fraction: {
      aliases: [null, 'Fracción'],
      is: 'Value',
      not: ['Noun'],
    },
    Multiple: {
      aliases: [null, 'Múltiplo'],
      is: 'Value',
    },
    RomanNumeral: {
      aliases: [null, 'NúmeroRomano'],
      is: 'Cardinal',
      not: ['TextValue'],
    },
    TextValue: {
      aliases: [null, 'Numeral'],
      is: 'Value',
      not: ['NumericValue'],
    },
    NumericValue: {
      aliases: [null, 'Numérico'],
      is: 'Value',
      not: ['TextValue'],
    },
    Money: {
      aliases: [null, 'Dinero'],
      is: 'Cardinal',
    },
    Percent: {
      aliases: [null, 'Porcentaje'],
      is: 'Value',
    },
  };

  var dates = {
    Date: {
      aliases: [null, 'Fecha'],
      not: ['Verb', 'Adverb', 'Adjective'],
    },
    Month: {
      aliases: [null, 'Mes'],
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      aliases: [null, 'DíaDeLaSemana'],
      is: 'Noun',
      also: ['Date'],
    },
    Year: {
      aliases: [null, 'Año'],
      is: 'Date',
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      aliases: [null, 'Trimestre'],
      is: 'Date',
      not: 'Fraction',
    },
    // 'easter'
    Holiday: {
      aliases: [null, 'Festivo'],
      is: 'Date',
      also: ['Noun'],
    },
    // 'summer'
    Season: {
      aliases: [null, 'Estación'],
      is: 'Date',
    },
    Timezone: {
      aliases: [null, 'ZonaHoraria'],
      is: 'Noun',
      also: ['Date'],
      not: ['ProperNoun'],
    },
    Time: {
      aliases: [null, 'Hora'],
      is: 'Date',
      not: ['AtMention'],
    },
    // 'months'
    Duration: {
      aliases: [null, 'Duración'],
      is: 'Noun',
      also: ['Date'],
    },
  };

  const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];

  var misc = {
    Adjective: {
      aliases: [null, 'Adjetivo'],
      not: ['Noun', 'Verb', 'Adverb', 'Value'],
    },
    FemaleAdjective: {
      aliases: [null, 'AdjetivoFemenino'],
      is: 'Adjective',
      not: ['MaleAdjective'],
    },
    MaleAdjective: {
      aliases: [null, 'AdjetivoMasculino'],
      is: 'Adjective',
      not: ['FemaleAdjective'],
    },
    PluralAdjective: {
      aliases: [null, 'AdjetivoPlural'],
      is: 'Adjective',
      not: ['SingularAdjective'],
    },
    SingularAdjective: {
      aliases: [null, 'AdjetivoSingular'],
      is: 'Adjective',
      not: ['PluralAdjective'],
    },
    Comparable: {
      is: 'Adjective',
    },
    Comparative: {
      aliases: [null, 'Comparativo'],
      is: 'Adjective',
    },
    Superlative: {
      aliases: [null, 'Superlativo'],
      is: 'Adjective',
      not: ['Comparative'],
    },
    NumberRange: {
      aliases: [null, 'RangoNumérico'],
    },
    Adverb: {
      aliases: [null, 'Adverbio'],
      not: ['Noun', 'Verb', 'Adjective', 'Value'],
    },

    Determiner: {
      aliases: [null, 'Determinante', 'Artículo'],
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
    },
    Conjunction: {
      aliases: [null, 'Conjunción'],
      not: anything,
    },
    Preposition: {
      aliases: [null, 'Preposición'],
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      aliases: [null, 'Interrogativo'],
      not: ['Determiner'],
    },
    Currency: {
      aliases: [null, 'Moneda'],
      is: 'Noun',
    },
    Expression: {
      aliases: [null, 'Interjección'],
      not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
    },
    Abbreviation: {
      aliases: [null, 'Abreviatura'],
    },
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      aliases: [null, 'Teléfono'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {},
    AtMention: {
      aliases: [null, 'Mención'],
      is: 'Noun',
      not: ['HashTag', 'Email'],
    },
    Emoji: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Emoticon: {
      aliases: [null, 'Emoticono'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Email: {
      aliases: [null, 'Correo'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Acronym: {
      aliases: [null, 'Acrónimo'],
      not: ['Plural', 'RomanNumeral'],
    },
    Condition: {
      aliases: [null, 'Condición'],
      not: ['Verb', 'Adjective', 'Noun', 'Value'],
    },
  };

  const tags = Object.assign({}, nouns$1, verbs$1, values, dates, misc);

  var tagset = {
    tags
  };

  const findNumbers = function (view) {
    let m = view.match('#Value+');
    //5-8
    m = m.splitAfter('#NumberRange');
    // june 5th 1999
    m = m.splitBefore('#Year');
    // 1993/44 y 1994/44
    m = m.splitAfter('#Fraction');
    // not 'y una'
    m = m.not('^y');
    return m
  };

  var data = {
    ones: [
      [1, 'uno', 'primero'],
      [2, 'dos', 'segundo'],
      [3, 'tres', 'tercero'],
      [4, 'cuatro', 'cuarto'],
      [5, 'cinco', 'quinto'],
      [6, 'seis', 'sexto'],
      [7, 'siete', 'sétimo'],
      [8, 'ocho', 'octavo'],
      [9, 'nueve', 'noveno'],
      [10, 'diez', 'décimo'],
      [11, 'once', 'undécimo'],
      [12, 'doce', 'duodécimo'],
      [13, 'trece', 'decimotercero'],
      [14, 'catorce', 'decimocuarto'],
      [15, 'quince', 'decimoquinto'],
      [16, 'dieciséis', 'decimosexto'],
      [17, 'diecisiete', 'decimoséptimo'],
      [18, 'dieciocho', 'decimoctavo'],
      [19, 'diecinueve', 'decimonoveno'],
      [20, 'veinte', 'vigésimo'],//20th
      [21, 'veintiuno', 'vigésimo primero'],//21st
      [22, 'veintidós', 'vigésimo segundo'],//22nd
      [23, 'veintitrés', 'vigésimo tercero'],//23rd
      [24, 'veinticuatro', 'vigésimo cuarto'],//24th
      [25, 'veinticinco', 'vigésimo quinto'],
      [26, 'veintiséis', 'vigésimo sexto'],
      [27, 'veintisiete', 'vigésimo sétimo'],
      [28, 'veintiocho', 'vigésimo octavo'],
      [29, 'veintinueve', 'vigésimo noveno'],
    ],

    tens: [
      [30, 'treinta', 'trigésimo'],
      [40, 'cuarenta', 'cuadragésimo'],
      [50, 'cincuenta', 'quincuagésimo'],
      [60, 'sesenta', 'sexagésimo'],
      [70, 'setenta', 'septuagésimo'],
      [80, 'ochenta', 'octogésimo'],
      [90, 'noventa', 'nonagésimo'],
    ],

    hundreds: [
      [100, 'ciento', 'centésimo'],
      [200, 'doscientos', 'ducentésimo'],
      [300, 'trescientos', 'tricentésimo'],
      [400, 'cuatrocientos', 'cuadringentésimo'],
      [500, 'quinientos', 'quingentésimo'],
      [600, 'seiscientos', 'sexcentésimo'],
      [700, 'setecientos', 'septingentésimo'],
      [800, 'ochocientos', 'octingésimo'],
      [900, 'novecientos', 'noningentésimo'],
    ],
    multiples: [
      [1000, 'mil', 'milésimo'],
      [1000000, 'millón', 'millonésima'],
      [1000000000, 'billones', 'milmillonésima'],
    ]
  };

  const toCardinal = {};
  const toNumber = {};

  Object.keys(data).forEach(k => {
    data[k].forEach(a => {
      const [num, card, ord] = a;
      toCardinal[ord] = card;
      toNumber[card] = num;
    });
  });
  // add extras
  toNumber['cien'] = 100;
  toNumber['una'] = 1;
  // sétimo / séptimo
  toNumber['séptimo'] = 7;
  toCardinal['séptimo'] = 'siete';

  const isNumber = /^[0-9,$.+-]+$/;

  const multiples$1 = {
    // ciento: 100,
    mil: 1000,
    millones: 1000000,
    millón: 1000000,
    billones: 1000000000,
  };

  const fromText = function (terms) {
    let sum = 0;
    let carry = 0;
    let minus = false;
    for (let i = 0; i < terms.length; i += 1) {
      const { tags, normal } = terms[i];
      let w = normal || '';
      // ... y-ocho
      if (w === 'y') {
        continue
      }
      // minus eight
      if (w === 'menos') {
        minus = true;
        continue
      }
      // 'huitieme'
      if (tags.has('Ordinal')) {
        w = toCardinal[w];
      }
      // 'cent'
      if (multiples$1.hasOwnProperty(w)) {
        const mult = multiples$1[w] || 1;
        if (carry === 0) {
          carry = 1;
        }
        // console.log('carry', carry, 'mult', mult, 'sum', sum)
        sum += mult * carry;
        carry = 0;
        continue
      }
      // 'tres'
      if (toNumber.hasOwnProperty(w)) {
        carry += toNumber[w];
      } else if (isNumber.test(w)) {
        w = w.replace(/[,$+-]/g, '');
        const num = Number(w) || 0;
        carry += num;
      } else ;
    }
    // include any remaining
    if (carry !== 0) {
      sum += carry;
    }
    if (minus === true) {
      sum *= -1;
    }
    return sum
  };

  const fromNumber = function (m) {
    let str = m.text('normal').toLowerCase();
    str = str.replace(/(e|er)$/, '');
    let hasComma = false;
    if (/,/.test(str)) {
      hasComma = true;
      str = str.replace(/,/g, '');
    }
    // get prefix/suffix
    const arr = str.split(/([0-9.,]*)/);
    let [prefix, num] = arr;
    let suffix = arr.slice(2).join('');
    if (num !== '' && m.length < 2) {
      num = Number(num || str);
      //ensure that num is an actual number
      if (typeof num !== 'number') {
        num = null;
      }
      // strip an ordinal off the suffix
      if (suffix === 'e' || suffix === 'er') {
        suffix = '';
      }
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
    }
  };

  const parseNumber = function (m) {
    const terms = m.docs[0];
    let num = null; //eslint-disable-line no-useless-assignment
    let prefix = '';
    let suffix = '';
    let hasComma = false;
    const isText = m.has('#TextValue');
    if (isText) {
      num = fromText(terms);
    } else {
      const res = fromNumber(m);
      prefix = res.prefix;
      suffix = res.suffix;
      num = res.num;
      hasComma = res.hasComma;
    }
    return {
      hasComma,
      prefix,
      num,
      suffix,
      isText,
      isOrdinal: m.has('#Ordinal'),
      isFraction: m.has('#Fraction'),
      isMoney: m.has('#Money'),
    }
  };

  const ones = data.ones.reverse();
  const tens = data.tens.reverse();
  const hundreds = data.hundreds.reverse();

  const multiples = [
    [1000000000, 'billones', 'billones'],
    [1000000, 'millón', 'millones'],
    [1000, 'mil', 'mil'],
    // [100, 'cent'],
    [1, 'one', 'one'],
  ];

  //turn number into an array of magnitudes, like [[5, million], [2, hundred]]
  const getMagnitudes = function (num) {
    let working = num;
    const have = [];
    multiples.forEach(a => {
      if (num >= a[0]) {
        const howmany = Math.floor(working / a[0]);
        working -= howmany * a[0];
        if (howmany) {
          let str = a[1];
          if (howmany > 1) {
            str = a[2];//use plural version
          }
          have.push({
            unit: str,
            num: howmany,
          });
        }
      }
    });
    return have
  };

  const twoDigit = function (num) {
    const words = [];
    let addAnd = false;
    // 100-900
    for (let i = 0; i < hundreds.length; i += 1) {
      if (hundreds[i][0] <= num) {
        words.push(hundreds[i][1]);
        num -= hundreds[i][0];
        break
      }
    }
    // 30-90
    for (let i = 0; i < tens.length; i += 1) {
      if (tens[i][0] <= num) {
        words.push(tens[i][1]);
        num -= tens[i][0];
        addAnd = true;
        break
      }
    }
    if (num === 0) {
      return words
    }
    // 0-29
    for (let i = 0; i < ones.length; i += 1) {
      if (ones[i][0] <= num) {
        // 'y dos'
        if (words.length > 0 && addAnd) {
          words.push('y');
        }
        words.push(ones[i][1]);
        // num -= ones[i][0]
        break
      }
    }
    return words
  };

  const toText = function (num) {
    if (num === 0) {
      return ['cero']
    }
    if (num === 100) {
      return ['cien']
    }
    let words = [];
    if (num < 0) {
      words.push('moins');
      num = Math.abs(num);
    }
    // handle multiples
    const found = getMagnitudes(num);
    found.forEach(obj => {
      const res = twoDigit(obj.num);
      words = words.concat(res);
      if (obj.unit !== 'one') {
        words.push(obj.unit);
      }
    });
    // 'uno mil' -> 'mil'
    if (words.length > 1 && words[0] === 'uno') {
      words = words.slice(1);
    }
    // 'ciento mil' -> 'cien mil'
    if (words.length === 2 && words[0] === 'ciento') {
      if (words[1] === 'mil' || words[1] === 'millones') {
        words[0] = 'cien';
      }
    }
    return words
  };

  const toOrdinal = {};

  Object.keys(data).forEach(k => {
    data[k].forEach(a => {
      const [num, card, ord] = a;
      toOrdinal[card] = ord;
    });
  });
  // add extras
  toOrdinal.cien = 'centésimo';

  const formatNumber = function (parsed, fmt) {
    if (fmt === 'TextOrdinal') {
      let words = toText(parsed.num);
      words = words.map(w => {
        if (toOrdinal.hasOwnProperty) {
          return toOrdinal[w]
        }
        return w
      });
      return words.join(' ')
    }
    if (fmt === 'TextCardinal') {
      return toText(parsed.num).join(' ')
    }
    // numeric formats
    if (fmt === 'Ordinal') {
      return String(parsed.num) + '°'
    }
    if (fmt === 'Cardinal') {
      return String(parsed.num)
    }
    return String(parsed.num || '')
  };

  // return the nth elem of a doc
  const getNth$3 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const api$3 = function (View) {
    /**   */
    class Numbers extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Numbers';
      }
      parse(n) {
        return getNth$3(this, n).map(parseNumber)
      }
      get(n) {
        return getNth$3(this, n).map(parseNumber).map(o => o.num)
      }
      json(n) {
        const doc = getNth$3(this, n);
        return doc.map(p => {
          const json = p.toView().json(n)[0];
          const parsed = parseNumber(p);
          json.number = {
            prefix: parsed.prefix,
            num: parsed.num,
            suffix: parsed.suffix,
            hasComma: parsed.hasComma,
          };
          return json
        }, [])
      }
      /** any known measurement unit, for the number */
      units() {
        return this.growRight('#Unit').match('#Unit$')
      }
      /** return only ordinal numbers */
      isOrdinal() {
        return this.if('#Ordinal')
      }
      /** return only cardinal numbers*/
      isCardinal() {
        return this.if('#Cardinal')
      }

      /** convert to numeric form like '8' or '8th' */
      toNumber() {
        const m = this.if('#TextValue');
        const res = m.map(val => {
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('NumericValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert to numeric form like 'eight' or 'eighth' */
      toText() {
        const m = this;
        const res = m.map(val => {
          if (val.has('#TextValue')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('TextValue');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert ordinal to cardinal form, like 'eight', or '8' */
      toCardinal() {
        const m = this;
        const res = m.map(val => {
          if (!val.has('#Ordinal')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextCardinal' : 'Cardinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('Cardinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** convert cardinal to ordinal form, like 'eighth', or '8th' */
      toOrdinal() {
        const m = this;
        const res = m.map(val => {
          if (val.has('#Ordinal')) {
            return val
          }
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          const fmt = val.has('#TextValue') ? 'TextOrdinal' : 'Ordinal';
          const str = formatNumber(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            val.tag('Ordinal');
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }

      /** return only numbers that are == n */
      isEqual(n) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num === n
        })
      }
      /** return only numbers that are > n*/
      greaterThan(n) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num > n
        })
      }
      /** return only numbers that are < n*/
      lessThan(n) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num < n
        })
      }
      /** return only numbers > min and < max */
      between(min, max) {
        return this.filter((val) => {
          const num = parseNumber(val).num;
          return num > min && num < max
        })
      }
      /** set these number to n */
      set(n) {
        if (n === undefined) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parseNumber(n).num;
        }
        const m = this;
        const res = m.map((val) => {
          const obj = parseNumber(val);
          obj.num = n;
          if (obj.num === null) {
            return val
          }
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (val.has('#TextValue')) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          let str = formatNumber(obj, fmt);
          // add commas to number
          if (obj.hasComma && fmt === 'Cardinal') {
            str = Number(str).toLocaleString();
          }
          if (str) {
            val = val.not('#Currency');
            val.replaceWith(str, { tags: true });
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      add(n) {
        if (!n) {
          return this // don't bother
        }
        if (typeof n === 'string') {
          n = parseNumber(n).num;
        }
        const m = this;
        const res = m.map((val) => {
          const obj = parseNumber(val);
          if (obj.num === null) {
            return val
          }
          obj.num += n;
          let fmt = val.has('#Ordinal') ? 'Ordinal' : 'Cardinal';
          if (obj.isText) {
            fmt = val.has('#Ordinal') ? 'TextOrdinal' : 'TextCardinal';
          }
          const str = formatNumber(obj, fmt);
          if (str) {
            val.replaceWith(str, { tags: true });
            // handle plural/singular unit
            // agreeUnits(agree, val, obj)
          }
          return val
        });
        return new Numbers(res.document, res.pointer)
      }
      /** decrease each number by n*/
      subtract(n, agree) {
        return this.add(n * -1, agree)
      }
      /** increase each number by 1 */
      increment(agree) {
        return this.add(1, agree)
      }
      /** decrease each number by 1 */
      decrement(agree) {
        return this.add(-1, agree)
      }
      // overloaded - keep Numbers class
      update(pointer) {
        const m = new Numbers(this.document, pointer);
        m._cache = this._cache; // share this full thing
        return m
      }
    }
    // aliases
    Numbers.prototype.isBetween = Numbers.prototype.between;
    Numbers.prototype.minus = Numbers.prototype.subtract;
    Numbers.prototype.plus = Numbers.prototype.add;
    Numbers.prototype.equals = Numbers.prototype.isEqual;

    View.prototype.numbers = function (n) {
      let m = findNumbers(this);
      m = getNth$3(m, n);
      return new Numbers(this.document, m.pointer)
    };
    // alias
    View.prototype.values = View.prototype.numbers;
  };

  var numbers = {
    api: api$3
  };

  const getNth$2 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  const toPluralArt = {
    el: 'los',
    la: 'las',
    un: 'unos',
    una: 'unas',
    mi: 'mis',
    tu: 'tus',
    nuestro: 'nuestros',
    nuestra: 'nuestras',
    vuestro: 'vuestros',
    vuestra: 'vuestras',
  };
  const toSingularArt = {
    los: 'el',
    las: 'la',
    unos: 'un',
    unas: 'una',
    mis: 'mi',
    tus: 'tu',
    nuestros: 'nuestro',
    nuestras: 'nuestra',
    vuestros: 'vuestro',
    vuestras: 'vuestra',
  };

  // flip 'los' → 'el', etc
  const swapArticle = function (m, mapping) {
    const art = m.before(`(${Object.keys(mapping).join('|')})$`);
    if (art.found) {
      const w = art.text('normal');
      if (mapping.hasOwnProperty(w)) {
        art.replaceWith(mapping[w]);
      }
    }
  };


  const api$2 = function (View) {
    class Nouns extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Nouns';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.noun;
        return getNth$2(this, n).map(m => {
          const str = m.text();
          if (m.has('#PluralNoun')) {
            return {
              plural: str,
              singular: methods.toSingular(str)
            }
          }
          return {
            singular: str,
            plural: methods.toPlural(str)
          }
        }, [])
      }
      isPlural(n) {
        return getNth$2(this, n).if('#PluralNoun')
      }
      toPlural(n) {
        const methods = this.methods.two.transform.noun;
        getNth$2(this, n).ifNo('#Plural').forEach(m => {
          const str = m.text('normal');
          const plural = methods.toPlural(str);
          m.replaceWith(plural);
          // flip article, too
          swapArticle(m, toPluralArt);
        });
        return this
      }
      toSingular(n) {
        const methods = this.methods.two.transform.noun;
        getNth$2(this, n).if('#Plural').forEach(m => {
          const str = m.text('normal');
          const singular = methods.toSingular(str);
          m.replaceWith(singular);
          // flip article, too
          swapArticle(m, toSingularArt);
        });
        return this
      }
    }

    View.prototype.nouns = function (n) {
      let m = this.match('#Noun');
      m = getNth$2(m, n);
      return new Nouns(this.document, m.pointer)
    };
  };

  var nouns = {
    api: api$2,
  };

  const getNth$1 = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot$1 = function (m, methods) {
    const str = m.text('normal');
    const isPlural = m.has('#PluralAdjective');
    const isFemale = m.has('#FemaleAdjective');
    if (isPlural && isFemale) {
      return methods.fromFemalePlural(str)
    } else if (isFemale) {
      return methods.fromFemale(str)
    } else if (isPlural) {
      return methods.toSingular(str)
    }
    return str
  };

  const api$1 = function (View) {
    class Adjectives extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Adjectives';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.adjective;
        return getNth$1(this, n).map(m => {
          const str = getRoot$1(m, methods);
          return {
            male: str,
            female: methods.toFemale(str),
            plural: methods.toPlural(str),
            femalePlural: methods.toFemalePlural(str),
          }
        }, [])
      }
    }

    View.prototype.adjectives = function (n) {
      let m = this.match('#Adjective');
      m = getNth$1(m, n);
      return new Adjectives(this.document, m.pointer)
    };
  };

  var adjectives = {
    api: api$1,
  };

  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of adjective
  const getRoot = function (m) {
    m.compute('root');
    const str = m.text('root');
    return str
  };

  const api = function (View) {
    class Verbs extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Verbs';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.verb;
        const { toPresent, toPast, toFuture, toConditional, toGerund, toPerfecto, toImperative, toSubjunctive } = methods;
        return getNth(this, n).map(m => {
          const str = getRoot(m);
          return {
            presentTense: toPresent(str),
            pastTense: toPast(str),
            futureTense: toFuture(str),
            conditional: toConditional(str),
            gerund: toGerund(str),
            perfecto: toPerfecto(str),
            imperative: toImperative(str),
            subjunctive: toSubjunctive(str),
          }
        }, [])
      }
    }

    View.prototype.verbs = function (n) {
      let m = this.match('#Verb+');
      m = getNth(m, n);
      return new Verbs(this.document, m.pointer)
    };
  };

  var verbs = {
    api,
  };

  var version = '0.3.2';

  nlp.plugin(tokenizer);
  nlp.plugin(tagset);
  nlp.plugin(lexicon);
  nlp.plugin(preTagger);
  nlp.plugin(postTagger);
  nlp.plugin(nouns);
  nlp.plugin(adjectives);
  nlp.plugin(verbs);
  nlp.plugin(numbers);


  const es = function (txt, lex) {
    return nlp(txt, lex)
  };

  // copy constructor methods over
  Object.keys(nlp).forEach(k => {
    if (nlp.hasOwnProperty(k)) {
      es[k] = nlp[k];
    }
  });

  // this one is hidden
  Object.defineProperty(es, '_world', {
    value: nlp._world,
    writable: true,
  });

  /** log the decision-making to console */
  es.verbose = function (set) {
    const env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  es.version = version;

  return es;

}));
