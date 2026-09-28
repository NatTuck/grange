defmodule GrangeWeb.Endpoint do
  @moduledoc false

  use Phoenix.Endpoint, otp_app: :grange

  # The SPA talks to the server exclusively over this socket.
  socket("/socket", GrangeWeb.UserSocket,
    websocket: true,
    longpoll: false
  )

  # Built frontend assets (vite build output lives in priv/static).
  plug(Plug.Static, at: "/", from: :grange, gzip: false)

  plug(Plug.RequestId)
  plug(Plug.Telemetry, event_prefix: [:phoenix, :endpoint])

  plug(Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Jason
  )

  plug(Plug.MethodOverride)
  plug(Plug.Head)
  plug(GrangeWeb.Router)
end
