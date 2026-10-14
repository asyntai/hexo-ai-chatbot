'use strict';

/**
 * Option handling and the embed snippet for hexo-ai-chatbot.
 *
 * This file has no dependencies, so the tests run it on its own, without a
 * Hexo install.
 */

const DEFAULT_SCRIPT_URL = 'https://widget.asyntai.com/static/js/chat-widget.js';
const NAME = 'hexo-ai-chatbot';

const WIDGET_ID_PATTERN = /^asyntai_[A-Za-z0-9]+$/;

// Hexo users write snake_case in _config.yml, but camelCase is accepted too.
function pick(opts, snake, camel) {
  if (opts[snake] !== undefined) return opts[snake];
  return opts[camel];
}

/**
 * Hexo runs this before it generates any page, so a wrong option stops the
 * build with a clear message instead of producing a site with no chat on it.
 */
function validateOptions(options) {
  const opts = options && typeof options === 'object' ? options : {};
  const rawId = pick(opts, 'widget_id', 'widgetId');
  const widgetId = typeof rawId === 'string' ? rawId.trim() : '';

  if (!widgetId) {
    throw new Error(
      NAME +
        ': "widget_id" is required. Add it under "asyntai:" in _config.yml. ' +
        'Copy it from the Install page of your Asyntai dashboard, for example ' +
        'asyntai_1a2b3c4d5e6f.',
    );
  }
  if (!WIDGET_ID_PATTERN.test(widgetId)) {
    throw new Error(
      NAME +
        ': "' +
        widgetId +
        '" does not look like a widget ID. It starts with asyntai_, for ' +
        'example asyntai_1a2b3c4d5e6f.',
    );
  }

  const rawUrl = pick(opts, 'script_url', 'scriptUrl');
  const scriptUrl =
    typeof rawUrl === 'string' && rawUrl.trim() ? rawUrl.trim() : DEFAULT_SCRIPT_URL;

  return {
    widgetId,
    scriptUrl,
    // Set to false to keep the widget off the site during `hexo server`.
    enableInServer: pick(opts, 'enable_in_server', 'enableInServer') !== false,
  };
}

/**
 * The loader waits for the page's load event before it fetches the widget.
 * An ordinary `<script async src>` holds the load event open until its own
 * fetch finishes, so an unreachable server would delay the host page. This
 * pattern cannot.
 */
function buildLoader(widgetId, scriptUrl) {
  return (
    '(function(){var l=function(){' +
    'if(document.querySelector("script[data-asyntai-id]"))return;' +
    'var s=document.createElement("script");' +
    's.src=' +
    JSON.stringify(scriptUrl) +
    ';s.async=true;' +
    's.setAttribute("data-asyntai-id",' +
    JSON.stringify(widgetId) +
    ');' +
    'document.head.appendChild(s)};' +
    'if(document.readyState==="complete"){l()}' +
    'else{window.addEventListener("load",l)}})();'
  );
}

/** The tag Hexo injects before </body> on every page. */
function buildSnippet(settings) {
  // "</" cannot appear inside the inline script; JSON.stringify leaves "/"
  // alone, so escape it to keep a hostile script_url from closing the tag.
  const code = buildLoader(settings.widgetId, settings.scriptUrl).replace(/<\//g, '<\\/');
  return '<script id="asyntai-loader">' + code + '</script>';
}

/** True when the widget belongs on the pages of this Hexo command. */
function isActive(settings, cmd) {
  // Hexo accepts any prefix of a command ("s", "serv", "server"), and "server"
  // is the only Hexo command that starts with "s".
  const serving = typeof cmd === 'string' && /^s/.test(cmd);
  return !(serving && !settings.enableInServer);
}

module.exports = {
  DEFAULT_SCRIPT_URL,
  NAME,
  buildLoader,
  buildSnippet,
  isActive,
  validateOptions,
};
