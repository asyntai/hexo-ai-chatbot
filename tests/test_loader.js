'use strict';

/**
 * Offline tests for hexo-ai-chatbot.
 *
 * These test the option handling and the injected tag on their own, without a
 * Hexo install, so a mistake shows up in a second.
 *
 * Run: node plugins/hexo/tests/test_loader.js
 */

const assert = require('assert');
const vm = require('vm');
const {
  DEFAULT_SCRIPT_URL,
  buildLoader,
  buildSnippet,
  isActive,
  validateOptions,
} = require('../lib/loader');

const passed = [];
const failed = [];

function check(name, fn) {
  try {
    fn();
    passed.push(name);
    console.log('  PASS  ' + name);
  } catch (err) {
    failed.push(name);
    console.log('  FAIL  ' + name + '  -> ' + err.message);
  }
}

function snippet(options) {
  return buildSnippet(validateOptions(options));
}

console.log('\nOptions');

check('a valid widget_id is accepted', () => {
  assert.strictEqual(
    validateOptions({ widget_id: 'asyntai_1a2b3c4d5e6f' }).widgetId,
    'asyntai_1a2b3c4d5e6f',
  );
});

check('camelCase widgetId is accepted too', () => {
  assert.strictEqual(
    validateOptions({ widgetId: 'asyntai_1a2b3c4d5e6f' }).widgetId,
    'asyntai_1a2b3c4d5e6f',
  );
});

check('surrounding spaces are trimmed', () => {
  assert.strictEqual(
    validateOptions({ widget_id: '  asyntai_1a2b3c4d5e6f  ' }).widgetId,
    'asyntai_1a2b3c4d5e6f',
  );
});

check('no asyntai block at all stops the build', () => {
  assert.throws(() => validateOptions(undefined), /widget_id" is required/);
});

check('an empty asyntai block (null in YAML) stops the build', () => {
  assert.throws(() => validateOptions(null), /widget_id" is required/);
});

check('a missing widget_id stops the build', () => {
  assert.throws(() => validateOptions({}), /widget_id" is required/);
});

check('an empty widget_id stops the build', () => {
  assert.throws(() => validateOptions({ widget_id: '   ' }), /widget_id" is required/);
});

check('the message says where the setting goes', () => {
  assert.throws(() => validateOptions({}), /under "asyntai:" in _config\.yml/);
});

check('a number from YAML stops the build', () => {
  assert.throws(() => validateOptions({ widget_id: 12345 }), /widget_id" is required/);
});

check('a widget ID without the prefix stops the build', () => {
  assert.throws(
    () => validateOptions({ widget_id: '1a2b3c4d5e6f' }),
    /does not look like a widget ID/,
  );
});

check('a widget ID with a quote in it stops the build', () => {
  assert.throws(
    () => validateOptions({ widget_id: 'asyntai_a"b' }),
    /does not look like a widget ID/,
  );
});

check('a widget ID with a tag in it stops the build', () => {
  assert.throws(
    () => validateOptions({ widget_id: 'asyntai_a</script>' }),
    /does not look like a widget ID/,
  );
});

check('the default script URL is the Asyntai CDN', () => {
  assert.strictEqual(
    validateOptions({ widget_id: 'asyntai_x1' }).scriptUrl,
    DEFAULT_SCRIPT_URL,
  );
});

check('script_url overrides the default', () => {
  assert.strictEqual(
    validateOptions({ widget_id: 'asyntai_x1', script_url: 'https://example.com/w.js' }).scriptUrl,
    'https://example.com/w.js',
  );
});

check('an empty script_url falls back to the default', () => {
  assert.strictEqual(
    validateOptions({ widget_id: 'asyntai_x1', script_url: '  ' }).scriptUrl,
    DEFAULT_SCRIPT_URL,
  );
});

console.log('\nhexo server');

check('the widget is on during hexo generate', () => {
  assert.strictEqual(isActive(validateOptions({ widget_id: 'asyntai_x1' }), 'generate'), true);
});

check('the widget is on during hexo server by default', () => {
  assert.strictEqual(isActive(validateOptions({ widget_id: 'asyntai_x1' }), 'server'), true);
});

check('enable_in_server: false keeps it off during hexo server', () => {
  const s = validateOptions({ widget_id: 'asyntai_x1', enable_in_server: false });
  assert.strictEqual(isActive(s, 'server'), false);
  assert.strictEqual(isActive(s, 's'), false);
  assert.strictEqual(isActive(s, 'serv'), false);
});

check('enable_in_server: false still builds it into hexo generate', () => {
  const s = validateOptions({ widget_id: 'asyntai_x1', enable_in_server: false });
  assert.strictEqual(isActive(s, 'generate'), true);
  assert.strictEqual(isActive(s, 'g'), true);
  assert.strictEqual(isActive(s, 'deploy'), true);
});

console.log('\nThe injected tag');

check('the tag carries the widget ID and the CDN URL', () => {
  const html = snippet({ widget_id: 'asyntai_1a2b3c4d5e6f' });
  assert.ok(html.includes('"asyntai_1a2b3c4d5e6f"'));
  assert.ok(html.includes(DEFAULT_SCRIPT_URL));
});

check('the tag is one inline script with an id', () => {
  const html = snippet({ widget_id: 'asyntai_x1' });
  assert.ok(html.startsWith('<script id="asyntai-loader">'));
  assert.ok(html.endsWith('</script>'));
  assert.strictEqual(html.split('</script>').length, 2);
});

check('a script_url with </script> cannot close the tag early', () => {
  const html = snippet({ widget_id: 'asyntai_x1', script_url: 'https://e.com/</script><b>' });
  assert.strictEqual(html.split('</script>').length, 2);
});

check('the loader is valid JavaScript', () => {
  new vm.Script(buildLoader('asyntai_x1', DEFAULT_SCRIPT_URL));
});

// A tiny fake page: enough DOM for the loader to run.
function fakePage(readyState) {
  const added = [];
  const listeners = {};
  const existing = [];
  const document = {
    readyState,
    querySelector: (sel) => (sel === 'script[data-asyntai-id]' && existing.length ? existing[0] : null),
    createElement: () => {
      const el = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
      return el;
    },
    head: { appendChild: (el) => { added.push(el); existing.push(el); } },
  };
  const window = { addEventListener: (ev, fn) => { listeners[ev] = fn; } };
  return { document, window, added, listeners };
}

check('the loader waits for the load event', () => {
  const page = fakePage('loading');
  vm.runInNewContext(buildLoader('asyntai_x1', DEFAULT_SCRIPT_URL), page);
  assert.strictEqual(page.added.length, 0);
  page.listeners.load();
  assert.strictEqual(page.added.length, 1);
  assert.strictEqual(page.added[0].src, DEFAULT_SCRIPT_URL);
  assert.strictEqual(page.added[0].attrs['data-asyntai-id'], 'asyntai_x1');
  assert.strictEqual(page.added[0].async, true);
});

check('the loader runs at once when the page already loaded', () => {
  const page = fakePage('complete');
  vm.runInNewContext(buildLoader('asyntai_x1', DEFAULT_SCRIPT_URL), page);
  assert.strictEqual(page.added.length, 1);
});

check('the loader never adds a second widget', () => {
  const page = fakePage('complete');
  const code = buildLoader('asyntai_x1', DEFAULT_SCRIPT_URL);
  vm.runInNewContext(code, page);
  vm.runInNewContext(code, page);
  assert.strictEqual(page.added.length, 1);
});

console.log('\n' + passed.length + ' passed, ' + failed.length + ' failed\n');
process.exit(failed.length ? 1 : 0);
