require_relative 'lib/jekyll-maths-latex-to-image/version'

Gem::Specification.new do |spec|
  spec.name          = "jekyll-maths-latex-to-image"
  spec.version       = Jekyll::MathsLatexToImage::VERSION
  spec.authors       = ["vrocky"]
  spec.email         = [""]
  spec.summary       = "Jekyll plugin to convert LaTeX math expressions to images"
  spec.description   = "A Jekyll plugin that converts LaTeX mathematical expressions to PNG images for better compatibility and improved rendering across different platforms"
  spec.homepage      = "https://github.com/vrocky/jekyll-maths-latex-to-image"
  spec.license       = "MIT"

  spec.metadata = {
    "bug_tracker_uri"   => "https://github.com/vrocky/jekyll-maths-latex-to-image/issues",
    "changelog_uri"     => "https://github.com/vrocky/jekyll-maths-latex-to-image/blob/main/CHANGELOG.md",
    "documentation_uri" => "https://github.com/vrocky/jekyll-maths-latex-to-image#readme",
    "source_code_uri"   => "https://github.com/vrocky/jekyll-maths-latex-to-image"
  }

  spec.files         = Dir.glob("{lib}/**/*")
  spec.require_paths = ["lib"]

  spec.required_ruby_version = ">= 2.5.0"

  spec.add_runtime_dependency "mutex_m"
  spec.add_runtime_dependency "jekyll", ">= 3.0", "< 5.0"
  spec.add_runtime_dependency "parallel"
  spec.add_runtime_dependency "jimson"
  spec.add_runtime_dependency "json"
  spec.add_development_dependency "bundler"
  spec.add_development_dependency "rake"
  spec.add_development_dependency "rspec"
end
