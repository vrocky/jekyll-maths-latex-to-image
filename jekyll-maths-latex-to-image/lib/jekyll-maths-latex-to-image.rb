require 'net/http'
require 'json'
require 'parallel'
require 'logger'
require 'digest'
require 'fileutils'
require 'open3'
require 'jimson'
begin
  require 'mutex_m'
rescue LoadError
  # For Ruby 3.4+ where mutex_m is not a default gem
  gem 'mutex_m'
  require 'mutex_m'
end

class NodeRendererClient
  include Mutex_m  # Mix in mutex capabilities
  
  def initialize(logger)
    super()  # Initialize mutex
    @logger = logger
    @request_id = 0
    start_renderer
  rescue => e
    @logger.error("Failed to initialize renderer: #{e.message}")
    @logger.error(e.backtrace.join("\n"))
    raise
  end

  def start_renderer
    user_dir = Dir.pwd # Get user's current working directory
    node_path = File.join(user_dir, 'node_modules')
    
    # Set environment with node_path
    env = ENV.to_h.merge({
      'NODE_PATH' => node_path
    })
    
    @logger.info("Node renderer NODE_PATH: #{node_path}")
    @logger.info("Node renderer working directory: #{user_dir}")
    
    # Use npx with updated command name
    command = "npx jekyll-maths-tex2svg"
    
    # Capture stderr separately for better error logging
    @stdin, @stdout, @stderr, @wait_thr = Open3.popen3(env, command, chdir: user_dir)
    
    # Rest of the start_renderer method remains the same
    @stderr_thread = Thread.new do
      while line = @stderr.gets
        @logger.error("Node renderer stderr: #{line.strip}")
      end
    end

    # Verify the renderer is working
    begin
      response = send_request('ping', nil)
      unless response['result'] == 'pong'
        raise "Renderer verification failed: #{response.inspect}"
      end
      @logger.info("Node renderer verified and ready")
    rescue => e
      @logger.error("Renderer startup failed: #{e.message}")
      cleanup
      raise
    end
  rescue => e
    @logger.error("Failed to verify renderer connection: #{e.message}")
    cleanup
    raise
  end

  def get_svg(latex, display_mode: false, options: {})
    synchronize do  # Synchronize the entire request-response cycle
      params = {
        latex: latex.strip,
        display: display_mode,
        svgOptions: {
          width: 'auto',
          ex: 6,
          em: 6,
          containerWidth: display_mode ? 600 : 300
        }.merge(options)
      }

      response = send_request('renderMath', params)
      
      if response['error']
        raise "Render error: #{response['error']['message']}"
      end

      if response['result'] && response['result']['svg']
        Base64.decode64(response['result']['svg'])
      else
        raise "Invalid response format"
      end
    end
  end

  def cleanup
    @stdin&.close
    @stdout&.close
    @stderr&.close
    @stderr_thread&.kill
    @stderr_thread&.join
    Process.kill('TERM', @wait_thr.pid) if @wait_thr&.pid
    @wait_thr&.join
  rescue => e
    @logger.error("Error during cleanup: #{e.message}")
  end

  private

  def send_request(method, params)
    request = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: next_request_id
    }

    @logger.debug("→ #{method}: #{params.inspect}")
    @stdin.puts(request.to_json)
    @stdin.flush

    response = @stdout.gets
    raise "No response from renderer" if response.nil?

    parsed = JSON.parse(response)
    @logger.debug("← #{parsed.inspect}")

    if parsed['error']
      error = parsed['error']
      @logger.error("Render error (#{error['code']}): #{error['message']}")
      if error['data']
        @logger.error("Stack trace: #{error['data']}")
      end
    end

    parsed
  end

  def next_request_id
    @request_id += 1
    "req_#{@request_id}"
  end
end

