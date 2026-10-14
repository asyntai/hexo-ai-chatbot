/* global hexo */
'use strict';

/**
 * Asyntai AI chatbot for Hexo.
 *
 * Adds the Asyntai chat widget to every page of the site. Hexo loads this file
 * because the package name starts with "hexo-". The settings come from the
 * "asyntai:" block in the site's _config.yml, which Hexo reads before it loads
 * plugins.
 */

const { buildSnippet, isActive, validateOptions } = require('./lib/loader');

let settings;
try {
  settings = validateOptions(hexo.config.asyntai);
} catch (err) {
  // An error thrown here only becomes "Plugin load failed" and Hexo carries on,
  // so the site would build with no chat on it. Throw it again from the first
  // step of the build instead: then `hexo generate` stops with our message.
  hexo.extend.filter.register('before_generate', () => {
    throw err;
  });
}

if (settings && isActive(settings, hexo.env.cmd)) {
  hexo.extend.injector.register('body_end', buildSnippet(settings), 'default');
}
