# encoding: utf-8
require "logstash/inputs/base"
require "logstash/namespace"
require "socket"

# Read events over a 0MQ SUB socket.
#
# You need to have the 0mq 2.1.x library installed to be able to use
# this input plugin.
#
# The default settings will create a subscriber binding to `tcp://127.0.0.1:2120`
# waiting for connecting publishers.
#
class LogStash::Inputs::ZeroMQ < LogStash::Inputs::Base

  config_name "zeromq"

  default :codec, "json"

  # 0mq socket address to connect or bind
  # Please note that `inproc://` will not work with logstash
  # as each we use a context per thread.
  # By default, inputs bind/listen
  # and outputs connect
  config :address, :validate => :array, :default => ["tcp://*:2120"]

  # 0mq topology
  # The default logstash topologies work as follows:
  #
  # * pushpull - inputs are pull, outputs are push
  # * pubsub - inputs are subscribers, outputs are publishers
  # * pair - inputs are clients, inputs are servers
  #
  # If the predefined topology flows don't work for you,
  # you can change the `mode` setting
  # TODO (lusis) add req/rep MAYBE
  # TODO (lusis) add router/dealer
  config :topology, :validate => ["pushpull", "pubsub", "pair"], :required => true

  # 0mq topic
  # This is used for the `pubsub` topology only
  # On inputs, this allows you to filter messages by topic
  # On outputs, this allows you to tag a message for routing
  # NOTE: ZeroMQ does subscriber side filtering.
  # NOTE: All topics have an implicit wildcard at the end
  # You can specify multiple topics here
  config :topic, :validate => :array

  # Event topic field
  # This is used for the `pubsub` topology only
  # When a message is received on a topic, the topic name on which
  # the message was received will saved in this field.
  config :topic_field, :validate => :string, :default => "topic"

  # mode
  # server mode binds/listens
  # client mode connects
  config :mode, :validate => ["server", "client"], :default => "server"

  # sender
  # overrides the sender to
  # set the source of the event
  # default is `zmq+topology://type/`
  config :sender, :validate => :string

  # 0mq socket options
  # This exposes `zmq_setsockopt`
  # for advanced tuning
  # see http://api.zeromq.org/2-1:zmq-setsockopt for details
  #
  # This is where you would set values like:
  #
  #  * `ZMQ::HWM` - high water mark
  #  * `ZMQ::IDENTITY` - named queues
  #  * `ZMQ::SWAP_SIZE` - space for disk overflow
  #
  # Example:
  # [source,ruby]
  #     sockopt => {
  #        "ZMQ::HWM" => 50
  #        "ZMQ::IDENTITY"  => "my_named_queue"
  #     }
  #
  # defaults to: `sockopt => { "ZMQ::RCVTIMEO" => "1000" }`, which has the effect of "interrupting"
  # the recv operation at least once every second to allow for properly shutdown handling.
  config :sockopt, :validate => :hash, :default => { "ZMQ::RCVTIMEO" => "1000" }

  public
  def register
    require "ffi-rzmq"
    require "logstash/plugin_mixins/zeromq"
    self.class.send(:include, LogStash::PluginMixins::ZeroMQ)
    @host = Socket.gethostname
    init_socket
  end # def register

  def init_socket
    case @topology
    when "pair"
      zmq_const = ZMQ::PAIR
    when "pushpull"
      zmq_const = ZMQ::PULL
    when "pubsub"
      zmq_const = ZMQ::SUB
    end # case socket_type
    @zsocket = context.socket(zmq_const)
    error_check(@zsocket.setsockopt(ZMQ::LINGER, 1),
                "while setting ZMQ::LINGER == 1)")

    if @sockopt
      setopts(@zsocket, @sockopt)
    end

    @address.each do |addr|
      setup(@zsocket, addr)
    end

    if @topology == "pubsub"
      if @topic.nil?
        @logger.debug("ZMQ - No topic provided. Subscribing to all messages")
        error_check(@zsocket.setsockopt(ZMQ::SUBSCRIBE, ""),
      "while setting ZMQ::SUBSCRIBE")
      else
        @topic.each do |t|
          @logger.debug("ZMQ subscribing to topic: #{t}")
          error_check(@zsocket.setsockopt(ZMQ::SUBSCRIBE, t),
        "while setting ZMQ::SUBSCRIBE == #{t}")
        end
      end
    end
  end

  def close
    begin
      error_check(@zsocket.close, "while closing the zmq socket")
      context.terminate
    rescue RuntimeError => e
      @logger.error("Failed to properly teardown ZeroMQ")
    end
  end # def close

  def server?
    @mode == "server"
  end # def server?

  def run(output_queue)
    begin
      while !stop?
        handle_message(output_queue)
      end
    rescue => e
      @logger.debug? && @logger.debug("ZMQ Error", :subscriber => @zsocket,
                    :exception => e)
      retry
    end # begin
  end # def run

  private
  def build_source_string
    id = @address.first.clone
  end

  def handle_message(output_queue)
    # Here's the unified receiver
    more = true
    parts = []
    rc = @zsocket.recv_strings(parts)
    error_check(rc, "in recv_strings", true)
    return unless ZMQ::Util.resultcode_ok?(rc)

    if @topology == "pubsub" && parts.length > 1
      # assume topic is a simple string
      topic, *parts = parts
    else
      topic = nil
    end
    parts.each do |msg|
      @codec.decode(msg) do |event|
        event.set("host", event.get("host") || @host)
        event.set(@topic_field, topic.force_encoding('UTF-8')) unless topic.nil?
        decorate(event)
        output_queue << event
      end
    end
  end
end # class LogStash::Inputs::ZeroMQ
