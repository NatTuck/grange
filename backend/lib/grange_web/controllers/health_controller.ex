defmodule GrangeWeb.HealthController do
  @moduledoc false

  use Phoenix.Controller, formats: [:json]

  alias Grange.Store

  def state(conn, _params) do
    json(conn, %{
      playerCount: length(Store.players()),
      farmCount: length(Store.summaries())
    })
  end

  def reset(conn, _params) do
    Store.reset()
    json(conn, %{ok: true})
  end
end
