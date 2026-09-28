defmodule GrangeWeb.LobbyChannel do
  @moduledoc """
  The lobby: login, plus the player and farm listings.

  Replaces the socket.io `login` / `farms` events and the `players` / `farms`
  broadcasts.
  """

  use Phoenix.Channel

  alias Grange.Store

  @impl true
  def join("lobby", _payload, socket), do: {:ok, socket}

  @impl true
  def handle_in("login", %{"username" => raw}, socket) do
    name = raw |> to_string() |> String.trim()

    if name == "" do
      {:reply, {:error, %{error: "username is required"}}, socket}
    else
      {player, farm} = Store.get_or_create_player(name)
      broadcast!(socket, "players", %{players: Store.players()})
      broadcast!(socket, "farms", %{farms: Store.summaries()})
      {:reply, {:ok, %{player: player, farm: farm}}, assign(socket, :username, name)}
    end
  end

  def handle_in("farms", _payload, socket) do
    {:reply, {:ok, %{farms: Store.summaries()}}, socket}
  end
end
