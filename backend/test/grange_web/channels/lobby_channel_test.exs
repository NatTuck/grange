defmodule GrangeWeb.LobbyChannelTest do
  use GrangeWeb.ChannelCase

  alias Grange.Store

  setup do
    Store.reset()
    :ok
  end

  defp join_lobby do
    {:ok, _reply, socket} =
      socket(GrangeWeb.UserSocket)
      |> subscribe_and_join(GrangeWeb.LobbyChannel, "lobby")

    socket
  end

  test "login creates a player and farm and broadcasts listings" do
    socket = join_lobby()

    ref = push(socket, "login", %{"username" => "Alice"})
    assert_reply(ref, :ok, reply)

    assert reply.player.name == "Alice"
    assert reply.farm.owner == "Alice"
    assert reply.farm.seeds == 4

    assert_broadcast("players", players_msg)
    assert Enum.any?(players_msg.players, &(&1.name == "Alice"))

    assert_broadcast("farms", farms_msg)
    assert Enum.any?(farms_msg.farms, &(&1.owner == "Alice"))
  end

  test "login rejects a blank username" do
    socket = join_lobby()

    ref = push(socket, "login", %{"username" => "   "})
    assert_reply(ref, :error, reply)
    assert reply.error == "username is required"
  end

  test "farms returns the current summaries" do
    Store.get_or_create_player("Bob")
    socket = join_lobby()

    ref = push(socket, "farms", %{})
    assert_reply(ref, :ok, reply)
    assert Enum.map(reply.farms, & &1.owner) == ["Bob"]
  end
end
