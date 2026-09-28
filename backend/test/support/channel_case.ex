defmodule GrangeWeb.ChannelCase do
  @moduledoc false

  use ExUnit.CaseTemplate

  using do
    quote do
      import Phoenix.ChannelTest

      @endpoint GrangeWeb.Endpoint
    end
  end
end