module Jekyll
  module MathsLatexToImage
    class Generator < Jekyll::Generator  # Changed from MathRenderer to MathsLatexToImage
      priority :highest
      
      def initialize(config = nil)
        super()
        setup_logging
        setup_debug_dir
        @config = config
        @svg_cache = {}
        
        # Register the post_write hook during initialization
        Jekyll::Hooks.register :site, :post_write do |site|
          @console_logger.info("Post-write hook triggered")
          begin
            copy_svg_files(site) # First copy SVG files
            convert_to_png(site) # Then do conversion to PNG
            @console_logger.info("Post-write tasks completed successfully")
          rescue => e
            @console_logger.error("Post-write tasks failed: #{e.message}")
            @console_logger.error(e.backtrace.join("\n"))
          end
        end
        
        @@instance = self  # Store instance for hook access
        
        # Updated regex patterns
        @display_math_pattern = /\$\$(.*?)\$\$/m
        @inline_math_pattern = /(?<!\\)\$([^\$]+?)\$/  # Changed pattern
        
        @renderer = NodeRendererClient.new(@console_logger)
      rescue => e
        @console_logger.error("Failed to initialize renderer: #{e.message}")
        raise
      end

      def generate(site)
        @site = site
        setup_svg_dir
        setup_temp_dir
        start_time = Time.now
        
        @svg_files = {}  # Map of temp paths to final paths
        process_documents(site)
        
        @console_logger.info("Math rendering completed in #{Time.now - start_time.round(2)} seconds")
      end

      def convert_to_png(site)
        build_dir = site.dest
        user_dir = Dir.pwd
        node_path = File.join(user_dir, 'node_modules')
        
        @console_logger.info("Starting PNG conversion from: #{build_dir}")
        @console_logger.info("PNG converter NODE_PATH: #{node_path}")
        @console_logger.info("PNG converter working directory: #{user_dir}")
        
        # Set environment with node_path
        env = ENV.to_h.merge({
          'NODE_PATH' => node_path
        })
        
        # Use npx with updated command name
        command = "npx jekyll-maths-svg2png \"#{build_dir}\""
        
        @console_logger.debug("Running command: #{command}")
        output, status = Open3.capture2e(env, command, chdir: user_dir)
        
        if status.success?
          @console_logger.info("PNG conversion complete")
          @console_logger.debug(output) if ENV['DEBUG']
        else
          @console_logger.error("PNG conversion failed:")
          @console_logger.error(output)
          raise "PNG conversion failed: #{output}"
        end
      end

      # New method to handle post-write tasks
      def post_write_tasks(site)
        begin
          convert_to_png(site)  # Do PNG conversion first
          copy_svg_files(site)  # Then copy both SVG and PNG files
        rescue => e
          @console_logger.error("Post-write tasks failed: #{e.message}")
          @console_logger.error(e.backtrace.join("\n"))
        end
      end

      private

      def setup_logging
        log_dir = File.join(Dir.pwd, '_logs', 'math')
        FileUtils.mkdir_p(log_dir)
        
        @rpc_logger = Logger.new(
          File.open(File.join(log_dir, "math-rpc-#{Time.now.strftime('%Y-%m-%d')}.log"), 'a')
        )
        @rpc_logger.formatter = proc do |_, _, _, msg|
          "#{msg}\n"
        end
        
        # Minimal console logging
        @console_logger = Logger.new(STDOUT)
        @console_logger.formatter = proc do |severity, _, _, msg|
          next unless severity == "ERROR" || ENV["DEBUG"]
          "[#{severity}] #{msg}\n"
        end
        @console_logger.level = ENV["DEBUG"] ? Logger::DEBUG : Logger::ERROR
      end

      def setup_debug_dir
        @debug_dir = File.join(Dir.pwd, '_debug', 'math', 'ruby')
        FileUtils.mkdir_p(@debug_dir)
        @console_logger.info("Debug directory: #{@debug_dir}")
      end

      def setup_svg_dir
        # Use configurable path from _config.yml or default
        base_path = @site.config.dig('texsvg_math_renderer', 'path') || '/assets/img/math'
        @svg_url_path = File.join(@site.config['baseurl'].to_s, base_path)
      end

      def setup_temp_dir
        # Create temporary directory for SVGs during generation
        @temp_svg_dir = File.join(Dir.tmpdir, "jekyll-math-#{Time.now.to_i}")
        FileUtils.mkdir_p(@temp_svg_dir)
        @console_logger.info("Created temp SVG directory: #{@temp_svg_dir}")
      end

      def has_math?(content)
        content =~ @display_math_pattern || content =~ @inline_math_pattern
      end

      def convert_math(page)
        return unless has_math?(page.content)

        begin
          setup_page_svg_dir(page)
          
          # Add debug logging for inline math
          page.content.scan(@inline_math_pattern) do |match|
            @console_logger.debug("Found inline math: #{match[0]}")
          end
          
          # Process display math first
          page.content = page.content.gsub(@display_math_pattern) do |match|
            math = $1.strip
            next match if math.empty?
            render_math(math, true)
          end

          # Process inline math with debug logging
          page.content = page.content.gsub(@inline_math_pattern) do |match|
            math = $1.strip
            @console_logger.debug("Processing inline math: #{math}")
            next match if math.empty?
            render_math(math, false)
          end
        rescue => e
          @console_logger.error("Error processing #{page.path}: #{e.message}")
          raise e
        end
      end

      def setup_page_svg_dir(page)
        # Get clean URL path for the page
        rel_path = if page.url
          # Remove leading/trailing slashes and .html
          page.url.gsub(/^\/|\/$|\.html$/, '')
        else
          page.path.sub(/\.[^.]+$/, '').sub(/^\//, '')
        end
        
        # Create temp subdirectory for this page's SVGs
        @current_temp_dir = File.join(@temp_svg_dir, rel_path)
        FileUtils.mkdir_p(@current_temp_dir)
        
        # Store the final URL path
        @current_url_path = File.join(@svg_url_path, rel_path)
        
        @console_logger.info("Page URL path: #{@current_url_path}")
        @console_logger.info("Temp directory: #{@current_temp_dir}")
      end

      def escape_latex(latex)
        # More comprehensive LaTeX escaping
        latex.gsub(/\\/, '\\\\')          # Escape backslashes first
             .gsub(/\{/, '\\{')           # Escape curly braces
             .gsub(/\}/, '\\}')           # Fixed closing brace
             .gsub(/\$/, '\\$')           # Escape dollar signs
             .gsub(/&/, '\\&')            # Escape ampersands
             .gsub(/\#/, '\\#')           # Escape hash
             .gsub(/\^/, '\\^')           # Escape carets
             .gsub(/\_/, '\\_')           # Escape underscores
             .gsub(/\%/, '\\%')           # Escape percent signs
             .gsub(/~/, '\\~{}')          # Escape tildes
      end

      def render_math(math, display_mode)
        cache_key = "#{math}:#{display_mode}"
        return @svg_cache[cache_key] if @svg_cache.key?(cache_key)
        
        begin
          cleaned_math = clean_math_input(math)
          svg = @renderer.get_svg(cleaned_math, display_mode: display_mode)
          svg_path = save_svg(math, svg, SecureRandom.uuid)
          png_path = svg_path.sub(/\.svg$/, '.png')
          
          # Get format preference from config
          format = @site.config.dig('texsvg_math_renderer', 'format') || 'both'
          
          # Build srcset based on format
          srcset = case format
          when 'svg'
            "#{svg_path}"
          when 'png'
            "#{png_path}"
          else # 'both'
            "#{svg_path}, #{png_path}"
          end
          
          # Default source is PNG for better compatibility
          src = format == 'svg' ? svg_path : png_path
          
          # Build the common part of the img tag
          img_class = "math-#{display_mode ? 'block' : 'inline'}"
          img_tag = "<img src=\"#{src}\" "\
                    "srcset=\"#{srcset}\" "\
                    "alt=\"#{html_escape(math)}\" "\
                    "class=\"#{img_class}\""
          
          # For inline math add a style override
          unless display_mode
            img_tag += " style=\"font-size:1.3em\""
          end
          img_tag += ">"
          
          html = display_mode ? 
            "<div class=\"math-block\">#{img_tag}</div>" :
            "<span class=\"math-inline\">#{img_tag}</span>"
          
          html = html.html_safe if html.respond_to?(:html_safe)
          @svg_cache[cache_key] = html
          html
        rescue => e
          @console_logger.error("Math Processing Error:")
          @console_logger.error("  Input: #{math.inspect}")
          @console_logger.error("  Error: #{e.message}")
          "<span class='math-error' title='#{html_escape(e.message)}'>#{html_escape(math)}</span>"
        end
      end

      def save_svg(latex, svg, id)
        begin
          hash = Digest::MD5.hexdigest(latex)[0..7]
          sanitized_latex = latex.gsub(/[^a-zA-Z0-9]/, '_')[0..19]
          filename = "math_#{sanitized_latex}-#{hash}-#{id}.svg"
          
          # Save to temp location
          temp_path = File.join(@current_temp_dir, filename)
          FileUtils.mkdir_p(@current_temp_dir)
          File.write(temp_path, svg)
          
          # Calculate final path
          final_url = File.join(@current_url_path, filename)
          final_path = File.join(@site.dest, final_url.sub(/^\//, ''))
          
          # Store mapping for post-write hook
          @svg_files[temp_path] = final_path
          
          # Only log errors, not successes
          @rpc_logger.debug("SVG: #{filename}")
          
          # Return URL path for HTML
          final_url
        rescue => e
          @console_logger.error("Error saving SVG: #{e.message}")
          raise
        end
      end

      def copy_svg_files(site)
        @svg_files.each do |temp_path, final_path|
          begin
            FileUtils.mkdir_p(File.dirname(final_path))
            FileUtils.cp(temp_path, final_path)
          rescue => e
            @console_logger.error("Failed to copy #{temp_path} to #{final_path}: #{e.message}")
          end
        end
        
        FileUtils.rm_rf(@temp_svg_dir)
      end

      def cleanup
        @renderer.cleanup
      end

      def clean_math_input(math)
        original = math.dup
        cleaned = math
         # .gsub(/\\boxed\{/, '{\\boxed{')  # Fix boxed command grouping
          .gsub(/\s+/, ' ')                 # Normalize spaces
      
          #.gsub(/[^\x00-\x7F]/, '')         # Remove non-ASCII
          #.strip
        
        @console_logger.debug("Math cleaning steps:")
        @console_logger.debug("  1. Original:  #{original.inspect}")
        @console_logger.debug("  2. Cleaned:   #{cleaned.inspect}")
        @console_logger.debug("  3. Changed:   #{original != cleaned}")
        
        cleaned
      end

      def html_escape(str)
        str.gsub(/[&<>"']/, {
          '&' => '&amp;',
          '<' => '&lt;',
          '>' => '&gt;',
          '"' => '&quot;',
          "'" => '&#39;'
        })
      end

      # Remove old logging methods
      def log_error(message, data = {})
        @console_logger.error("#{message} #{data.inspect unless data.empty()}")
      end

      def log_info(message, data = {})
        @console_logger.info("#{message} #{data.inspect unless data.empty()}")
      end

      def log_debug(message, data = {})
        @console_logger.debug("#{message} #{data.inspect unless data.empty()}")
      end

      def process_documents(site)
        all_documents = site.pages + site.posts.docs
        chunks = all_documents.each_slice(5).to_a
        
        Parallel.each(chunks, in_threads: Parallel.processor_count) do |chunk|
          chunk.each do |doc|
            begin
              convert_math(doc) if has_math?(doc.content)
            rescue => e
              @console_logger.error("Error processing #{doc.path}: #{e.message}")
            end
          end
        end
      end

      def check_node_dependencies(required_modules)
        missing = []
        required_modules.each do |mod|
          begin
            require_cmd = "require.resolve('#{mod}')"
            cmd = "node -e \"#{require_cmd}\""
            _, status = Open3.capture2e(cmd)
            missing << mod unless status.success?
          rescue
            missing << mod
          end
        end
        
        unless missing.empty?
          msg = "Missing required Node.js modules: #{missing.join(', ')}. "\
                "Please run: npm install #{missing.join(' ')}"
          raise msg
        end
      end
    end
  end
end

# Helper class for multiple IO logging
class MultiIO
  def initialize(*targets)
    @targets = targets
  end

  def write(*args)
    @targets.each { |t| t.write(*args) }
  end

  def close
    @targets.each(&:close)
  end
end
