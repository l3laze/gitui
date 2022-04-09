# workspace.rb by James Coglan

class Workspace
  IGNORE = [".", "..", ".git"]

  def initialize(pathname)
    @pathname = pathname
  end

  def list_files
    Dir.entries(@pathname) - IGNORE
  end

  def read_file(path)
    File.read(@pathname.join(path))
  end
end


# blob.rb by James Coglan

class Blob
  attr_accessor :oid

  def initialize(data)
    @data = data
  end

  def type
    "blob"
  end

  def to_s
    @data
  end
end


# database.rb by James Coglan

require "digest/sha1"
require "zlib"

require_relative "./blob"

TEMP_CHARS = ("a".."z").to_a + ("A".."Z").to_a + ("0".."9").to_a

class Database
  def initialize(pathname)
    @pathname = pathname
  end

  def store(object)
    string = object.to_s.force_encoding(Encoding::ASCII_8BIT)

    content = "#{ object.type } #{ string.bytesize }\0#{ string }"

    object.oid = Digest::SHA1.hexdigest(content)

    write_object(object.oid, content)
  end


  private

  def write_object(oid, content)
    object_path = @pathname.join(oid[0..1], oid[2..-1])
    dirname = object_path.dirname
    temp_path = dirname.join(generate_temp_name)

    begin
      flags = File::RDWR | File::CREAT | File::EXCL
      file = File.open(temp_path, flags)

      rescue Errno::ENOENT
        Dir.mkdir(dirname)
        file = File.open(temp_path, flags)
      end

      compressed = Zlib::Deflate.deflate(content, Zlib::BEST_SPEED)
      file.write(compressed)
      file.close
      File.rename(temp_path, object_path)
    end

  def generate_temp_name
    "tmp_obj_#{ (1..6).map { TEMP_CHARS.sample }.join("") }"
  end
end


# entry.rb by James Coglan

class Entry
 attr_reader :name, :oid

  def initialize(name, oid)
    @name = name
    @oid = oid
  end
end


# tree.rb by James Coglan

class Tree
  ENTRY_FORMAT = "Z*H40"
  MODE = "100644"

  attr_accessor :oid

  def initialize(entries)
    @entries = entries
  end

  def type
    "tree"
  end

  def to_s
    entries = @entries.sort_by(&:name).map do |entry|
      ["#{ MODE } #{ entry.name }", entry.oid].pack(ENTRY_FORMAT)
    end

    entries.join("")
  end
end


# author.rb by JC

Author = Struct.new(:name, :email, :time) do
  def to_s
    timestamp = time.strftime("%s %z")
    "#{ name } <#{ email }> #{ timestamp }"
  end
end


# commit.rb by JC

class Commit
  attr_accessor :oid

  def initialize(tree, author, message)
    @tree = tree
    @author = author
    @message = message
  end

  def type
    "commit"
  end

  def to_s
    lines = [
      "tree #{ @tree }",
      "author #{ @author }",
      "committer #{ @author }",
      "",
      @message
    ]

    lines.join("\n")
  end
end
