require File.expand_path("#{File.dirname(__FILE__)}/../../monarch_spec_helper")

module Http
  describe Dispatcher do
    attr_reader :client

    before do
      @client = CometClient.new("sample-comet-client-id", nil)
    end

    describe "#subscribe(relation)" do
      it "causes all insert, update, and remove events on the given relation to send a message to the client" do
        client.subscribe(BlogPost.table)

        sent_message = nil
        stub(client).send do |message|
          sent_message = message
        end

        record = BlogPost.create(:title => "FiberForce Muffins", :body => "Betcha can't eat these.")
        sent_message.should == ["create", "blog_posts", {"created_at"=>nil, "title"=>"FiberForce Muffins", "body"=>"Betcha can't eat these.", "featured"=>nil, "blog_id"=>nil, "id" => record.id }]

        RR.reset_double(client, :send)

        expected_message = ["update", "blog_posts", record.id, { "title" => "Tejava", "body" => "I love this tea and so does Brian Takita!" }]
        mock(client).send(expected_message)

        record.update(:title => "Tejava", :body => "I love this tea and so does Brian Takita!")
        record.save

        expected_message = ["destroy", "blog_posts", record.id]
        mock(client).send(expected_message)

        record.destroy
      end
    end
  end
end
