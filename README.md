# hexo-ai-chatbot

Add the [Asyntai](https://asyntai.com) AI chat assistant to your Hexo site. It
answers visitor questions from your own content, in more than 80 languages.

## Install

```bash
npm install hexo-ai-chatbot
```

Hexo loads the plugin by itself. Then add your widget ID at the end of the
site's `_config.yml`:

```yaml
asyntai:
  widget_id: asyntai_1a2b3c4d5e6f
```

Run `hexo clean && hexo generate`. The chat bubble is on every page.

## Where the widget ID comes from

Open the Install page in your [Asyntai dashboard](https://asyntai.com/dashboard).
The widget ID is the value of `data-asyntai-id` in the snippet shown there. It
starts with `asyntai_`.

Creating an account is free, and the Free plan is enough to try the widget.

## Options

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `widget_id` | string | required | Your Asyntai widget ID |
| `enable_in_server` | boolean | `true` | Set to `false` to keep the widget off the site during `hexo server` |
| `script_url` | string | the Asyntai CDN | Advanced. Load the widget from another URL |

A missing or malformed `widget_id` stops `hexo generate` with a message that
says how to fix it.

## What the plugin does

- It uses the Hexo injector to add the Asyntai loader just before `</body>` on
  every page: posts, pages, archives, categories and tags.
- It works with every Hexo theme.
- The loader waits for the page's `load` event, so your own content always
  renders first.

## Answering from your content

Asyntai reads your published pages. Add your site URL in the dashboard, and the
assistant answers from the same posts and pages the widget sits on. You can
also add extra documents and question and answer pairs.

## Hexo versions

Hexo 5 and later. Tested on Hexo 8.

## Removing it

Run `npm uninstall hexo-ai-chatbot`, delete the `asyntai` block from
`_config.yml`, and generate the site again. The widget is gone.

## Support

Email [hello@asyntai.com](mailto:hello@asyntai.com), or read the
[Hexo guide](https://asyntai.com/documentation/integrations/hexo/).

## Licence

MIT. See [LICENSE](LICENSE).
