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
    "Conjunction": "true¦aunq5c4e2m1ni,o,p0q5sino,u,y;ero,orq4u2;as,ientras;!ntonc0;es;omo,uando;ue",
    "Determiner": "true¦a8c7e4lAmuchAning2otrDpocAsuEt1un0variB;!aDos;ant8odB;un0ún;a,o;l,s0;a8e,os,t0;a7e,os;ada,ualquier;lg3mb2quel0;!l0;a3os;as,os;un0ún;a0o0;!s",
    "Preposition": "true¦aGcBd8e5f3ha2junEmedi9p1s0tras;egún,in,ob6;aBor;cia,sta;rente 0uerB;a,de;n0xcepto;!cim8t0;re;e1ur0;ante;! acuerdo con,baj8lante Antr8sA;erc3on0;! respec1t0;ra;to a;a 5;! pesa3demás 4l1nte0;!s 3; lad0rededo1;o 1;r 0;de",
    "Pronoun": "true¦cuEdonde,eBleDm9n4quien,s3t2ustedFv1yo,é0;l,ste;oso5u3;e,i,uy9ú;e,uy8í;os1u0;estr6;!o0;tr0;as,os;e,í0;!a2o2;ll0sto;a0o0;!s;al0yo;!es",
    "Adverb": "true¦0:1N;1:1O;a12b10c0Pd0Me0Ef0Bg09h08i05jamás,l01mXnVoTpFquizáErBs7t2usu0ya,ún11;a3o2radicTíp10;davía,t0;m3n2rde;!to;bién,pL;egu0Ti3ola1u2óI;ce09fic00pues0R;empre,gnifica1Bm2quiera;p0Nultánea1;a0Pe2ápi0W;al1ci2la18spec18;e0Vén;!s;arDerf09o5r2u0Lúbl0N;e3incip0o2áct0M;b0Ffun0Qgre00p0X;cisa1v0W;co7pAr 3s2;ib0Dter0T;e3lo 2supuesto;menJt05;jemp2l contrario,ntonces;lo;! a p2;oco;ci0tic2;ular1;cas2fiSrigin0;ion0;atur0eces6o2ue0Q;rm0t00;a3en8u2ás;cho,y;l,yorit2;ar0E;e3i2oc0uego;geYt9;j2nW;os;gu0n2;cluso,depend2iFmediaT;ie01;abi0GistórUoy;en2radu0;er0;in0orm0recueXu2ácil1;er2ndament0;a,te1;conómOn 8s4ven0Ax2;acKclu2treR;si05;en4pec3tr2;echa1icH;i0ífJ;ci0;consecuencia,gran medida,línea;e3ir2;ecC;finiWla03masiado,ntro,spués;asi,erca,laBo4u2;an2;to;m6n2;cre6jun6s2tinI;ider2taE;ab2;le1;ple2ún1;ta1;ra1;astaRien,ás2;ica1; Qbajo,cMdHhFlDmplCn7p3quí,rriba,s2trLun,yer,ún;imismo,í;are4enas,roxi2;ma2;da1;nte1;oche,t2u0;e3ig2;ua1;r2s;ior1;ia1;go,l2ta1;á,í;o2í;ra;e4ministra2;ti2;va1;la6m2;ás;tu0;al1;me2;nte;bor2la vez;do",
    "Ordinal": "true¦cWdLmilJnoIoctHpGquinEs8t2unNvigésimo0;! 0;cuSpEs5teN;eMr0;esUi0;ceXgésimo0;! 0;p9s0;eg5;e1é0;ptUtU;g2pt1x0;agRceQto;iOu2;undo;cu0geNto;agN;rim9;aDingLogL;nHv9;lonésim0ésK;a,o;ecimo2osCu0écI;ceFo0;décG;c4nov3quinAs2te0;rc0;ero;ex7éptC;eno;ta1u0;ar4;vo;e5ua0;dr2r1tro0;mil4;to;ag2i0;nge0;nt0;és0;imo",
    "Cardinal": "true¦billoXcMdEmilCnAo8quin7s5tre4u3veint0;e,i0;c0dós,nuJoIsGtrés,u1;inco,uatS;no;ce,inOsJ;e0iD;isHsLte4;ce,iH;ch0nN;enJoE;ove0uA;ciDnH;!l0;oJón;ie1o0;ce,s8;ci0z;nu3o2s0;i0éis;ete;cho;eve;ator9e8i3ua0;r4tro0;!ci0;entos;en3nc0;o,u0;en0;ta;!to;ro;ce;nes",
    "Unit": "true¦bHceFeDfahrenheitIgBhertz,jouleIk8liGm6p4terEy2z1°0µs;c,f,n;b,e1;b,o0;ttA;e0ouceD;rcent,t8;eg7il0³,è9;eAlili8;elvin9ilo1m0;!/h,s;!b6gr1mètre,s;ig2r0;amme5;b,x0;ab2;lsius,ntimè0;tre1;yte0;!s",
    "Month": "true¦a6dic4en3febr3ju1ma0nov4octu5sept4;rzo,yo;l0n0;io;ero;iem0;bre;bril,gosto",
    "WeekDay": "true¦domingo,juev1lun1m0sábado,viern1;art0iércol0;es",
    "Copula": "true¦eAfu5s0érE;e2i1o0;is,mPn,y;do,endo;a0d,rJáis;!mMn,s;e1i0ér8;!mKsC;!r0;a0on;is,n,s;rHs0;!t0;a9emEoy,uv2á0éG;!b0is,n,s;amC;e,i0o;e3mAs2é0;r0sem9;am8em8;te5;r0se8;a7e7on;ba6do,m4r0;em3á2é1ía0;!is,m2n,s;!is;!n,s;os;a0es;!is,n,s",
    "Auxiliary": "true¦h0;a3e2ub0;e,i0o;eron,mAste8;!m9;!b2n,s,y0;a0á2;!m6n,s;er,r1é0ía2;is;em3á2é1ía0;!is,m2n,s;!is;!n,s;os",
    "Modal": "true¦deb9p5qu3s0;ab0ol3uel5é;e0é8;!mBn,s;er0ier2;em9é5;od2ued0;e0o;!n,s;em5r3é1;e1o,é0;is;!m2n,r0s;ía0;!is,m0n,s;os",
    "Infinitive": "true¦0:WU;1:WM;2:WR;3:VM;4:WQ;5:VP;6:WO;7:WT;8:VO;9:RO;A:P2;B:WA;C:W4;D:O7;E:V6;F:TM;G:RT;H:KB;aR5bQ8cM2dI5eE8fDHgD7hCUiAYjAUlAAm9An91o8Dp5Wqu5Tr2Xs0Zt07u00vKxiPAyK2zI;aIel0oPW;ng0rp0;aReOiKoIulnC;ar,lImitG0t0;ar,c0t9Hv2;aj0br0gKnJol0rFYsIvD;ar,it0lumW3uH;cVSg0;iF5or0;lMDnJrIst1t0;!if6t2;c2d2er0g0ir,tU1;cLgKlJpPErIscuUHz0;i0r2;er,id0orNM;ar,ue0;iIun0;ar,l0n0;b6iv0ltNnKr9sItOM;ar,uI;fru1rp0;g1iIt0;fIr;ic0orm3;im0rapaRV;a08e01i00oXrJuI;mb0tT0;aLeKiJoI;c0peTVç0;bJAcPVlh0pl6tGunf0;in0m2p0;baQduN2er,f6g0iPmOnJpace0sIt0v0z6Kç0;ceSDlRPm7Rpas0;c0quO7sI;ar,boHXcKfJit0m7PpI;ir0orND;er1oKM;eS8r5XuMY;ar,it0;ci7r;j0lh0r;c0lCm0nArJsI;er,s1;c2n0tG;ng1pAr0tUR;cNj2lefon8CmMnLrKstIñ1;ar,emuL8iI;f6moni0;!m9;d2er,s0t0;bl0er,pC;er,le0;garSAll0p0rd0tu0ñ2;a15e0Wi0Qo08uI;a06b00cZd0fXgWicidTTjVmTpOrNsItG;cLpJsuTLtIuTL;eU7iLS;eIir0;it0nd2;it0r4Q;g1preeRLt0;erLlJoMMriI;m1r;eR2iI;c0r;ar,visAL;ar,erg1iI;nTQr;ar,e1R;ar,er1;oc0rI;ag0ir;ed2umb1;contIUestR1ir,jug0liKHmeMorLrQsJtra1veI;nLSrt2;an0cr4ViItiL9;di0st1;d9n0;rg1t2;r,v3;ar,breVcTfSlOmNnMpLrKsIñ0;lIpeIWsNMten2;ay0;preQYr1te0;es0l0oIOr0;ar,d0h0reír;ar,et2;d0eKiJloz0t0uIve5;ci7ç0;c8dA;r,tr0;oc0r2;aIiHo69;r,v0;car2QlKYpKsJvI;ivDo0;al1sa1;as0or;gnAlMmKnItu0;al3crABtI;et3on3;b6QpIul0;at3lA;b0enB;cPdOguNlMm67nKpJqu5MrIñTR;!r0v1;ar0uG6;sibM5tI;arTAir;ar,ecLSl0;ir,r0;i0uKU;ar,u5E;bPcOir,lLnKqNIr0tiIud0;r3sfaI;c2z2;ar,ci7e0gr0tA;d0iJt0ud0vaI;guaFLr;e5r;ar,i0rAud1;er,oI;re0t67;a28eMiLoJuI;g1ir;b0ci0d64er,g0l0mp2nIsn0tSIub0;c0r7;diculALm0r,sc0vH;a1Wb1Tc1Ed1Ae17f11g0Vh0Ti0Rj0Ql0Nm0Jn0Ior0Hp08qu07sVtQuPvIz0ír,ñ1;alu0eLiKoI;c0g0lI;uK7v2;d0gFr0sT1tHvD;l0nJrIst1;!tD;d2t0;n1tLC;aLeEViKoJrI;a9RiNRoced2;c0m0rn0;f6rQP;li0rd0;aF6cSe50fPTgRiQmuLBoGApNsMtJuI;c8lt0m1rg1;aIiJCr7V;bIr,ur0;el4l4;aF1o0usc8;ald0eJir0land4onI;d2sabKZ;it0t0;d1st1;at0uaEN;at0iJG;erDis8;aOeNlMoLrIuHU;eJim1oI;duJKgrDEv0;eOVse5;n2rJXs0us0;anKWic0;lDns0rcut1t1;rIsPO;ar,t1;g40ie5;a9AdDeg0ov0unB;arKeJit1oI;dP3nt0v2;di0nd0t2;!c0;aJeIlPQ;mRIr;ci7j0nz0t0x0;e8uvenesc2;nItCvind6;ar,iBteINve5;aIus0;b2Ec2;aMeLiKlaNVozij0reJularI;!iz0;d1sP6;r,stPL;nCr;l0r,te0;az2er1inaMleLorKrIut0;eIigC;ar,sc0;mA3z0ç0;ct1j0t1xi7;nBr;mJnconEsIxam9;crF9tru9S;bo92plQJ;aIIeKiJoIuIK;bCVnL4;g1m1rig1;fin1scubr1;aUeThQEiSlRoKrJtAuI;ar,pCrr1s0;e0i0ut0;br0g2lh2mMnJpOSrI;d0r2t0;cLRh4oc2sI;idCtI;iHOru1;eIpens0;nd0ç0;am0ut0;b1cl0t0;ar,b2it0;b0er,lc0pitQ5rIud0;g0rK0;aJe5oI;b9c0l0t0;ix0j0s0;bNcMfiFNg1juPFlLnKpJsi08tEYvI;er,iv0;ar4reN8;im0ud0;iz0z0ç0;ci7eN5tMR;ast4il8r1;biKMcKng2pQJsItAz7;g0p0tI;ej0re0;h0ioI;c9naPR;aJeIit0;braPFdO9im0jOZm0r2sFY;lAntA;a1Pe18i15l12o0RrLuIôr;bl6dr1lJn1rIx0;g0if6;ar,s0vJG;a0Me06i03oI;b0cZduHEfXgrVhUib1jAZloIQmSnRpNrrJ8sMteLvIyeHC;ar,eJiIoc0;d8Br;er,r;g2l0st0;eBVpCseBV;ag0iBoJuI;gn0;n2rI;!ci7;oCFunB;et2oIuBJ;ci7v2;ib1;am0eI;d1s0;an0eIund3;r1sN6t3;eJlAQrIur0;e0i0;d2sN3;ncipi0vI;aIileAP;r,t3;cVdTench2fOLgSj0NmiJPnd2ocupNEpP9sKteM2vI;al4eI;n1r;cNeKiJsIt0um1;ent1i7uEJ;d1on0;nIrv0;ci0tI;ar,e0ir;iG9rI;ev2;ar,u5;ec1iI;c0z2;av2ed2iI;p8s0;ct6guIXt6z2;bl0dRlPnOrt0sJt78uI;p0s0;ar,e2iKpCYsJtI;ar,eMXul0;ibJu1;bIci7;il8;dCer,tu0;iIu1;ci0r;ar,er;aIeg0;c2nIsm0t6;ar,ch0eZif6t1K;c0lJnDGor0r0sI;ar,c0;h0l0ot0;c0dXg0iWlUnTrJsI;ar,c0qu4AtanIE;cQdPec2fOgu5jNmMpe9SsKtIvert2;enIu6J;c2ec2;eIiGLonHuIV;gu1vC;an4it1;ud6;ecFGil0or0ur0;er,oLWur0;eb2ib1o0D;al3dGeEhFs0te0;ar,eIlizc0;ar,j0;d0n0;al0ir;cAdPg0ir0li0rMsLtI;eJin0rI;oc9uM5;ar,nGN;ar,e0m0s0Vt0;aJec2ir,paHRtiI;cKWlh0r;ben3fra1DliL1r;ec2r48;bZcWdi0fUlTmSpQrMsKtJuIír;s0v1;im3oLR;cIte5;il0ur4;ar,denMQgKiJquI;esE;e5g9;an3;er0in0o9KrC6tI;ar,im3;it1;er,h0vidLE;eIr4uHK;nd2r4;a9PoJuI;lt0p0rr1;rr2;ed4j85l21rMsIte9Bvi0;cKUeKtI;aIru1;cul3r;rv0;ar,ig0;aOeLivK7oIutr1;mJrmHtI;ar,if6;br0e0;cesJgIutrHv0;ar,lig58oB;it0s8;cId0mFrr0sc2vG5;er,i1W;a07e00iXoLuI;d0ltJrItKJ;ch0mG;ar,ipl6;bF8dQer,j0lOnLrKsEtIZvI;erMDiI;l3me5;ar,d2ir,r2;itorE0oIt0;!pI;ol3;dIe9Lh0;ar,e0;eIif6ul0;l0rI;ar,n3;gr0j0l8m0nIr0stGt16;ar,iIor0;m3sE;diNjFlhFmFFnLrJsIt2x2zI;cl0;eIguKG;c2nd0;ci7d0ZosIt1;cab0pre97;ar,r,t0;chuc0dGgo0lQm0nNquiF1rMsJtIxim3;ar,eriHrHT;c5IsaJtiI;c0g0;cr0ge0;cL3ginHtJ3;cL2d0ej0iJoLLte80uI;se0;feKOoLJpL9;dG0gaKNh0tA4vers0;aYeTiOlLoKuI;brAcIt0;h0ir,r0;cHgr0uv0;am0eJoI;r0v2;g0n0v0;bKc3XdJg0mIqu82st0vr0x0;it0p41;ar,er0i0;erIr0;aKYt0;ci7er,gKilo0mL5r,s0vI;aIit0;ntJFr;al3iI;sl0tHU;dr0mJnIrg0stHTt1vJD;ch0z0ç0;b2eKG;aKeju0oJuI;g0lg0nt0r0stAzg0;g0rr0;l0nt0rd9;d1Bg1Alu19m0VnLrJsIz0ç0;e5ol0;!rI;aAMi9ZuS;a0Qc0Id0Ff0Ag09i08j5YmiBYnov0ov0qJXsZtMuHLvI;aKeJit0oI;c0lucr0;j0nt0rtDstiL9;d1l7D;eIimBProduC8;gr0nSrI;aQcOesIFfK1lNn0pMrJvI;en1ir;oJuI;mp1;g0mp2;on2r5M;ig0;ambi0eI;d2pt0;c5Zg1;sAt0;cr8IerPiOpNtIu72;aLiIru1;g0tuI;ciIir;onH;l0r,ur0;ecCLir0;nu0st1;ir,t0;b1cC9;er1rFB;eLilElJo99rIuBC;ing1;aIig1u6Q;m0r;ct0r1;ag0eJiIuBF;c2IviduH;fJ8mn3x0;apac8enOh0iNlMoKrJuI;b0lc0mpl1t1;eG6im9;ar,mod0rI;pFr2;in0u1;d1nCt0;di0tG3;l0ugG;ag9iUpI;aSed1lQoNrKuI;gn0lsIt0;ar,i7;esJim1ovI;is0;i7si7;n2rI;!tI;ar,un0;a5eFPic0oI;d1r0;ct0rt1;gr0t0;d1m9sE;nFuJE;eIolaE;ar,ntA;aPeNiLoKuI;ir,mInd1sBY;an3ilCZ;menC0nr0sped0;bWd7FpI;not3otec0;l0rIs8;d0ed0ir,v1;bJc2ll0rmIv2;on3;iIl0;l8tI;ar,u0;aQeOir0lorAoMrKuI;a55erre0iIst0;ar,n7E;aIeH1it0uñ1;b0du0m1Bn3v0;bIl1Ast0te0vIz0;ern0;l0mDneBPrIs8E;ar,enBir,m9;b0guCMnHSrantiCXst0te0;a04e02iYlToOrLuI;g1m0nIrIPsi7zGC;ci7dI;a86ir;acasG3eJiIot0usE;s0t0;ar,g0n0que5ír;cHf1Vlhe0me5rIt88;j0mKnJtIz0ç0;al4if6;ec2ic0;aGTul0;eLorJuI;c3Nir,tu0;eIir;c2sc2;rt0xi7;c0gGj0lKnIrm0scHx0;aIg1;l3nB;m0tr0;ch0d2lic8rIstC0;ir,me5r0tAJv2;br6cKlJmiliIntaF7rBYsc9tGvor4z2;ar3;ar,ec2h0ir,l0sAEt0;il8tGu4F;c3Cd3Afe38je36l32m2Mn1Equi1Ar18s08tiqu2Sv02xI;aZcYeXhWiVoTpMtIum0;eKiJorqu1raI;d8er,ir,p5Hñ0;n3Prp0;nd2rm9;a8TeMiFQlKo9FrJuI;ls0;esF8im1;ic0oI;d1r0t0;d1l1riI;enBme5;nCrI;c3t0;b1g1m1st1;ib1o5Uum0;c4WmplArc2Q;av0ed2it0lu1;ceIgClt0m9;rb0;aMiKoI;c0luI;ci7ir;dIt0;enB;cu0d1lu0pF;b0Gc0Af08gB7m07p01quYtIvazi0;aUeTiRoQrKuI;dIpr0;ar,i0;aLeKoJuI;ctGtG;pe0;ar,ch0it0l0m4n0;g0nI;gG9h0;c0rnBFur0;c0mIpG7r0;ar,ul0;nd2r9A;bJci7f0lInc0r;ar,l0;el4il3l4;eJiI;ar,v0;c2nt0;aMeKiJreI;it0m2;ar,on0rr0;cIlh0r0t0;if6ul0;lh0nGCrc1;ag0uEX;aqAFol0rI;eg0i0;aMlar4oKrJuI;ch0lp1r4t0;av3ev2ib1;g2lInd2rreGJv0;h2t0;l0p0v0;aEOoE7;gu2ig1raI;d6r;liFQpJvI;oc0;arI;!ar;amFc0Gd0Ff08g01juiBl00mYoj0qua05rXsVtNuMvJxI;aCVeE0ug0;eJiIo3J;ar,d0;j4lh4nDPrgo5R;mCnB;abOeNoLrIusiasm0;aJeI;g0n0te1TviEJ;r,v0ñ0;ar,rI;n0p4;nd2rr0;l0ul0;aIeñ0in0uB;i0mbl0y0;a3iVol0;aIeC1;rc0scFB;az0ouS;aMenLlob0oKrI;aIos0;n0v1Sx0;l1rd0;dr0;j0nIrA5sg0t0ñ0;ar,ch0;aNeLi0laKoJrIur4;aJe5i0;c0rc0;qu4;it0rI;m0r1N;d0t3;ereD2ire8oAYur4;aOeMh2oKriEAuI;br1rI;rEZt0;br1lh2mInEr2Nst0;eBFi0;nIrCVt0;ar,d2;bez0ix0j0mDWnt0rIuz0;ar,g0n0r81;agr4bQePiOpIul0;aLeKiCXle0reJuI;j0nh0rr0;eBBg0nd2st0;nh0or0z0;c8OquIr8Kt0;et0;gr0t1;nd0rgD;aLeIorra31ruCP;beJlI;ez0l4;d0r;lIr29;ar,sI;am0;abFeKim9oJuI;c0Pd1;gi0;gDv0;c1OrcIt0;er,it0;cItu0;tu0;iIuc0;f6t0;h0lo0EoI;ar,nom3;a3Be0MiNoKrJuI;ch0d0pl6r0v0D;en0og0;ar,bJcuA3er,l2mIn0rm1t0;ar,e0Hin0;l0r0;a0Eb0Dct0f0Ag09lu07m04nam3ri03sMt0vJzI;er,im0;erJid1orBuI;lg0;g1sAt1;cVeñ0fTguCGiSminu1o1ApPsMtIu87;inKorJrI;aDi8L;c2si7;gu1;eJiNoIu82;ci0lv2;c0m9;ar0eJoIut0;n2r;ns0rs0;mCQp0;arç0rI;az0ut0;ar,ern1ipl9oJrim9uI;lp0rs0t1;rd0;g1m1;enJiI;nu1t1;si7;cIir;id0;er1itaCG;am0erJicuIu43;lt0;enBir;uj0;gnoIl61;st6;ambC7b25c1Yd1Xf1Tg1Si1Rj0l1Om1Mn1Kp1Hr1FsNtKvI;aBLer,oI;lv2r0;al6IeIon0;ct0n2rIst0;!iFm9;a0Yb0Wc0KdoCBe06f04h03i01lZmVn78oUpOrespe8tKvI;al5ReIi0;l0nd0;ac0iKrI;aIoz0u1;nc0v0;l0n0tu1;a10eKiJlBQreI;ci0z0;r,st0;d1g0j0nd2rI;diIt0;ci0ç0;bed4cup0nr0v0;aKeJoI;nt0r7;mBVnt1;i0nt9Brc0scC1;iIoc0umBT;g0z0;gn0lud1mped1nIst1;stC4te2Z;ac2;az2il0rI;ut0;ar,ch0j0mQnKrt0sI;pCtI;ab4Fim0;cLh0mascBQrKtJvoI;lv2;eACrañ0;ol0;ade9HorI;aj0;bJpI;ac5ReBI;arJoIru9V;c0ls0;aç0c0;aReOifr0oKrJuI;br1id0lp0;ev2ib1;br1l0mpKnI;e2Qfi0g8Loc2sidCtI;ar,ra1;on2;nIr;d2trH;al3;ns0rIsc0;g0r4Jt0;aIloq5A;rat0;bPcOfi0grad9NlNma9PnMpKrJtIyun0;ar,iv0;m0ro42;ar4eIo5roveN;rt0;im0uBD;e5oj0;elCred8t79;aJoto0roI;ch0;f0r;iv0og0rI;am0etDib0oARub0;ar0e7Hil0oJrIur0;im1;r2Is8;egIom9unB;ar,r1;a78it1oI;cr5IlDnsEr0sE;at0eJiI;bCm8ne0;g0t0;t0x0;r6Iu9B;eKinJoIra52;rm0;h0ir;c0nd2;ic0u1P;ap8ep1LiNlMoJreI;sc2t0;dAl0mJrI;ar,r2;por;ar0in0;dir9Vfr0r;atDer,il8;nJr,tIñ0;ar,ilW;if6ç0;a32e2Wh2Li2Jl2FoWrRuI;antAbr1esPid0lOmpMrLsI;p1tI;ar,e0oI;di0;ar,s0t1v0;liIriI;me5r;m9p0t63;ti7;eLiJonomeEuI;cAz0;ar,ptIt6;og4K;ar,c2er,m0r,sc2;ag1Zbr1Yc1XdAexi1Wg2incid1l1Pm15nToRpi0rMsKt3Lxe0zIç0;er,iI;nh0;eIt2X;ch0r;ar,o0rJtI;ar,ej0;eJig1oI;bFer,mp2;g1la0Mr,spo61;pCrdI;en0in0;c0Nd0Le0Kf0Dg0Bh4ju0Al09m08oc2qui83sXtNvI;eJiIoc0;d0vD;nJrI;g1s0tD;c2ir;aQePinu0orOrI;aIi43ol0;-aLaLbaKdJer,ir,rIst0t0;i0re7U;ec1iz2;la3Hn2W;tac0;c2n0;mpl0n2r,st0;b1Ect0m9r,t0;aRePiOolNp4EtJuI;lt0m15;aKiJrI;ang2u1;tu1;r,t0;ar,id0;dCgn0st1;gu1nt1rI;t0v0;gr0;emFov2;lev0;g0r0;el0rI;at7Teg0;eMiLorKrJuI;nd1;atern3o5;m0t0;ar,gGn0rm0sc0;cIr1s5U;ci7;ct0;en0iz2uI;c1z1;eMiLlu1orKretJuI;rr1;ar,iz0;d0r2;enBli0;bDd2nErt0;a4IbZeVpKuI;nIt0;g0ic0;aQePil0lNoLrIut0;ar,eJim1oI;b0met2v0;e4Gnd2;n2rI;!t0;ac2eIic0;me5t0;ns0t1;g9rI;ar,ec2ti2O;mFnKrIt2ç0;!cI;ia6Y;t0z0;atDin0;er,ir;aNeLg0h2iKm0oI;c0n3rI;e0ir;d1g1;cIt0;ci7i7;bFps0r;st1;er,in0;ar,ir;ir,ul0;aIic0;m0rJsIusG;if6sA;e0if6;catr3fr0me5rc6Dt0vI;il3;aQePiMoJuI;mb0p0t0;c0raIv2;miIr;ng0;ar,coJsI;me0;te0;c0fi0g0ir0;m0ntIrl0sq0Qte0;age0;d2g0if0le6AnLpiKrIs47;c0r0tA;if6;ll0;ar,sGtI;ra5X;b2d01er,g0ir,lZmYnWpTrPsNtKuJvaIz0ç0;lg0r;s0tQ;alJegI;or3;og0;ar5ZtI;ig0r0;actKec2g0iJrI;eg0;mb0;er3;ac8itJtI;ar,ur0;al3ul0;al3c36je0s0tarI;!ol0;bi0in54ufl0;ar,c5Ce5iIl0m0ç0;br0f6;asEuc0;a03eZisbilhYlVoOrJuI;ce0rl0sc0z9;anqViJoI;nze0t0;g0lJnI;c0d0;h0l0;cNiMmbKrIt0;d0rI;ar,if0;arIe0;de0;ar,cM;ej0;aIef0oqJ;nqIsf3E;ue0;ot0;b2ij0liKnIrr0s0;dIefiB;ec1;sc0;b0guRiQj0lOnNrMsLtIut3ñ0;a3GeJiI;r,z0;ar,r;ar,e0t0;a3Cbe0r2;c0h0ir;anIbuB;ce0ç0;l0x0;nç0;b54c4Ad3Sf3Ig39ho37isl0j34l2Mm28n1Xp19qu4r0Os0AtVuPvKyJñI;ad1;ud0;aLeJiI;s4Yv0;ntGrI;gonz0i1Q;li0n2T;d8me5n0tJxI;ili0;ent6oI;gJmIr3;at3;raf0;aVeQiPorOrJuI;a3Zr0;aJiIop1N;bu1;c0er,ir,paJs0vI;es20;lh0r;do0me5;ng1r0v0ç0;nLrrJstI;ar,i18;ar,iIor3;ss0z0;d2u0;c0j0r;aUce0TeRfixi0iQoBpPsIuJ;aMeLiKoJuI;m1st0;ar,bi0ci0m3Q;m1Sna0Fst1;di0gGnt0;lt0r,ss9;in0;ir0;gn0m1Nst1;gGnt0sI;in0or0;ur0;lt0r;ar,biEc00d2ej0gYmWqu01rJtIvF;ic34;aReLiKoJuI;in0m0;j0mb0t0;esg0sc0;bMcLdo05f4gKmInd0st0;at0eI;ss0;aç0l0;ad0;at0e5;nJsI;ar,t1F;c0h0j0;aIon3;r,z16;uIü1;me5;ar,hI;iv0;a02e00iZlXoVrLuI;nIr0;h36taI;l0r;eOiNoI;b0fuLnt0vJxI;im0;ar,eI;ch0it0;nd0;mFsi7;ci0eJnd2sIt0;e5s0ur0;nd2;dr4i0nt0rt0sIy0;e5t0;aIic0;c0st0ud1z0;l0me5t0;l0rIt4;fei34t0;ciJg0lp0nh0rIziJ;ar,ec2t0;gu0;aliRcFd0ePgaOhNiMot0si0tJuI;l0nB;eIicJ;cIv2;ip0;m0qu04;el0;ri0;steIx0;si0;s0z0;aRePinFoKpIu0;liIut0;ar,f6;l4rI;daç0tI;ec2iI;gu0z0;or0;aç0dro5nI;az0iz0;ci0dKldi2Fme5n4rJsI;ar,s0;!r0;ur4;aXbeWcanVeSgRiPlan0mMoLquKterJu08vIz0;ej0or4;ar,n0;il0;c0j0ng0;acJoI;rz0ç0;en0;ar,en0gCme5nIs1Pvi0;e0h0;em0;gJij0jInt0rt0;ar16;ar,r0;z0ç0;rg0;b0rIsEvanc0;g0m0;e8oeJuI;d0st0;lh0;g0nd0rI;c0r0;aPiOor0rKuI;aIe5;nt0rd0;aJeIup0;d1g0;dInd0v0;ar,ec2;l3r,t0;rr0;aQePiLlKog0roJuI;ge5nd0;nt0ux0;ig1oj0u1;aKlIn0rm0x0;ar,iI;arse;nz0r;ct0it0r1t0;st0;aYeVhUiQjuPmiMoKqJuc1vI;ert1og0;uir1;ec2pt0rIt0ç0;ar,m4n0;nIr0t1;isE;tr0;d6nt0;aKci7vI;inI;ar,h0;nt0r;er1;cu0lIqu0r1;a5gI;az0;pt0;a06c05e01h0i7l00oQreNtKuI;d1mIs0ñ0;ul0;iv0uaI;l3r;iz0;ce5d8sce5;it0;nt0;g2lh2mPnNpl0rMsI;ar,tI;arJumI;br0;!se;d0t0;seIt4;j0lh0;et2od0paI;nh0ñ0;ar0;d2it0lCnJpt0rIss0;c0t0;ar,d2tu0;er0;ed2i7;b0lm0mp0rJsIt0;al0;iBreI;ar,t0;ci0;aVd6enToQrLsoJuI;rr1s0;lv2rI;b2v2;aKeJiI;g0r;vi0;nIz0ç0;d0g2;l1n0rI;d0r4t0;ir;ço0;ic0;f0ix0l0nKrc0st4t2;ec2;er;ar,d7;on0;ar",
    "Noun": "true¦0:3F;1:3O;2:31;3:2U;4:2T;5:2K;6:36;7:2R;8:2O;9:3N;A:3G;B:3I;a3Ab37c2Bd24e1Uf1Ng1Ih1Fi1Aj18l14m0Tn0Qo0Np0Aquiebra,r01sPtJuIvDweb3éC;t1Wxito;ari0eEiDoCuelo;c6lum1t0;no,rg1sP;cinCget2nta7;d39o;mbr2nión soviét1Qsu38;aGeErCáct1Pécn27;aCen,ibun6áf5;bajo,ta9;mCo0Rrmin6;pora1Tát1L;ll3maE;aLeIiGoEuC;eCspiB;ño;breviElicC;it0;gnifi0HrC;vi25;mDrpi24ñC;al2Wor;a7ifina8;ble,lCntand3;!ario,es;aJeFiDoCégim1ío;ble,n;tu6vC;al2Per;ino,pEsC;taur0uC;l2Fm1;oso,resent0úbl1H;dica8na;aMeJico1SlIoGrEuCórt5;eCl05nta4;nArto r5;imo,oCueba,áct1C;pósito,specto;rtaCtenci2;da,l;an,ur2;rCso;egrino,iód5sC;on2pec2E;go,n,ra4sCt1F;a2Ho;céano Dpon1DrCso,tan;b1Ld1ig1;atlánt5pacíf5;a4eDiC;nten9ño;ga26olít5umát5;aJeHiFo2CuC;eCj3n9;b8stC;ra;embBneraCra4to;!l1V;mbra7nest3rCt6zcla;ca9;druFgo,mífeBnDquinaria,rg1teria8yoCña7;ría;u2za7;aEev0iDleCás3íd3;ga4;bera8ngüíst02tor2;do,na;orna08uCúpit3;ego,ga4;d0Tmag1nC;cen1UfEglés,icia1Nst0teDvC;ernadeBi1A;gr2lectua8;anAormH;aCerma7imml3ospit6í1T;bCda,rry pott3;a7iU;a8eFobEraCu0;do,mC;átO;ern0ierno;meYn,r0E;aGestiv6iFoEuCábr02;eCner2;nArzas arm04;n9rma;li2na8;bric0cha4lCrmacéut5;la,ta;ditori2jercicio,mKnIrudiHsCxam1;clavo,pFtC;aDudi0étC;ica;dístSnA;aHos08;to;a7cabeza9sala4trC;aEega;baja4ir,plea9;aHesFiEoDécaC;daX;cument2n0;agnóst5buj0enAneBpu0Fsposi0Y;arrolCord1;lo;tos,ño;aTerShicQiudadano,lOoHrDuCánc3;er4l0Tra;iEát3ítDónC;icG;icaN;m1st6;mFnEordenCs05;adC;as;ceja8tribuyG;andDbustibCerci0;le;anAo;an,iC;enA;as,oC;!s;ea8;bOdáv3lza4mJnIpGrFsEtedrCud2;al,át5;ico;a,o;den6ga,m1nav2áct3;ita8;les;alTcill3;iDpa7;na;no;da;er;alleBle;aCienestar,ota;n9tmCño;an;bXdjeVguTlMmKnErsen2tenCyud0ño;ta9;al;a,iCtepasa9;m6versC;arC;io;alC;!es;anAiC;go;gui1iFmEtC;ar,ernaC;tiva;ir0uerzo;a9c0;anA;te;jeB;ro;tiC;vo;dom1oC;ga9;do;en",
    "Adjective": "true¦0:ME;1:ND;2:MZ;3:LH;4:N6;5:N8;6:MG;7:KR;8:K8;9:NA;A:LF;B:MU;C:MJ;D:M3;E:KQ;F:MY;G:KZ;H:FT;I:LD;aJMbIFcFLdE9eCIfBMgAZhAIi8Lj8Ckur1l7Om69n5Oo5Bp3Squ3Qr2Qs1Dt0Ju0EvVweb,xeUySzQáOíLóKúJ;ltimEnE2til;pAEs7;be3gn7nJ;fimo,tJ;eg3imo;ci1l2LrJs3Tto0ur7vi1;abe4i1;aJur1;moLBpoAUragoza0;ermo,uJ;caASgoslavo;nófobo,róD9;aTePiLáKíJ;tr7vi1;li1ndalo;ejFIguDkinFlGKolHrLsJtAu1vo4zcIM;iJuA;ble,go1;tuAulH;c0Mllu1nezoGGrKsperK4tJ;eKZus2;an4OdJsátil,t33;ader5e4;cPgOlNno,q46riMsJ;allo,cJto;oJón;!nN3;able,op91;lisoleI2ón;abBJo;u0ío;bFRltraKBmbrío,nLrKteLKzbeJ;co,ko;b7Oug48;iJíCP;forme,versA;a0Ae02he,iZoVrOuLárta3éKíJ;mi1pD1;cni8rmL8;cuHWnHTrJ;bJco,ístCY;io,ulH;aKemBYiJoH5un8;lobuLXste;cMdicLXnKsJvieC;e3lúLH;quilo,sJ;grK0lúLFm08vLO;io,t9;le72n2rLscKtJ;al,ona8;a0o;do,e3;bKer0ll,n2roJ;id7lD;eHBio;atrAba0mpPn77rJsal6utGóri8;cMmóBZrJ;eKiJáqu7;to8L;no,s8M;erJio;!a;orArK1;iwVng31rJuKNí0;as8dío,t7W;a0Le0Ci07oYuKíICóJúper;li1rBD;ave4bUcSdReQficiJ1je2mPpKrc3ZsJtil;odicho,titu2;erKreJ;mo,s9;!doKRfKiJAvJ;is9;iBElI;er6o;co,l2vo;anD;es9iJulH;n2o;alJcampeGdesarrolKWmaK7u6O;pi0t9N;bOcialNlKmJnor5r1viéHS;brío,e3;aJemne,it0Oo;!rJ;!ieF;!es,ista;erKrJ;ehuGIio;a0b6;amDgMlLmKnJr6;ce3ieJDóB6;i2HpBZ;vA2íc7;nificaHEuiDJ;cQdPguOmiMnLptentrDXrKvJxuBñe3;e3ilEA;b6e0io,ra0;cill5egalDsa2;cJdesnu1áKS;on0BáBZ;nda,ro;iHuGH;o4retoDCundariD1;b6crRgrCFjGlPmOnKrJ;do,race0;!gKjuani0o,tJ;afeJBiagJ9o;riHuJ;inolHín7;a45oa0;iJtGEvo;no,tGL;o,íleF;a0EeSiRoMuKápid5íJ;gi1;a0bJdo,ma0rBs5;io,ro;b9LcMd6jLmKn8q1IsaJt91;do,ri0;anEo;a,iblan8o4;ie3ke3ocó;c5oja0;a01cXdWfUgSlRmo2nPpLsponsD7tKvolucionJ;ar6;iBRrógGP;le2rJ;esKoJ;duFQ;alDMor;aJombrada;centHYno;aBOigiosEle0;ioJul39;!nB;iJOleJ;ct9jo,xivo;on1uFH;e54honcho,iLoleKtJípro8;ang2KilCUor;ct9to;enJNo;c6lJ;!eJ;nFs;dLlo,ncKquíd7ro,sJ;o,tFM;he3io;icA;eJie2ímEH;bequDchua,ri1;a0Pe0Ji0Hl0Eo03rNuLáAJéKíJóstumo,úblEF;ca3o;ndulo,tr7;d8Ser8lc3ntiagu1rJto;iEHo,p9EulH;acFOeViSoLáctHWóJ;diFsJximBI;pe3;bC7cedBPduEVfNgen9Qlijo,mLn2pKsperan1teEVvJ;eniBOin8Y;enCiEuls9;eJiscIot9;d6tIT;a0esIJuJ;nd5so;e2mJn1V;aEBerJigFU;!a4os;cKdecGKmatu3r6SsJvi5;enIUidenFLo,to,un2;olombi0urs9;bSdRlOpu08rMsJtoHH;iKtJ;eriGEre3;b9Ntiv5;ci0tJ;u2Rátil;a8iKvoriHíJ;c1SfaFgamo,tDN;c1Rn4N;eros5ri1;la1re;aKeJ;beyo,n5;no,ye3;cu1gm7nJ;na1o,t9;cu75dunA0lNnMor,queñErKsqJ;ue3;la1manFLpJsonales,teneciAUua0vHN;etIlejo;tá8Súl51;i43u1;cífi8ga0lRmpH1rKtJuH2;er0r6óGO;aMciAdLejo,iGTtiJ;cuJsa0;larHS;o,us8;gJlelo;uaJ;yo;aJesEYme3;cJti0;ieF;bRcPfiELmnC9pMrKsc5YtoD7vJ;i0oid7ípa3;al,deHNiJtodoxo;e5XginBun1;a8eraE5oKrFFuJ;es2lH;r39s89;ciJhava1ul2;de5Sta0;eClLre3sJtuCv6;cJole2;e0u3;icIonF;aYeTiSoMuJíECómada4;cleJevElo,meros63;aJó7D;do,rH4;b8BcNmbDZrKtJva2;ab8Ao;cKmaJoeste,ueF;lH0n1;orG4;ivo,tur0;pGtrogeH2;cMfas2gKoJrv6Pto,ut3;grana4SyorqFS;aDJrJ;a,o4uz8;esariEio;cGKpoliC9tMvKzJ;are0i;aJie3;l,r3;al,o,urB;a0He0Bi06oVuOáxNédi8íMóLúJ;ltiplJsi8;e4o;r8Cvil;nJse3;im5;do,er2la2nMsJtI;cKicJulmán;alGEóE5;ular;dKiJ;cipB;a0iA;deSlRnMrJzo;aKe0iJmGo,u0;b57s8;do,l;ocMtKóJ;gamo,to0;aJevidF8és;no,ñD;romo;davo,es2;rnEs2;lLsKxtJ;e8il9Co;mEógi0;anDitJ;ares;dMjDRnLrJtropolitE9xicE9zqEQ;id91oJ;!vAF;orFQtAu1;iJo;a,evAo;cXdWeE8gUlRnPrOsNtKuJyDL;riB4;eJuCW;mát3UrJ;iAno;cuEOiva;aga2ino4í2K;cheFdBMifiCZso,uJ;eELfacBS;aKig0lorquín,o,tJv2FéBC;r16és;!yo;nJro;o,éC0;eBNu3;ab3edBG;a02eYiRlQoNuKáct7íJúEL;m4Wqui1;sKteDCxemburJ;guD;iALo;buEUcJmbar1ngevo;alF1oJ;!mBK;a0e0orG;bNgMmLnKs2tJ;erari5ua0;do,eAgEQ;p6ítrofes;e3ue3;anDerJio,re4;al,ti0;cLgKja0n2oEWtJ;ra1ón;alEPo,í1S;he3t9;cLdrGnKrgEscivo,tJxo;erBin5o;ceolad6Hu1;io,rimóDD;aOeNoLuJóvenes;dJguetGnto4s2venil;i4Lí72;rJven;da0;mer,ró4S;cobKponJ;esa,és;eo,i0;be3d1EguBl17mp11nNrLsKtaliJzquierd5;an6U;abeDEomorfo,raelí,óC9;aJredH;c36n6;a0Uc0Qd0Ge0Ef0Ag08h07i06just05m01na2oZquie2sVtLus15vJútil;as9erJá5K;so6Z;eKrJ;auteD4uCé3Rí3A;lec3XnPrJ;!ceNesE8iMmed6nKuJvent9;rba0;aJo4;!cDPs;no,or;pt9;cDBs5;atKeJospe5F;ct8Ggu3nsa2r2;isfJuAM;echo;cIdo3porJ;tu0;aLeKunJ;do,osuprBK;dia2nCrC;cuDBdu3;ifiCDo;ciAnterrum37;abiCVu93;enIlesJra2;a,es;aLeKraJun52;rrojo;liz,riB9;me,ntil;quí3Ksper0AxpJ;er2loA4;eQiLoJustriBígena4;e7Jlo3nJ;es6;ferenc71g0o,sJviduB;cKtJ;in2;rJuA6;e2iCX;bi1fJpe5Ss4LterCW;enCi8Q;i4IoJruHul2ómo1;lo3mpKnJrpAA;cluCexo,troCN;le2ren2Q;cabUdJlte9Pni43prop6Q;ecuTv22;ar,eNoMrKuJío;ls9ro;eJop6;s9v47;rtCWsible;riA;eNiKusJ;tre4;mJr6;itJ;ad5;gíJso;timo;eAón7;aWeSiQoLuKábil,íbCLúJ;me1n8X;e8gonote,m6KracaCGér3C;cicu1mLnKrJ;izoASr21;do,es2;ogOóJ;fo0loFnimo;d2Crsu2sJ;pano0Atór7G;br7chi97lLrb6SteroJ;doxo,gJ;én7;a1e0;bituBlóKmbrJr2;e,iH;filo,ge0;a00eYiXlVoUrNuJé3C;aKerrJipuzcoa0;e3ill4J;po,rdián,temalJ;te8;aLecoKiJose3ueC;eg5s;!la90rW;nKsJto,ve4;iHo;!aJde4;di0;do,r1;aJobAút7;b3u8;g6Uta0;nJográfAEr73st9;erBui0étAD;di6WlJrzo,scGucho;lLoJés;!rJ;ro6Y;ar1eF;a0Ae07i01lXoVrQuMácil,éKísJ;icAX;rJti1;r7til;erBFnKtJ;ur5;c4CdameJes2;ntB;aKecu3VisGug5QíJ;a,o4volo;ncKtJudulH;er0;es9Zis8Do,és;lclór9UrJ;mAni1;aKexivo,oJ;jo,ri1;co,mJ;en8íge3;brados,cticiNdedig0eMjo,lLnJrme;aJo;l,nciero4;ipi0ósofo;lAMro;as,os;cKderAliJmenin5o;no,z;un1;lLmJríng7sci2Fvor3T;iJosE;liar;lo,s5;br6conóm5Pd18f16g15jecu72l0Zm0Yn0Tp0Qqu0Nrrón7s01t00uropeEvid7YxJ;!acta,cXen2haWiVpTtJó95;ePin2rJ;aLem5ovKíJ;nse8;er7D;ct9njerKterrJ;estre;a4os;nKrJ;i81n2O;di1s5;erJreC;ime8Jto;gIst2T;us2;elJret9;ente,so;er0rus8ér7;bel2cZenYlWpPquivo,tJ;aNelar,on6r1NuKándar,úJ;pi1;dKpJ;en1;ioC;ble,dounidense4n8tB;aNeLiriKlénJur6;di1;tuA;cJso;iBíf09;ciBr50ñolJ;!a4es;avo,ovJ;a8e0;ciA;aMleKoJue2;cDlar;róJ;filo;ndinavo,s1U;iKíJ;vo8;lib62no,val6R;icKóJ;nimo;úr7;a0cMdLemiFfermo,oKreve6PtJ;e3usiasta;ja1rme4;oc82ó7S;ant9Cima;bara88is9;eJéctr5W;ctJva1;orLróJ;filo,nJ;ic1D;!al;eo,ipc6oísta;ec0Ricaz,íJ;me3;it9;a0Te00iMoLruCuJébil;lJr5;ce,zG;ble,lo8Rmin3Wrmi1;e73fUgTminu2oce5KploSrect1DsNur0vKáJ;fa0;erJi0;sJti1;as,o4;cMj83pJtintE;erConibKuestJ;!o;le4;apaci7Ore2;ma1;itAno;er10uJíc22;n2so11; moda,bil,c08f05l03n01pZrYsJvo2;aVcRdiQemplPhon5MiOnu1o13pKtru43vaJ;li1;iLrJ;e3RovJ;is2;aNer2;er2;ea1;cha1;alLonKuiJ;da1;o76tH;zo;fo77perciJ;bi1;ech5;ortivJred81;as,o;so,tiJ;cu7C;gJicJ;ad77;ens9iniJ;tiJ;va;a0idI;il;da;nDñi0;a1Qe1Hh19i15l13oXrQuLáKélebre,óJ;mo1ncavo,rn7;li1ntab3;aMba0er1ltLrJstod6ánt65;si,vJ;il0Ko;o,urB;d3rta;an67eOiKoata,uJí3S;do,en2;ollo,stJ;a65iJ;anJno;a,o4;ci4Hs6B;l0Lm0FnWoVque2rLsJ;a8tJ;era;a5YdRea0int6nu1pPreKso,tJuñD;a4e3To4;ctLspoJ;ndiJ;en6Y;a,oJ;!r;orAulHór7;en2;a1ille4Q;rde6N;c00du2HeZfXj67mov6Jo5VsOtLvJ;eJulC;rCxo;en2iJ;gInJ;e4Vu5;aPerv6PiMpLtJult9;an6KitucJri2A;ionA;icI;derJst3S;abJ;le;bi1nguJ;ín7;orJuC;me;xo;ienzu1re2;ar3Eer2ZpKunJún;es,ista;lKosteJ;la0;eJi4P;j5t5;e1SoJ;mbiJniAri1;a0no;aJo2Lás2P;ndes2Zr5;clóp7eLlKmarrGrcunv17vJ;il5M;ia1;go,ntíf2KrtE;aOecMiKoJur3;lo,ro;f59lJno;en5lG;he0oJ;!slova8;rJto;ro,ter;lPnLrJ;cJebrAra1;anE;s9trJ;al57oeKíJ;fuFpe2;urop7;este,tíbe3ulJ;ar;duc03l02mZnWpSrNsLtJu2;alJól3Z;án;e3tJ;ell3Eo;acterís1Nc3PnMoKroñe3tJ;ag0Rujo;!lJ;ing6;ívo3;aKitalJri0uchi0;!i0;cJz;es;an7cerí3Hi0o,sa1tJ;ante,oJ;nDr;boKpeJ;ro,si0ón;ya0;cár7i23mo,vo;ifol6o;a0He09i02lanZoVrOuLáKíJúl11;fi1pe1;rba3sQva3;enKfo,rJ;do,guDlG;!a4o4;avo,eOiKuJ;jo,s0Dto;llLtJ;a0ánJ;icE;ante;tGve;goLhem6mKol38rJsn6to,vi0;goñGracho;bo;ta0;cKdo,quJ;eci0;a4o4uz8;eMlbLnaKrJzar3;ma0;ria;aí0;lorruCnJ;veJ;ni1;a2llo,nMoc6rJ;ber10ebKlJ;inD;er;eKig0éJ;volo;dic0UfaJ;ct9;bilPilNjEldMrKstJyo;ar1o;a2bu1cel0WroJí26;co4;ío;arJ;ín;on6;b3Fc34d2Ve2Tf2Pg2Lje2Jl1Zm1Mn0Xp0Rqu7r07s02tWuPvLzuKére5ñeJ;jo;caLl37;aLenJ;tuJ;re3;n2Ero;dOstrohúnNtJ;oKóJ;c1Rgrafo,nom5;gest2HmJpropul0M;ot9;ga3;az;eMlánLrJ;acJevi1oz;tivo;ti8;n2o,rJ;ciope2Ir34;esMiKtu2íJ;ncro0;dIlvestJr6;ra1;i0or;aZbYca0dIenWgSio,mRqueológicQrNtJábiF;eLifiKístJ;ic5;ciB;sa0;epenKies2WoJ;ce3;ti1;os;en6;eKiJ;vo;li0nJ;ti0;is8;co;ór7;gKm7uJ;ca0;onD;aKuJócrifo4;es2;iLrJ;enJ;te;sa1;a03cho,d00eZfiXgWhid3iUtMuBáLóJ;maJnimo;lo;loF;eNiJ;aér7c1JguEsubJ;ma0R;a4o4;eo;cKriJ;or1K;es9;ma1sóJ;tropo;evi0losajGos2;b6triG;ón;jo,xo;aluz,i0orJ;ra0;ho;e0Tlfabe2rJ;anja1quJ;isJ;ta;aSbiMeriKorJpli5;fo;cJnd6;an5;dieMeKgI;uo;ntA;al;st3;ro;do,rJ;go,illJ;a,en2o;a01bZcaYdXeSfonRgOoNpi0tMucKócJ;to0;inóJ;ge0;a4er0o4;ca1;ebraKonqJ;ui0;ica;si0;gMjandLmJnt0W;anJán;a4es;ri0;re;ea0;li0;anDi0;és;do,no;dreJno;za1;iLrJudo4;adeJio,ícola4ónomo;ci1;ta1;ga0icKoJ;rtu06;io05;no;rob6;io;ecQiNjMministrativLul2vJ;erC;so;a4o;un2;cKnteJ;la1;ionB;ua1;ampaSep2iaFoOtLuKérriJ;mo;miQ;iv5uB;alJ;!es;gJrazoM;ed9;go;to;na1;neTorigSrumQsOuJ;ndKrJ;ri1;anJ;te4;!s;olut5ur1;a,o;ad9;or;en;ga1;do",
    "City": "true¦0:3B;a2Zb29c1Zd1Ue1Tf1Rg1Lh1Di1Bjakarta,k12l0Vm0Hn0Do0Bp00quiZrWsMtDuCv9w4y2z1;agreb,urich;angon,e1okohama;katerin1Krev0;ars4e3i1rocl4;cklow,n1;nipeg,terthur;llington,xford;aw;a2i1;enna,lnius;lencia,ncouver,rna;lan bator,trecht;a7bilisi,e6he5i4o3rondheim,u1;nWr1;in,ku;kyo,ronJulouD;anjin,l16miso2Mrana; haKssaloniki;gucigalpa,hr0l aviv;i1llinn,mpere,ngier,rtu;chung,n0pU;a4e3h2kopje,t1ydney;ockholm,uttgart;anghai,enzhen;oul,v01;int peters0Xl4n1pporo; 1ti1E;jo1salv3;se;v1z0T;adW;eykjavik,i2o1;me,sario,t28;ga,o de janeiro;to;a9e7h6i5o3r1uebla,yongyang;a1etoria;gue;rt1zn0; elizabe4o;lsen,raeus;iladelphia,nom penh,oenix;r1tah tikva;th;lerLr1tras;is;dessa,s1ttawa;aka,lo;a3ew 1is;delWtaip1york city;ei;goya,ntes,ples,v0;a7e6i5o2u1;mbai,nich;nt2sco1;u,w;evideo,real;l0nsk,skolc;dellín,lbourne;drid,l6n4r1;ib2se1;ille;or;chest1dalYila;er;mo;a6i3o1vCyon;nd1s angeles;on,res;ege,ma1nz,sbon,verpo2;!ss1;ol; plata,usanne;a6hark5i4laipeda,o2rak1uala lump3;ow;be,pavog1sice;ur;ev,ng9;iv;b4mpala,ndy,ohsiung,ra1unas;c1j;hi;ncheNstanb1̇zmir;ul;a6e4o1; chi mi2ms,u1;stJ;nh;lsin1rakliH;ki;ifa,m1noi,vana;burg,iltE;alw5dan4en3hent,iza,othen2raz,ua1;dalaj0Hngzhou;burg;eVoa,ève;sk;ay;es,rankfu1;rt;dmont5indhovV;a2haka,oha,u1;blSrb0shanbe;e1kar,mascus,ugavpiK;gu,je1;on;a8ebu,h3o1raioKuritiba;lo1nstanKpenhagOrk;gGmbo;enn4i2ristchur1;ch;ang m2c1ttagoM;ago;ai;i1lgary,pe town,rac5;ro;aIeCirminghXogoBr6u1;char4dap4enos air3r1s0;g1sa;as;es;est;a3isba2usse1;ls;ne;silRtisla1;va;ta;i4lgrade,r1;g2l1n;in;en;ji1rut;ng;ku,n4r1sel;celo2ranquil1;la;na;g2ja lu1;ka;alo1kok;re;aDbBhmedabad,l8m5n3qa2sh1thens,uckland;dod,gabat;ba;k1twerp;ara;m0s1;terd1;am;exandr2ma1;ty;ia;idj0u dhabi;an;lbo2rh1;us;rg",
    "Country": "true¦0:2M;a2Cb1Yc1Nd1Me1Df19g12h11i0Sj0Qk0Nl0Gm08n04omán,p00rRsFtAu6v4wal3y2z1;a1Rimbabue;emen,ibuti;es,lis and futuna;a1enezuela,ietD;nuatu,tican city;cr2Fg0Snited 2ruXs1zbek2H;a,sr;arab emiratIkingdom,states1;! of ameB;a4imor oriental,o3rinidad y tobago,u1únez;r1valu;kmen2Bquía;go,nS;i0Xnz27yik29;a8e7i6om0Eri lanka,u1;azi0Vdá2ec0iza,ri1;nam;f2n1;! del sur;rica;erra leona,ngapur,r0;negal,rb0ychell4;moa,n1o tomé y príncipe; 1ta lucía;cristóbal y niev1mariSvicente y las granad0N;es;e2u1;anda,m1Ts0;ino unido,pública 1;c4d1;e1omin4; macedQl1mocrática del1; conL;entroafr1heca;icana;a2erú,o1;lLrtugal;k1Llaos,namá,púa nueva guinea,ra1íses bajos;guay;a3epal,i2orue1ueva zelUíger;ga;caragua,ger0;mib0uru;a5icroSo2éxi1óna1;co;ldav0n2zambiq1;ue;gol0tenegro;dagascar,l1rruecos,urit18;a1divas,ta,í;s0ui;aos,e5i3uxembur2íba1;no;go;b1echtenstein,tu12;er0ia;soZt1;on0;azaj10en0ir1uwait;gu0Ziba1;ti;a1ord0V;maica,pH;nd7r5s2t1;al0;la1rael;nd0s 1;marshall,salomC;ak,l1án;anda;ia,o1;nes0;aití,onduras,ungrD;a5hana,r4u1;atemala,inea1yana;! ecuatori1-bisáu;al;anada,ec0;b1mb0;ón;i1ranc0;lip2n1yi;land0;inZ;cu8gip7l salv8miratos árabe6ritr5s2tiop1;ía;lov2paña,t1;ado3on0;aqu0en0;ea;s unidR;to;ador;inamarDominiD;a8hi6o1roac0uba;lo4morNrea del 2sta 1te d'ivoi6;de marfEriA;norte,s1;ur;mb0;le,na,p1;re;bo verde,m2nadá,t1;ar;boya,erún;a9e8i7o6r4u2élgi1;ca;lgar0r1tO;kina faso,undi;as1unéi;il;liv0snia-herzegoviCtsuaC;elorrus0rmG;lice,nín;ham4ngladés,r1;bad2é1;in;os;as;fganBl8n5r2ustr1zerbaiyC;al0ia;abia saudita,ge1men0;l0nti1;na;dorra,go2tigua y barbu1;da;la;b1em1;an0;ia;ist1;án",
    "Place": "true¦aLbJcHdGeEfDgAh9i8jfk,kul,l7m5new eng4ord,p2s1the 0upIyyz;bronx,hamptons;fo,oho,under2yd;acifLek,h0;l,x;land;a0co,idCuc;libu,nhattJ;ax,gw,hr;ax,cn,ndianGst;arlem,kg,nd;ay village,re0;at 0enwich;britain,lak2;co,ra;urope,verglad0;es;en,fw,own1xb;dg,gk,hina0lt;town;cn,e0kk,rooklyn;l air,verly hills;frica,m5ntar1r1sia,tl0;!ant1;ct0;ic0; oce0;an;ericas,s",
    "Region": "true¦0:22;1:1T;a20b1Sc1Id1Des1Cf19g14h11i0Yj0Wk0Ul0Rm0GnZoXpTqQrNsEtButAv7w4y2zacatecas;o05u2;catan,kZ;a2est vi5isconsin,yoming;rwick1shington2;! dc;er3i2;rginia;acruz,mont;ah,tar pradesh;a3e2laxcala,uscaB;nnessee,xas;basco,maulipas,smK;a7i5o3taf0Pu2ylhet;ffVrrey,s0Y;me10uth 2;cSdR;beria,c2naloa;huan,ily;n3skatchewan,xo2;ny; luis potosi,ta catari0;a2hode8;j2ngpur;asthan,shahi;inghai,u2;e2intana roo;bec,ensXretaro;ara0e3rince edward2; isV;i,nnsylv2rnambuco;ania;axaca,disha,h2klahoma,ntar2reg5x06;io;ayarit,eCo4u2;evo le2navut;on;r2tt0Sva scotia;f7mandy,th2; 2ampton1;c4d3yo2;rk1;akota;aroli0;olk;braska,vada,w2; 3foundland2;! and labrador;brunswick,hamp1jers3mexiLyork2;! state;ey;a7i3o2;nta0relos;ch4dlanCn3ss2;issippi,ouri;as geraHnesota;igQoacQ;dhya,harashtra,ine,ni4r2ssachusetts;anhao,y2;land;p2toba;ur;anca1e2incoln1ouis9;e2iH;ds;a2entucky,hul0;nsas,rnataka,shmir;alis2iangxi;co;daho,llino3nd2owa;ia0;is;a3ert2idalEunA;ford1;mp1waii;ansu,eorgWlou5u2;an2izhou,jarat;ajuato,gdo2;ng;cester1;lori3uji2;an;da;sex;e5o3uran2;go;rs2;et;lawaFrby1;a9ea8hi7o2umbrI;ahui5l4nnectic3rsi2ventry;ca;ut;iNorado;la;apFhuahua;ra;l9m2;bridge1peche;a6r5uck2;ingham1;shi2;re;emen,itish columb4;h3ja cal2sque,var3;iforn2;ia;guascalientes,l5r2;izo0kans2;as;na;a3ber2;ta;ba3s2;ka;ma",
    "FemaleName": "true¦0:FV;1:FZ;2:FO;3:FA;4:F9;5:FP;6:EO;7:GC;8:EW;9:EM;A:G8;B:E2;C:G5;D:FL;E:FI;F:ED;aDZbD1cB8dAIe9Gf91g8Hh83i7Sj6Uk60l4Om38n2To2Qp2Fqu2Er1Os0Qt04ursu6vUwOyLzG;aJeHoG;e,la,ra;lGna;da,ma;da,ra;as7EeHol1TvG;et9onB8;le0sen3;an8endBMhiB3iG;lInG;if3AniGo0;e,f39;a,helmi0lGma;a,ow;aMeJiG;cHviG;an9XenFY;kCWtor3;da,lma,nus,rG;a,nGonica;a,ice;leGnesE9;nDIrG;i1y;aSePhNiMoJrGu6y4;acG0iGudy;c3na,sG;h9Mta;nHrG;a,i;i9Jya;a5Iffany,na,s5;al3eGomasi0;a,lma,o6Xres1;gan,o6WrHssG;!a,ie;eFi,ri7;bNliMmKnIrHs5tGwa0;ia0um;a,yn;iGya;a,ka,s5;a4e4iGmC7ra;!ka;a,t5;at5it5;a05carlet2Ye04hUiSkye,oQtMuHyG;bil,lvi1;e,sHzG;an2Tet9ie,y;anGi7;!a,e,nG;aEe;aIeG;fGl3DphG;an2;cF5r6;f3nGphi1;d4ia,ja,ya;er4lv3mon1nGobhan;dy;aKeGirlBIo0y6;ba,e0i6lIrG;iGrBMyl;!dan;ia,lBS;ki4nIrHu0w0yG;la,na;i,leAon,ron;a,da,ia,nGon;a,on;l5Yre0;bMdLi8lKmIndHrGs5vannaE;aEi0;ra,y;aGi4;nt5ra;lBKome;e,ie;in1ri0;a02eXhViToHuG;by,thBH;bQcPlOnNsHwe0xG;an93ie,y;aHeGie,lC;ann7ll1marBCtB;!lGnn1;iGyn;e,nG;a,d7W;da,i,na;an8;hel53io;bin,erByn;a,cGkki,na,ta;helle,ki;ea,iannon,oG;da,n12;an0bIgi0i0nGta,y0;aGee;!e,ta;a,eG;cca,kaE;chGe,i0mo0ndi,quel,vDy0;ael,elGi8;!e,le;een2ia0;aMeLhJoIrG;iGudence;scil1Uyamva8;lly,rt3;ilome0oebe,ylG;is,lis;arl,ggy,nelope,r6t4;ige,m0Fn4Oo6rvati,tHulG;a,et9in1;ricGsy,tA5;a,e,ia;ctav3deHfATlGphAT;a,ga,iv3;l3t9;aQePiJoGy6;eHrG;aEeDma;ll1mi;aKcIkGla,na,s5ta;iGki;!ta;hole,k8AolG;a,eBE;!mh;l7Sna,risF;dIima,nHomi,taG;li1s5;cy,et9;eAiCL;a01ckenz2eViLoIrignayani,uriel,yG;a,rG;a,na,tle;i4ll9UnG;a,iG;ca,ka,que;a,chOkaNlJmi,nIrGtzi;aGiam;!n8;a,dy,erva,h,n2;a,dIica,lG;iGy;cent,e;red;!e6;ae6el3G;agan,gKi,lHrG;edith,isFyl;an2iGliF;nGsAJ;a,da;!an,han;b08c9Bd06e,g04i03l01nZrKtJuHvis,x85yGz2;a,bell,ra;de,rG;a,eD;h74il8t2;a,cSgOiJjor2l6In2s5tIyG;!aGbeth,jaAlou;m,n9P;a,ha,i0;!aIbel,eHja,lCna,sGtza;!a,ol,sa;!l06;!h,m,nG;!a,e,n1;arIeHie,oGr3Kueri9;!t;!ry;et3IiB;elGi61y;a,l1;dGon,ue6;akranBy;iGlory;a,ka,n8;a,re,s2;daGg2;!l2W;alCd2elGge,ison,on0;eiAin1yn;el,le;a0Ie08iWoQuKyG;d3la,nG;!a,dHe9PnGsey;!a,e9O;a,sey;ann,cJelIiFlHna,pGz;e,iB;a,u;a,la;iGy;a2Ae,l25n8;is,l1GrHtt2uG;el6is1;aIeHi7na,rG;a6Xi7;lei,n1tB;!in1;aQbPd3lLnIsHv3zG;!a,beth,et9z2;a,et9;a,dG;a,sGy;ay,ey,i,y;a,iaIlG;iGy;a8De;!n4F;b7Qerty;!n5Q;aNda,e0iLla,nKoIslAOtGx2;iGt2;c3t3;la,nGra;a,ie,o4;a,or1;a,gh,laG;!ni;!h,nG;a,d4e,n4N;cNdon7Pi6kes5rMtKurIvHxGy6;mi;ern1in3;a,eGie,yn;l,n;as5is5oG;nya,ya;a,isF;ey,ie,y;aZeUhadija,iMoLrIyG;lGra;a,ee,ie;istGy5A;a,en,iGy;!e,n48;ri,urtney;aMerLley,mIrGzzy;a,stG;en,in;!berlG;eGi,y;e,y;a,stD;!na,ra;el6MiJlInHrG;a,i,ri;d4na;ey,i,l9Ns2y;ra,s5;cey,i5UlOma6nyakumari,rMss5JtJviByG;!e,lG;a,eG;e,igh;a5CeHhGi3PlCri0y;ar5Aer5Aie,leDr9Cy;!lyn70;a,en,iGl4Tyn;!ma,n31sF;eigh,i,l2;a04eVilToMuG;anKdJliGst54;aHeGsF;!nAt0W;!n8U;ith,y;a,iB;!anLcelCd5Selle,han6FlJni,sHva0yG;a,ce;eGie;fi0lCph4V;eGie;en,n1;!a,e,n36;!ian,lG;!ian;anLle0nIrHsG;ica,sica;i,ri;!a,elle,ifer,nG;a,et9iGy;!e,fer;a,e6ZiHnG;a,e6YiG;e,n1;cLd1mi,nHqueliAsmin2Uvie4yAzG;min7;a7eHiG;ce,e,n1s;!lGsFt06;e,le;inHk2lCquelG;in1yn;da,ta;da,lPmNnMo0rLsHvaG;!na;aHiGobel;do4;!belGdo4;!a,e,l2G;en1i0ma;a,di4es,grid;el8ogG;en1;a,eAia0o0se;aNeKilHoGyacinth;ll2rtense;aHdGlaH;a,egard;ry;ather,iHlGnrietBrmiAster;en24ga;di;iley,lKnJrGtt2yley,zel;iGmony,ri4D;etG;!te;aEnaE;ey,l2;aYeTiOlMold12rIwG;enGyneth;!dolC;acHetGisel8;a,chD;e,ieG;!la;adys,enGor3ynis;a,da,na;aJgi,lHna,ov6YselG;a,e,le;da,liG;an;!n0;mYnIorgHrG;ald33i,m2Rtrude;et9i0;a,eGna;sis,vieve;briel3Cil,le,rnet,yle;aReOio0loMrG;anHe8iG;da,e8;!cG;esHiGoise;n1sca;!ca;!rG;a,ence;lHrnG;!an8;ec3ic3;rHtiGy7;ma;ah,rah;d0FileDkBl00mUnid,rRsMtLuKvG;aIelHiG;e,ta;in0Ayn;!ngel2F;geni1la,nice;hel,ta;meral8peranJtG;eHhGrel6;er;l2Mr;za;iGma,nest27yn;cGka,n;a,ka;eJilImG;aGie,y;!liA;ee,i1y;lGrald;da,y;aTeRiMlLma,no4oJsIvG;a,iG;na,ra;a,ie;iGuiG;se;en,ie,y;a0c3da,nJsGzaH;aGe;!beG;th;!a,or;anor,nG;!a;in1na;en,iGna,wi0;e,th;aWeKiJoG;lores,minique,n2XrGtt2;a,eDis,la,othGthy;ea,y;an08naEonAx2;anPbOde,eNiLja,lImetr3nGsiree;a,iG;ce,se;a,iHla,orGphiA;es,is;a,lah;dGrdG;re;!dee,na;!b29oraEra;a,d4nG;!a,e;hl3i0mMnKphn1rHvi1TyG;le,na;a,by,cHia,lG;a,en1;ey,ie;a,et9iG;!ca,el17ka;arGia;is;a0Oe0Lh03i01lToIrHynG;di,th3;is2Ay03;lOnLrHurG;tn1B;aId26iGn26riA;!nG;a,e,n1;!l1Q;n2sG;tanGuelo;ce,za;eGleD;en,t9;aIeoHotG;ilde;!pat4;ir7rIudG;et9iG;a,ne;e,iG;ce,sX;a4er4ndG;i,y;aPeMloe,rG;isHyG;stal;sy,tG;aHen,iGy;!an1e,n1;!l;lseHrG;!i7yl;a,y;nLrG;isJlHmG;aiA;a,eGot9;n1t9;!sa;d4elle,tG;al,elle;cGli3E;el3ilG;e,ia,y;iXlWmilVndUrNsLtGy6;aJeIhGri0;erGleDrCy;in1;ri0;li0ri0;a2FsG;a2Eie;a,iLlJmelIolHrG;ie,ol;!e,in1yn;!a,la;a,eGie,y;ne,y;na,sF;ace,ice;a,e,l1;isBl2;tlG;in,yn;arb0CeYianXlVoTrG;andRePiIoHyG;an0nn;nwCok7;an2NdgKgid,tG;ney,tG;!aHnG;ey,i,y;ny;etG;!t7;an0e,nG;da,na;i7y;bbi7nG;iBn2;ancGossom,ytG;he;ca;aRcky,lin8niBrNssMtIulaEvG;!erlG;ey,y;hHsy,tG;e,i0Zy7;!anG;ie,y;!ie;nGt5yl;adHiG;ce;et9iA;!triG;ce,z;a4ie,ra;aliyah,b24d1Lg1Hi19l0Sm0Nn01rWsNthe0uJvIyG;anGes5;a,na;a,ril;drIgusHrG;el3;ti0;a,ey,i,y;hHtrG;id;aKlGton;eHi7yG;!n;e,iGy;gh;!nG;ti;iIleHpiB;ta;en,n1t9;an19elG;le;aYdWeUgQiOja,nHtoGya;inet9n3;!aJeHiGmI;e,ka;!mGt9;ar2;!belHliFmT;sa;!le;ka,sGta;a,sa;elGie;a,iG;a,ca,n1qG;ue;!t9;te;je6rea;la;bHmGstas3;ar3;el;aIberHel3iGy;e,na;!ly;l3n8;da;aTba,eNiKlIma,yG;a,c3sG;a,on,sa;iGyson;e,son;a,cHna,sGza;a,ha,on,sa;e,ia;c3is5jaIna,ssaIxG;aGia;!nd4;nd4;ra;ia;i0nHyG;ah,na;a,is,naE;c5da,leDmLnslKsG;haElG;inGyW;g,n;!h;ey;ee;en;at5g2nG;es;ie;ha;aVdiSelLrG;eIiG;anLenG;a,e,ne;an0;na;aKeJiHyG;nn;a,n1;a,e;!ne;!iG;de;e,lCsG;on;yn;!lG;iAyn;ne;agaJbHiG;!gaI;ey,i7y;!e;il;ah",
    "MaleName": "true¦0:C9;1:BG;2:BX;3:BO;4:B0;5:BU;6:AO;7:9Q;8:B8;9:AS;A:AJ;B:9D;aB0bA4c93d84e7Ef6Xg6Fh5Vi5Hj4Kk4Al3Rm2Pn2Eo28p22qu20r1As0Rt07u06v01wOxavi3yHzC;aCor0;cChid,ne;hDkC;!ary;ar50ery;ass2i,oDuC;sEuma;nFsEusC;oCsD;uf;ef;at0g;aKeIiDoCyatt;lfgang,odrow;lCn1O;bEey,frBFlC;ard,iC;am,e,s;ert,ur;i,nde7sC;!l6t1;de,lDrr5yC;l1ne;lCt3;aBy;aFern1iC;cDha0nceCrgil,va0;!nt;ente,tor;lentin48nBughn;lysses,sm0;aUePhLiJoFrDyC;!l3ro8s1;avis,eCist0oy,um0;nt9Evor,y;bEd7TmCny;!as,mCoharu;aso,ie,y;ias,y;mCt9;!my,othy;adEeoDiago,omC;!as;!dore;!de9;dFrC;enBrC;anBeCy;ll,nB;!dy;dgh,ichi,nn3req,ts44;aRcotPeOhKiIoGpenc3tCuraj,ylve8Dzym1;anEeCuart;f0phABvCwart;e56ie;!islaw,l6;lom1nny,uC;leyma8ta;dClas,m1;!n6;aEeC;lCrm0;d1t1;hid,ne,qu0Uun,wn,y8;am9basti0kou,lim,rgio,th,ymour;!tC;!ie,y;lDmCntino,qib,ul;!mAu4;ik,vatore;aXeThett,iPoGuDyC;an,ou;b6IdDf9pert,ssC;!elAF;olph,y;an,bJcIdHel,geGh0land,mFnEry,sDyC;!ce;coe,s;ald,nA;an,eo;lio,r;e4Qg3n6olfo,rigo;co,ky;bAe9R;cCl6;ardo,c5LhDkC;!ey,ie,y;ard,ie;gDid,ub5x,yCza;ansh,nT;gie,iC;nald,s;chid,fa4lEmDndCpha4shad,ul,ymond;al9Volph,y;iro,on;f,ph;ent2inC;cy,t1;aGeEhilDierre,ol,reC;st1;!ip,lip;dro,rcy,tC;ar,e2V;blo,draig,t44ul;ctavio,liv3m93rGsDtCumar,w5;is,to;aDcar,vC;aldo;ma;i,vK;athKeIiEoC;aCel,l0ma0r2X;h,m;cDg4ilo,kC;hil,ola;holas,kColas;!olas;al,d,il,ls1vC;ille;anCy;!a4i4;aXeUiLoGuDyC;les,r1;hamDrad,staC;fa,pha;ed,mG;dibo,e,hamEises,ntDsCussa;es,he;e,y;ad,ed,mC;ad,ed;cHgu4kFlEnDtchC;!e7;ato,ik;house,o04t1;e,olC;aj;ah,hCk6;a4eC;al,l;hDlv2rC;le,ri7v2;di,met;ck,hOlMmPnu4rIs1tEuricDxC;!imilian89we7;e,io;eo,hDias,tC;!eo,hew,ia;eCis;us,w;cEio,k83lDquis,sha7tCv2;i2Hy;in,on;!el,oLus;achCcolm,ik;ai,y;amCdi,moud;adC;ou;aReOiNloyd,oJuDyC;le,nd1;cFiEkCth3;aCe;!s;gi,s;as,iaC;no;g0nnie,renEuCwe7;!iC;e,s;!zo;am,on4;a78evi,land,nDonCst3vi;!a5Yel;!ny;mDnCrry,ur4Rwr4R;ce,d1;ar,ont;aJeEhaled,iCrist4Tu46yle;er0p,rC;by,k,ollos;en0iFnCrmit,v2;!dDnCt5A;eth,y;a7rick;r,th;nata,rCthem;im,l;aZeRiPoEuC;an,liCst2;an,us;aqu2eKhnJnHrFsC;eDhCiah,ue;!ua;!ph;dCge;an,i,on;!aCny;h,s,th4V;!ath4Uie,nA;!l,sCy;ph;an,e,mC;!mA;d,ffHrEsC;sCus;!e;ald,emDmai8oCry;me,nimo;iah,y;!ery,rC;ey,y;cId5kHmGrEsDvi3yC;!d5s1;on,p3;ed,od,rCvis;ett,od;al,es,is1;e,ob,ub;k,ob,quC;es;aObrahNchika,gLkeKlija,nuJrHsEtCv0;ai,sC;uki;aCha0iah,ma4sac;ac,iaC;h,s;a,vinCw2;!g;k,nnguaq;!r;nacCor;io;im;in,n;aKeGinata,oEuCydar;bert,gCmberto,sE;h,o;m3raBsCward;se2;aEctDitDnry,rC;bert,m0;or;th;bLlKmza,nJo,rEsDyC;ato,d5;an,s0;lFold,rEuCv6;hito,ki,tC;a,o;is1y;an,ey;k,s;!im;ib;aReNiMlenLoJrFuC;illerDsC;!tavo;mo;aEegCov3;!g,orC;io,y;dy,ham,nt;nzaCrd1;lo;!n;lbe4Ono,ovanni;ne,oErC;aCry;ld,rd4S;ffr6rge;bri4l5rCv2;land,r3Cth,y;aReOiMlKorr0HrC;anEedCitz;!dAeCrick;rick;cEkC;!ie,lC;in,yn;esJisC;!co,zek;etch3oC;yd;d4lConn;ip;deriDliCng,rnando;pe,x;co;bi0di;arZdUfrTit0lNmHnGo2rDsteb0th0uge8vCym5zra;an,erett;gi,iDnCrol,v2w2;est44ie;c06k;och,rique,zo;aGerFiDmC;aFett;lCrh0;!io;s1y;nu4;bert,d1iFliEmDt1viCwood;n,s;er,o;ot1Ts;!as,jah,sC;ha;a2en;!dAgar,mFuDwC;a25in;arC;do;ond,und;l,nC;est;aYeOiLoFrEuDwCyl0;ay8ight;a8dl6nc0st2;ag0ew;minicGnEri0ugDyC;le;!las;!ald,nCov0;e7ie,y;!k;armuDeCll1on,rk;go;id;anJj0lbeImetri9nGon,rFsEvDwCxt3;ay8ey;en,in;hawn,mond;ek,rick;is,nCv3;is,y;rt;!dC;re;lLmJnIrEvC;e,iC;!d;en,iEne7rCyl;eCin,yl;l2Wn;n,o,us;e,i4ny;iCon;an,en,on;e,lC;as;a07e05hXiar0lMoHrFuDyrC;il,us;rtC;!is;aCistobal;ig;dy,lFnDrC;ey,neli9y;or,rC;ad;by,e,in,l2t1;aHeEiCyJ;fCnt;ford,t1;meDt9velaC;nd;nt;rEuDyC;!t1;de;enB;ce;aGeFrisDuC;ck;!tC;i0oph3;st3;d,rlCs;eCie;s,y;cCdric;il;lFmer1rC;ey,lDro7y;ll;!os,t1;eb,v2;ar03eVilUlaToQrDuCyr1;ddy,rtJ;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dDndC;en,on;!foCl6y;rd;bDrCyd;is;!by;i8ke;al,lA;nGrCshoi;at,nDtC;!ram;aCie;rd0T;!edict,iDjam2nA;ie,y;to;n6rCt;eCy;tt;ey;ar0Yb0Od0Kgust2hm0Hid5jani,l00mYnQputsiPrGsaFuDveCya0ziz;ry;gust9st2;us;hi;aJchIi4jun,maGnEon,tCy0;hCuro;ur;av,oC;ld;an,nd;el;ie;ta;aq;dHgel06tC;hoFoC;i8nC;!i03y;ne;ny;reCy;!as,s,w;ir,mCos;ar;an,bePd5eJfGi,lFonEphonIt1vC;aNin;on;so,zo;an,en;onDrC;edQ;so;c,jaFksandEssaFxC;!and3;er;ar,er;ndC;ro;rtI;ni;en;ad,eC;d,t;in;aDolfCri0vik;!o;mCn;!a;dGeFraDuC;!bakr,lfazl;hCm;am;!l;allFel,oulaye,ulC;!lDrahm0;an;ah,o;ah;av,on",
    "FirstName": "true¦aEblair,cCdevBj8k6lashawn,m3nelly,quinn,re2sh0;ay,e0iloh;a,lby;g1ne;ar1el,org0;an;ion,lo;as8e0r9;ls7nyatta,rry;am0ess1ude;ie,m0;ie;an,on;as0heyenne;ey,sidy;lex1ndra,ubr0;ey;is",
    "LastName": "true¦0:2Z;1:36;2:34;3:2A;4:2T;5:2V;a36b2Wc2Jd2Ae27f22g1Wh1Mi1Hj1Bk14l0Wm0Mn0Io0Fp04rXsMtHvFwCxBy8zh6;a6ou,u;ng,o;a6eun2Poshida,un;ma6ng;da,guchi,moto,sh1YzaQ;iao,u;a7il6o4right,u;li36s2;gn0lk0ng,tanabe;a6ivaldi;ssiljev,zqu1;a9h8ian,o7r6sui,urn0;an,ynisI;lstoy,rres,th;atch0omps2;kah0Snaka,ylor;aDchCemjon3himizu,iBmiAo9t7u6zabo;ar1llivan,zuD;a6ein0;lin,rm0;sa,u4;rn3th;lva,mmons,ngh;midt,neid0ulz;ito,n7sa6to;ki;ch1dLtos,z;amBeagan,i9o7u6;iz,sD;b6dri1JgIjas,mero,osevelt,ssi,ux;erts,ins2;c6vera;ci,hards2;ir1os;aEeAh8ic6ow1W;as6hl0;so;a6illips;m,n1P;ders5et8r7t6;e0Lr3;ez,ry;ers;h1Xrk0t6vl3;el,te0H;baBg09liveiZr6;t6w1K;ega,iz;a6eils2guy5ix2owak,yman;gy,ka6;ji6muU;ma;aDeBiAo8u6;ll0n6rray,ssolini,ñ6;oz;lina,oIr6zart;ales,eau,ris;hhail3ll0;rci0ssi6y0;!er;eVmmad3r6tsu06;in,tin1;aCe8i6op1uo;!n6u;coln,dholm;fe7nin,r6wis;oy;bv6v6;re;mmy,rs5u;aBennedy,imuAlein,o8u7wo6;k,n;mar,znets3;bay6vacs;asY;ra;hn,rl9to,ur,zl3;aAen9ha4imen1o6u4;h6nYu4;an6ns2;ss2;kins,s5;cks2nssens;glesi9ke8noue,shik7to,vano6;u,v;awa;da;as;aBe8itchcock,o7u6;!a4b0ghNynh;a4ffmann,rvat;mingw7nde6rM;rs2;ay;ns5rrPs7y6;asDes;an3hi6;moI;a9il,o8r7u6;o,tierr1;ayli4ub0;m1nzal1;nd6o,rcia;hi;er9lor8o7uj6;ita;st0urni0;es;nand1;d7insteGsposi6vaK;to;is2wards;aBevi,i9omin8u6;bo6rand;is;gu1;az,mitr3;ov;nkula,rw7vi6;es,s;in;aFhBlarkAo6;h5l6op0rbyn,x;em7li6;ns;an;!e;an8e7iu,o6ristens5u4we;i,ng,u4w,y;!n,on6u4;!g;mpb7rt0st6;ro;ell;aBe8ha4oyko,r6yrne;ooks,yant;ng;ck7ethov5nnett;en;er,ham;ch,h8iley,rn6;es,i0;er;k,ng;dDl9nd6;ers6rA;en,on,s2;on;eks7iy8var1;ez;ej6;ev;ams",
    "Person": "true¦ashton kutchRbQcLdJeHgastMhFinez,jDkClebron james,mBnettIoAp8r4s3t2v0;a0irgin maF;lentino rossi,n go3;heresa may,iger woods,yra banks;addam hussain,carlett johanssIlobodan milosevic,uA;ay romano,eese witherspoHo1ush limbau0;gh;d stewart,nald0;inho,o;a0ipI;lmHris hiltC;prah winfrEra;essiaen,itt romnDubarek;anye west,iefer sutherland,obe bryant;aime,effers8k rowli0;ng;alle ber0itlBulk hogan;ry;ff0meril lagasse,zekiel;ie;a0enzel washingt2ick wolf;lt1nte;ar1lint0ruz;on;dinal wols1son0;! palm2;ey;arack obama,rock;er"
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
      "first": "5:r{e{hac,nac,met,pod,tem,com,ten,pon,cre,tañ,mov,cos,tos,dol,sol,val,tra,cog,b{ca,sa,de,be}},a{g{re,ne,pe,ju,pa,ro},t{es,un,no,vo,ma},r{mi,ti,er,pa,ju,du,cu},rez,caz,lav,nev,c{se,to,pi,sa},bañ,soñ,tap,d{na,mu,du,an},gui,cri,odi,baj,fij,dej,cen,son,gan,tom,fum,hel,vol,s{pa,ca,pe,be,ce},cre,ech,rob},i{bat,abr,her,mor,teñ,reñ,ped,med,viv,reg,dec,ven,sal,sub},freí}|8:r{e{c{desha,e{obed,aman,apar,flor}},promet,nd{e{apr,ent,ext,enc,def,dep},esco},n{nte{co,ma},propo,compo},olv{dev,res},proteg},a{castig,entreg,conjug,t{detes,moles,n{e{inv,cal,int,aum,lam},enca,leva,agua},explo,por{so,re,ex,im},sul{in,re},respe},r{enamo,explo,spi{su,re},prepa,decla,censu,inmig,ilust,celeb},z{trope,reali,utili,bauti,almor,recha,amena,comen,alcan},reserv,cultiv,c{provo,i{plat,mast,crit,repl,expl,publ,fabr}},record,merend,convid,i{c{nego,apre,anun,ensu},estud},trabaj,n{gober,conde,perdo,i{elim,term,adiv,fasc}},inform,enferm,lastim,l{cepil,recic,cance,insta,arreg,alqui,calcu},es{regr,expr,conf},regate,chisme,escuch,planch,efectu,triunf},i{destru,t{derre,compe,permi,insis,ver{in,ad,di},comba},prefer,requer,desped,aplaud,m{pri{im,de},consu},correg,c{du{con,pro,tra},bende,prede},conven,escrib,prohib}},rse{opone,a{junt,sent,jact,qued,call,hall,burl,quem,llam,calm,duch,cans,pein,enoj,quej},dormi,senti,vesti}|7:r{e{c{rena,e{pad,par,ofr,mer},cono,ejer},suced,atend,ofend,n{obte,dete,supo,expo},cog{es,re}},a{oblig,naveg,t{apos,acos,asus,alen,plan,i{vis,vom,afe,inv},abor,acor,acep,apre},r{devo,deco,admi,aspi,comp,ahor,repa,madu,emig,aleg,most,espe,queb},empez,abraz,avanz,renov,c{colo,invo,apli,dedi,indi,acer,ahor},engañ,enseñ,diseñ,acamp,d{agra,enfa,abor,acor,guar,salu,brin,here,olvi},i{esqu,asoc,inic,limp,aliv,conf},manej,arroj,dibuj,n{ador,cami,coci,pati},afirm,estim,l{bril,mezc,char,anhe,reve,rega,seña,regu},rehus,repas,emple,evacu,gradu,aprob},i{inclu,influ,repet,admit,asist,suger,aburr,ocurr,sacud,invad,decid,aflig,dirig,duc{in,re},cumpl,exhib,recib},sonreí},rse{move,pone,a{neg,sec,mud,cri,ech,cas,bañ,lav}}|10:r{e{c{satisfa,e{perten,perman,establ,fortal,enriqu}},prend{com,sor},entreten},a{investig,conquist,simboliz,ific{sign,clar,glor,sacr,cruc,clas},particip,desagrad,recomend,contamin,matricul},i{u{constit,disting,trib{dis,con}},sobreviv,introduc}},rse{esconde,a{enamor,prepar,bronce,levant,calent,enferm},diverti}|9:r{e{c{agrade,aconte,enveje,recono,conven},descend,respond},a{t{protes,contes,disgus,pregun,presen,necesi,deposi,felici,desper,disfru},tr{regis,demos,encon},iz{satir,legal,civil,organ,colon},serv{pre,con},c{equivo,i{pract,if{mod,ver,pur},comun},confis},acompañ,renunci,divorci,aconsej,abandon,funcion,desayun,confirm,maquill,control,s{descan,atrave,intere,conver},continu,averigu},i{u{constr,sustit,dismin,g{se{per,con,pro},extin}},t{sen{con,pre},consis,compar,conver},descubr,describ}},rse{atreve,detene,a{enter,quebr,alegr,afeit,acost,asust,dedic,acerc,acord,enfad,olvid,gradu},decidi,aburri}|12:desagradecer,caracterizar,rse{enriquece,matricula,arrepenti}|11:r{ece{desapar,enflaqu},a{entrevist,interpret,acostumbr,generaliz,entusiasm,desarroll,emborrach}},rse{envejece,a{registr,pregunt,despert,equivoc,comunic,maquill,divorci},zambulli}|6:r{e{crec,torc,venc,romp,vend,perd,opon,barr,corr,quer,volv,prev,llov,atra},a{g{lle,col,apa,tra,car},t{cos,gus,gas,n{pi,ju,se,co,mo},gri,evi,tra,cor,fal,sal},r{ago,llo,ado,bor,cer,lad,log,ent,cob},cruz,lanz,salv,llev,c{cho,ubi,mar,bus,pes,ata,edu},culp,d{bor,tar,ayu,man,que,cui},i{vac,var,cop,env},viaj,enoj,llen,pein,rein,m{fir,for,lla,cal,que},l{hal,cal,bur,bai,hab,dob,vio},s{cau,abu,can,pen,avi},buce,pele,dese,uch{l,d},actu,situ,prob,acab,apoy},i{segu,ment,sent,vest,sufr,cubr,gruñ,añad,erv{s,h},dorm,g{ele,exi,fin,sur}}}|4:r{lee,ole,cae,ama,usa,hui,uni,reí},irse|3:r{ve,se,da,oí}|2:ir|13:rse{enflaquece,a{acostumbr,desarroll,entusiasm,emborrach}}~5:yacer~~",
      "second": "1:r{e{c{ya,e{en,aman,or,fr,bl,aqu},n},vend,pond},a{tig,rag,t{,n{gu,me,se,a}},r{mo,do,dmi,aspi,espi,p,r,a,ju,ig,nt,eb},z{oli,ti,ra,ha,van},preserv,iv,ev,c{e,lo,ovo,i{t,l,if{er,ur,s},r},ar,ta},pañ,bañ,d{ra,fa,abor,uar,u,in,ue,i},goci,uci,vi,j{a,i,se,o},en,in,amin,m,l{uil,r,ve,ña,g,i,gu,ab},us,cas,ns,e{c,pl,s,t},uch,ech,gu,ab,y}}|2as:ter,rer|2gas:detener|4iere:erer|4uevas:over|5uestes:costar|2es:ar{vant,prepar,erm,am,cu}|5iertes:ertar|3úa:ectuar|5igas:rseguir|4ige:egir|3zcas:cir|2e:hibir|4gas:erse|5zcas:cerse|4as:rse{de,ri}|4es:arse|7ientes:sentarse|5ques:carse|7uerdes:ordarse|4vayas:irse|7ientas:sentirse~1:r{,ega{p,v}}|2e:ir{duc{n,a},mbat,it,insist,fr,scubr,curr,um,v,ud,ad,g,l,gu}|4ice:edecir|6iégate:egarse|6écate:ecarse|6ócate:ocarse|7ércate:ercarse|7íllate:illarse|7úrlate:urlarse|5íate:iarse|7úntate:guntarse|7iéntate:entarse|7ústate:ustarse|6émate:emarse|7álmate:almarse|7ásmate:asmarse|7ánsate:ansarse|6ásate:asarse|6édate:edarse|6ídate:idarse|6ójate:ojarse|6éjate:ejarse|7úchate:ucharse|5úate:uarse|6áñate:añarse|8órciate:orciarse|7iébrate:ebrarse|7uérmete:ormirse|7iéntete:entirse|6ídete:idirse|6écete:uecerse|6évete:everse|4ite:mpetir|5iente:entir|5iste:estir|5ierte:ertir|4uere:orir|4iere:uerir|4iñe:eñir|5uerme:ormir|4ueve:lover|5ierve:hervir|5iende:ender{nc,t}|3íe:eír|2ye:r{í,ui{h,nstr,b,fl}}|5igue:eguir|2as:r{i,e{p,d,om,le}}|6uevas:overse|5uelvas:olver|5irvas:ervir|2yas:uir|3zcas:cer|4itas:etir|5ientas:sentir|7istas:estirse|7iertas:ertirse|5iertas:nvertir|4uedas:oder|5iendas:ender{nt,c,ef}|4idas:edir|5ierdas:erder|2gas:ner,ler,enir|3as:stinguir|4igas:ecir|2igas:caer|4ieras:erir|4as:lirse|4uelas:oler|3jas:oger|4iñas:reñir|4íbas:ohibir|3ías:nreír|3zas:rcer|5uerzas:orcer|2es:ar{,t{n,o,is,mi,vi,osi,bor,epor,nsul,fal,pe},min,scin,afirm,nform,astim}|4üeres:gorar|6uentres:ontrar|7uestes:ostarse|7iertes:ertarse|2ues:gar|4uegues:ogar|5uelgues:olgar|3ques:car|3íes:iar{u,ar,f}|5iernes:ernar|5uerdes:cordar|3ces:zar|5iences:enzar|4úses:husar|4ieses:esar{v,f}|5ienses:ensar|3úes:tuar|4uebes:probar|4iega:negar|5uesta:ostar|5ienta:lentar|5uenta:contar|4ieta:apretar|5ierra:errar|6uestra:ostrar|5iebra:uebrar|4ieza:pezar|5uerza:orzar|4ueña:oñar|5uerda:ecordar|5ienda:endar|4uela:volar|3ía:iar{r,ac,nv}|4uena:sonar|3úa:uar|4ueva:ovar|4ieva:nevar|4ón:poner{u,ro}|4én:ener|3z:acer{h,f}|2é:ever|2:alir~3edir:ide|3egir:ige{rr,el}|0r:ege,oge|1ir:ibe|5ir:vayas|4cerse:jezcas|4cir:uzcas|2er:etas,rras|2ir:sistas,cidas|3erse:tengas|4eguir:sigas|2irse:urras|6oler:huelas|4egir:ijas|2r:eas|2arse:es{r{te,mo,eg,mb},t,unt,ce,in,m,ud,fad,ll,icul,h}|7ostrar:uestres|6errar:yerres|6entar:ientes|6egar:iegues|2ar:illes,nches|5elar:ieles|3gar:ega|4obar:ueba|0er:n|1ar:á~2gas:tener|4gas:ponerse|7ientas:sentirse|1:r{dura,unta,e{parec,nac,v,cog}}|4huelas:oler|2es:amar|4ide:pedir|4ueba:probar|5igas:seguir|2á:estar|4ieles:helar|2:poner|4iegues:regar|2e:escribir|5uestes:costar|4iere:querer|5ientes:sentar|1as:ser|5yerres:errar|2vayas:ir|3ega:jugar|5iente:sentir|6uestres:mostrar|4ijas:regir",
      "secondPlural": "1d:r{e{ec{d,aman,r,al,j},orr,evolv,ov,scog},a{g{esti,ne,pe,ve,a,r},t{,es,vis,cos,men,esi,xpor},r{o{m,g,ll,d},ti,pi,bor,a,su,nt,eb},z{e,i{ir,eal,vil,an},u,r,ha,ca,lan},iv,nev,ov,c{e,ivo,i{t,epl,apl,if{or,ur,c,s},ed,p,n,r},r,us,sa,u},pañ,bañ,nseñ,ap,d{fa,uar,u,ren,lvi},i{gu,c{go,e,anun,i},r,ud,op,iv},j,n{e,do,io,i{cam,rm,oc,e,t}},m{ir,asti,u,l,s},l{zc,r,he,ve,ga,ña,i,gu,vo,io},us,pres,is,e,ch{du,cu,e},u,y},i{nsegu,onsist,ed,ñad,eprim,produc,educ,edec}}|3zcáis:ecer{sagrad,apar,fr}|2gáis:detener,mponer,enir|2éis:preparar,yudar|3quéis:aticar|5urmáis:ormir|4igáis:ecir|2áis:ubir|5zcáis:cerse|4éis:arse|4vayáis:irse|4áis:irse{d,r}~1d:r|4áis:rse{e,ti}|5irváis:servir|2áis:r{e{lv,p,omet,em,d{ven,ten,con,r},re,r,ñ,tos,sol,deb},i{dmit,ist,mbat,m,d,br,uñ,pl}}|2yáis:uir{estr,l}|4epáis:aber|5quepáis:caber|3zcáis:cir,ecer,enacer|4itáis:retir|7irtáis:ertirse|5irtáis:onvertir|7urmáis:ormirse|4idáis:medir|1áis:ver|4ijáis:regir|3jáis:xigir,rgir,oger|4iráis:erir{g,u}|4iñáis:reñir|3áis:guir|4gáis:enerse|2gáis:ntener,aler|5igáis:eguir|2igáis:aer|3záis:cer{or,nven}|2éis:ar{,re,ele,nu,t{n{gu,e,ca,o},ci,si,vi,s,ra,por,p,vo},uj,iaj}|2uéis:gar|3quéis:car|5quéis:rcarse|4éis:callarse|3céis:zar|3os:rse{a{or,mbr,tr,g,c,ud,ad,ll,rl,i,t{i,us,r,an,len},am,lm,sm,oj,ñ,as,ech},ne}|4íos:irse{pent,l}~6ir:vayáis|5cerse:ezcáis{aqu,j}|6entir:intáis|3irse:áis{id,urr}|4ir:vengáis|4er:ongáis|5ecir:digáis|3ir:báis|3arse:éis{ter,egr,ebr,e,u,t,cost,ued,lvid,ein,icul,erm,em,duch,ach,j}|3r:ais|4eír:iais~1d:r{a{reserv,pas,d{,bor,agra,an},am,alent,gust},trae}|2gáis:oponer|3iais:reír|2áis:escribir|1ais:ser|2vayáis:ir|5intáis:sentir",
      "firstPlural": "5:r{e{hac,nac,met,pod,tem,com,ten,pon,cre,tañ,mov,cos,tos,dol,sol,val,tra,cog,b{ca,sa,de,be}},a{g{re,ne,pe,ju,pa,ro},t{es,un,no,vo,ma},r{mi,ti,er,pa,ju,du,cu},rez,caz,lav,nev,c{se,to,pi,sa},bañ,soñ,tap,d{na,mu,du,an},gui,cri,odi,baj,fij,dej,cen,son,gan,tom,fum,hel,vol,s{pa,ca,pe,be,ce},cre,ech,rob},i{bat,abr,her,mor,teñ,reñ,ped,med,viv,reg,dec,ven,sal,sub},freí}|8:r{e{c{desha,e{obed,aman,apar,flor}},promet,nd{e{apr,ent,ext,enc,def,dep},esco},n{nte{co,ma},propo,compo},olv{dev,res},proteg},a{castig,entreg,conjug,t{detes,moles,n{e{inv,cal,int,aum,lam},enca,leva,agua},explo,por{so,re,ex,im},sul{in,re},respe},r{enamo,explo,spi{su,re},prepa,decla,censu,inmig,ilust,celeb},z{trope,reali,utili,bauti,almor,recha,amena,comen,alcan},reserv,cultiv,c{provo,i{plat,mast,crit,repl,expl,publ,fabr}},record,merend,convid,i{c{nego,apre,anun,ensu},estud},trabaj,n{gober,conde,perdo,i{elim,term,adiv,fasc}},inform,enferm,lastim,l{cepil,recic,cance,insta,arreg,alqui,calcu},es{regr,expr,conf},regate,chisme,escuch,planch,efectu,triunf},i{destru,t{derre,compe,permi,insis,ver{in,ad,di},comba},prefer,requer,desped,aplaud,m{pri{im,de},consu},correg,c{du{con,pro,tra},bende,prede},conven,escrib,prohib}},rse{opone,a{junt,sent,jact,qued,call,hall,burl,quem,llam,calm,duch,cans,pein,enoj,quej},dormi,senti,vesti}|7:r{e{c{rena,e{pad,par,ofr,mer},cono,ejer},suced,atend,ofend,n{obte,dete,supo,expo},cog{es,re}},a{oblig,naveg,t{apos,acos,asus,alen,plan,i{vis,vom,afe,inv},abor,acor,acep,apre},r{devo,deco,admi,aspi,comp,ahor,repa,madu,emig,aleg,most,espe,queb},empez,abraz,avanz,renov,c{colo,invo,apli,dedi,indi,acer,ahor},engañ,enseñ,diseñ,acamp,d{agra,enfa,abor,acor,guar,salu,brin,here,olvi},i{esqu,asoc,inic,limp,aliv,conf},manej,arroj,dibuj,n{ador,cami,coci,pati},afirm,estim,l{bril,mezc,char,anhe,reve,rega,seña,regu},rehus,repas,emple,evacu,gradu,aprob},i{inclu,influ,repet,admit,asist,suger,aburr,ocurr,sacud,invad,decid,aflig,dirig,duc{in,re},cumpl,exhib,recib},sonreí},rse{move,pone,a{neg,sec,mud,cri,ech,cas,bañ,lav}}|10:r{e{c{satisfa,e{perten,perman,establ,fortal,enriqu}},prend{com,sor},entreten},a{investig,conquist,simboliz,ific{sign,clar,glor,sacr,cruc,clas},particip,desagrad,recomend,contamin,matricul},i{u{constit,disting,trib{dis,con}},sobreviv,introduc}},rse{esconde,a{enamor,prepar,bronce,levant,calent,enferm},diverti}|9:r{e{c{agrade,aconte,enveje,recono,conven},descend,respond},a{t{protes,contes,disgus,pregun,presen,necesi,deposi,felici,desper,disfru},tr{regis,demos,encon},iz{satir,legal,civil,organ,colon},serv{pre,con},c{equivo,i{pract,if{mod,ver,pur},comun},confis},acompañ,renunci,divorci,aconsej,abandon,funcion,desayun,confirm,maquill,control,s{descan,atrave,intere,conver},continu,averigu},i{u{constr,sustit,dismin,g{se{per,con,pro},extin}},t{sen{con,pre},consis,compar,conver},descubr,describ}},rse{atreve,detene,a{enter,quebr,alegr,afeit,acost,asust,dedic,acerc,acord,enfad,olvid,gradu},decidi,aburri}|12:desagradecer,caracterizar,rse{enriquece,matricula,arrepenti}|11:r{ece{desapar,enflaqu},a{entrevist,interpret,acostumbr,generaliz,entusiasm,desarroll,emborrach}},rse{envejece,a{registr,pregunt,despert,equivoc,comunic,maquill,divorci},zambulli}|6:r{e{crec,torc,venc,romp,vend,perd,opon,barr,corr,quer,volv,prev,llov,atra},a{g{lle,col,apa,tra,car},t{cos,gus,gas,n{pi,ju,se,co,mo},gri,evi,tra,cor,fal,sal},r{ago,llo,ado,bor,cer,lad,log,ent,cob},cruz,lanz,salv,llev,c{cho,ubi,mar,bus,pes,ata,edu},culp,d{bor,tar,ayu,man,que,cui},i{vac,var,cop,env},viaj,enoj,llen,pein,rein,m{fir,for,lla,cal,que},l{hal,cal,bur,bai,hab,dob,vio},s{cau,abu,can,pen,avi},buce,pele,dese,uch{l,d},actu,situ,prob,acab,apoy},i{segu,ment,sent,vest,sufr,cubr,gruñ,añad,erv{s,h},dorm,g{ele,exi,fin,sur}}}|4:r{lee,ole,cae,ama,usa,hui,uni,reí},irse|3:r{ve,se,da,oí}|2:ir|13:rse{enflaquece,a{acostumbr,desarroll,entusiasm,emborrach}}~5:yacer~~",
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
      'FirstPerson': (s) => convert(s, presentRev.first),
      'SecondPerson': (s) => convert(s, presentRev.second),
      'ThirdPerson': (s) => convert(s, presentRev.third),
      'FirstPersonPlural': (s) => convert(s, presentRev.firstPlural),
      'SecondPersonPlural': (s) => convert(s, presentRev.secondPlural),
      'ThirdPersonPlural': (s) => convert(s, presentRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromPast = (str, form) => {
    const forms = {
      'FirstPerson': (s) => convert(s, pastRev.first),
      'SecondPerson': (s) => convert(s, pastRev.second),
      'ThirdPerson': (s) => convert(s, pastRev.third),
      'FirstPersonPlural': (s) => convert(s, pastRev.firstPlural),
      'SecondPersonPlural': (s) => convert(s, pastRev.secondPlural),
      'ThirdPersonPlural': (s) => convert(s, pastRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromImperfect = (str, form) => {
    const forms = {
      'FirstPerson': (s) => convert(s, imperfectRev.first),
      'SecondPerson': (s) => convert(s, imperfectRev.second),
      'ThirdPerson': (s) => convert(s, imperfectRev.third),
      'FirstPersonPlural': (s) => convert(s, imperfectRev.firstPlural),
      'SecondPersonPlural': (s) => convert(s, imperfectRev.secondPlural),
      'ThirdPersonPlural': (s) => convert(s, imperfectRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    // person-ambiguous forms ('hablaba' is 1st or 3rd) - try third-person
    return convert(str, imperfectRev.third)
  };

  const fromFuture = (str, form) => {
    const forms = {
      'FirstPerson': (s) => convert(s, futureRev.first),
      'SecondPerson': (s) => convert(s, futureRev.second),
      'ThirdPerson': (s) => convert(s, futureRev.third),
      'FirstPersonPlural': (s) => convert(s, futureRev.firstPlural),
      'SecondPersonPlural': (s) => convert(s, futureRev.secondPlural),
      'ThirdPersonPlural': (s) => convert(s, futureRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromConditional = (str, form) => {
    const forms = {
      'FirstPerson': (s) => convert(s, conditionalRev.first),
      'SecondPerson': (s) => convert(s, conditionalRev.second),
      'ThirdPerson': (s) => convert(s, conditionalRev.third),
      'FirstPersonPlural': (s) => convert(s, conditionalRev.firstPlural),
      'SecondPersonPlural': (s) => convert(s, conditionalRev.secondPlural),
      'ThirdPersonPlural': (s) => convert(s, conditionalRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return stripReflexive$2(str)
  };

  const fromSubjunctive = (str, form) => {
    const forms = {
      'FirstPerson': (s) => convert(s, subjunctRev.first),
      'SecondPerson': (s) => convert(s, subjunctRev.second),
      'ThirdPerson': (s) => convert(s, subjunctRev.third),
      'FirstPersonPlural': (s) => convert(s, subjunctRev.firstPlural),
      'SecondPersonPlural': (s) => convert(s, subjunctRev.secondPlural),
      'ThirdPersonPlural': (s) => convert(s, subjunctRev.thirdPlural),
    };
    if (forms.hasOwnProperty(form)) {
      return forms[form](str)
    }
    return str
  };

  const fromImperative = (str, form) => {
    const forms = {
      'FirstPerson': (s) => convert(s, imperativeRev.first),
      'SecondPerson': (s) => convert(s, imperativeRev.second),
      'ThirdPerson': (s) => convert(s, imperativeRev.third),
      'FirstPersonPlural': (s) => convert(s, imperativeRev.firstPlural),
      'SecondPersonPlural': (s) => convert(s, imperativeRev.secondPlural),
      'ThirdPersonPlural': (s) => convert(s, imperativeRev.thirdPlural),
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
      not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
    },
    Singular: {
      is: 'Noun',
      not: ['Plural'],
    },
    ProperNoun: {
      is: 'Noun',
    },
    Person: {
      is: 'Singular',
      also: ['ProperNoun'],
      not: ['Place', 'Organization', 'Date'],
    },
    FirstName: {
      is: 'Person',
    },
    MaleName: {
      is: 'FirstName',
      not: ['FemaleName', 'LastName'],
    },
    FemaleName: {
      is: 'FirstName',
      not: ['MaleName', 'LastName'],
    },
    LastName: {
      is: 'Person',
      not: ['FirstName'],
    },
    Honorific: {
      is: 'Noun',
      not: ['FirstName', 'LastName', 'Value'],
    },
    Place: {
      is: 'Singular',
      not: ['Person', 'Organization'],
    },
    Country: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['City'],
    },
    City: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['Country'],
    },
    Region: {
      is: 'Place',
      also: ['ProperNoun'],
    },
    Address: {
      // is: 'Place',
    },
    Organization: {
      is: 'ProperNoun',
      not: ['Person', 'Place'],
    },
    SportsTeam: {
      is: 'Organization',
    },
    School: {
      is: 'Organization',
    },
    Company: {
      is: 'Organization',
    },
    Plural: {
      is: 'Noun',
      not: ['Singular'],
    },
    Uncountable: {
      is: 'Noun',
    },
    Pronoun: {
      is: 'Noun',
      not: entity,
    },
    Actor: {
      is: 'Noun',
      not: entity,
    },
    Activity: {
      is: 'Noun',
      not: ['Person', 'Place'],
    },
    Unit: {
      is: 'Noun',
      not: entity,
    },
    Demonym: {
      is: 'Noun',
      also: ['ProperNoun'],
      not: entity,
    },
    // a feature-tag - applies to determiners ('mi casa') and pronouns ('es mío')
    Possessive: {},

    FemaleNoun: {
      is: 'Noun',
      not: ['MaleNoun']
    },
    MaleNoun: {
      is: 'Noun',
      not: ['FemaleNoun']
    },

  };

  var verbs$1 = {
    Verb: {
      not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
    },
    PresentTense: {
      is: 'Verb',
      not: ['PastTense'],
    },
    // non-finite - 'hablar' is not a present-tense form in spanish
    Infinitive: {
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'FutureTense', 'Gerund'],
    },
    // non-finite - 'hablando'
    Gerund: {
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'FutureTense', 'Copula'],
    },
    PastTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'FutureTense'],
    },
    // pretérito imperfecto - 'hablaba'
    Imperfect: {
      is: 'PastTense',
      not: ['Conditional'],
    },
    FutureTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'PastTense'],
    },
    Copula: {
      is: 'Verb',
    },
    // a feature-tag - 'no', 'nunca' are not verbs
    Negative: {},
    Modal: {
      is: 'Verb',
      not: ['Infinitive'],
    },
    PerfectTense: {
      is: 'Verb',
      not: ['Gerund'],
    },
    Pluperfect: {
      is: 'Verb',
    },
    Participle: {
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
      is: 'Verb',
      not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
    },
    Conditional: {
      is: 'Verb',
      not: ['Infinitive', 'Imperative'],
    },
    Reflexive: {
      is: 'Verb',
    },
    // sometimes 'pretérito'
    Perfecto: {
      is: 'Verb',
    },
    // moods
    Imperative: {
      is: 'Verb',
      not: ['Subjunctive']
    },
    Subjunctive: {
      is: 'Verb',
      not: ['Imperative']
    },


    // 
    FirstPerson: {
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPerson: {
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPerson: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    FirstPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
    },
  };

  var values = {
    Value: {
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
      is: 'Value',
      not: ['Noun'],
    },
    Multiple: {
      is: 'Value',
    },
    RomanNumeral: {
      is: 'Cardinal',
      not: ['TextValue'],
    },
    TextValue: {
      is: 'Value',
      not: ['NumericValue'],
    },
    NumericValue: {
      is: 'Value',
      not: ['TextValue'],
    },
    Money: {
      is: 'Cardinal',
    },
    Percent: {
      is: 'Value',
    },
  };

  var dates = {
    Date: {
      not: ['Verb', 'Adverb', 'Adjective'],
    },
    Month: {
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      is: 'Noun',
      also: ['Date'],
    },
    Year: {
      is: 'Date',
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      is: 'Date',
      not: 'Fraction',
    },
    // 'easter'
    Holiday: {
      is: 'Date',
      also: ['Noun'],
    },
    // 'summer'
    Season: {
      is: 'Date',
    },
    Timezone: {
      is: 'Noun',
      also: ['Date'],
      not: ['ProperNoun'],
    },
    Time: {
      is: 'Date',
      not: ['AtMention'],
    },
    // 'months'
    Duration: {
      is: 'Noun',
      also: ['Date'],
    },
  };

  const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];

  var misc = {
    Adjective: {
      not: ['Noun', 'Verb', 'Adverb', 'Value'],
    },
    FemaleAdjective: {
      is: 'Adjective',
      not: ['MaleAdjective'],
    },
    MaleAdjective: {
      is: 'Adjective',
      not: ['FemaleAdjective'],
    },
    PluralAdjective: {
      is: 'Adjective',
      not: ['SingularAdjective'],
    },
    SingularAdjective: {
      is: 'Adjective',
      not: ['PluralAdjective'],
    },
    Comparable: {
      is: 'Adjective',
    },
    Comparative: {
      is: 'Adjective',
    },
    Superlative: {
      is: 'Adjective',
      not: ['Comparative'],
    },
    NumberRange: {},
    Adverb: {
      not: ['Noun', 'Verb', 'Adjective', 'Value'],
    },

    Determiner: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
    },
    Conjunction: {
      not: anything,
    },
    Preposition: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      not: ['Determiner'],
    },
    Currency: {
      is: 'Noun',
    },
    Expression: {
      not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
    },
    Abbreviation: {},
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {},
    AtMention: {
      is: 'Noun',
      not: ['HashTag', 'Email'],
    },
    Emoji: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Emoticon: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Email: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Acronym: {
      not: ['Plural', 'RomanNumeral'],
    },
    Condition: {
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

  var version = '0.3.1';

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
