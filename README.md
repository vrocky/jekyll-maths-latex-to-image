# Jekyll Maths LaTeX to Image

A complete solution for rendering LaTeX mathematical expressions in Jekyll sites as SVG/PNG images, ensuring consistent display across all platforms and browsers.

## System Requirements

- Ruby >= 2.5.0
- Node.js >= 14.0.0
- LaTeX installation (TeXLive recommended)

## Installation

This project consists of two packages that work together:
1. A Ruby gem (Jekyll plugin)
2. A Node.js support package

### 1. Install the Node.js Support Package

First, install the Node.js package globally:

```bash
npm install -g jeykll-maths-latex-to-image-node-support
```

Verify the installation:
```bash
jekyll-maths-tex2svg --version
```

### 2. Install the Jekyll Plugin

Add to your Jekyll site's `Gemfile`:

```ruby
gem 'jekyll-maths-latex-to-image'
```

Then add to your `_config.yml`:

```yaml
plugins:
  - jekyll-maths-latex-to-image

texsvg_math_renderer:
  path: /assets/img/math  # Path for generated images
  format: both           # 'svg', 'png', or 'both'
```

Install the gem:

```bash
bundle install
```

## Usage

1. Start using LaTeX math in your Markdown files:

   ```markdown
   Inline math: $E = mc^2$
   
   Display math:
   $$
   \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
   $$
   ```

2. Build your Jekyll site:

   ```bash
   bundle exec jekyll build
   ```

   or serve locally:

   ```bash
   bundle exec jekyll serve
   ```

The plugin will automatically:
- Convert LaTeX expressions to SVG/PNG
- Cache the generated images
- Replace LaTeX with image tags in the HTML output

## Troubleshooting

If you encounter issues:

1. Verify both packages are installed:
   ```bash
   gem list jekyll-maths-latex-to-image
   npm list -g jeykll-maths-latex-to-image-node-support
   ```

2. Check LaTeX installation:
   ```bash
   tex --version
   ```

3. Ensure write permissions for the image output directory

## License

MIT License - see LICENSE file for details.
