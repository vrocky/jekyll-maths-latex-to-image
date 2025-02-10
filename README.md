# Jekyll Maths LaTeX to Image Project

Convert LaTeX mathematical expressions to images in Jekyll sites with high-quality rendering and excellent browser compatibility.

## Project Structure

This repository contains two main components:

1. **jekyll-maths-latex-to-image**: A Ruby gem that integrates with Jekyll
2. **jeykll-maths-latex-renderer-support**: A Node.js package that handles the actual LaTeX rendering

## Quick Start

### 1. Install Prerequisites

```bash
# Install LaTeX
sudo apt-get install texlive texlive-latex-extra

# Install Node.js dependencies
cd jeykll-maths-latex-renderer-support
npm install
```

### 2. Install the Jekyll Plugin

Add to your Jekyll site's Gemfile:
```ruby
gem 'jekyll-maths-latex-to-image'
```

### 3. Configure

In `_config.yml`:
```yaml
plugins:
  - jekyll-maths-latex-to-image

texsvg_math_renderer:
  path: /assets/img/math
  format: both
```

## Development

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/vrocky/jekyll-maths-latex-to-image
cd jekyll-maths-latex-to-image

# Install Node.js dependencies
cd jeykll-maths-latex-renderer-support
npm install

# Install Ruby dependencies
cd ../jekyll-maths-latex-to-image
bundle install
```

### Running Tests

```bash
# Node.js tests
cd jeykll-maths-latex-renderer-support
npm test

# Ruby tests
cd ../jekyll-maths-latex-to-image
bundle exec rspec
```

## Contributing

Contributions are welcome! Please check out our [Contributing Guide](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) for details.

## Documentation

- [Jekyll Plugin Documentation](jekyll-maths-latex-to-image/README.md)
- [Node.js Support Package Documentation](jeykll-maths-latex-renderer-support/README.md)
