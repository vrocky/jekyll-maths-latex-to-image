# Jekyll Maths LaTeX to Image

A Jekyll plugin that converts LaTeX mathematical expressions to SVG/PNG images, providing better compatibility across different platforms and browsers.

## Installation

Add this line to your Jekyll site's `Gemfile`:

```ruby
gem 'jekyll-maths-latex-to-image'
```

And add this line to your Jekyll site's `_config.yml`:

```yaml
plugins:
  - jekyll-maths-latex-to-image

# Optional configuration
texsvg_math_renderer:
  path: /assets/img/math  # Default path for generated images
  format: both           # Options: 'svg', 'png', or 'both'
```

And then execute:

```bash
$ bundle install
```

## Usage

Once installed, you can use LaTeX math expressions in your Markdown files:

### Inline Math

Use single dollar signs for inline math:

```markdown
The formula $E = mc^2$ is Einstein's famous equation.
```

### Display Math

Use double dollar signs for display (block) math:

```markdown
The quadratic formula is:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```

### Advanced Examples

1. **Matrix**:
```markdown
$$
\begin{matrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{matrix}
$$
```

2. **Chemical Equations**:
```markdown
$$\ce{CO2 + H2O -> H2CO3}$$
```

3. **Complex Mathematical Expressions**:
```markdown
$$
\int_0^\infty \frac{x^3}{e^x-1}\,dx = \frac{\pi^4}{15}
$$
```

## Configuration Options

In your `_config.yml`:

```yaml
texsvg_math_renderer:
  path: /assets/img/math  # Custom path for generated images
  format: both           # 'svg', 'png', or 'both'
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
