defmodule GrangeWeb.FarmChannelTest do
  use GrangeWeb.ChannelCase

  alias Grange.Store

  setup do
    Store.reset()
    :ok
  end

  defp join_farm(owner, username) do
    {:ok, reply, socket} =
      socket(GrangeWeb.UserSocket)
      |> subscribe_and_join(GrangeWeb.FarmChannel, "farm:#{owner}", %{"username" => username})

    {reply, socket}
  end

  test "joining a farm replies with the farm" do
    Store.get_or_create_player("Alice")
    {reply, _socket} = join_farm("Alice", "Alice")

    assert reply.farm.owner == "Alice"
    assert reply.farm.seeds == 4
  end

  test "an owner can act on their farm" do
    Store.get_or_create_player("Alice")
    {_reply, socket} = join_farm("Alice", "Alice")

    ref = push(socket, "farmAction", %{"owner" => "Alice", "action" => %{"kind" => "plantSeed"}})
    assert_reply(ref, :ok)
    assert_broadcast("farmUpdate", %{farm: %{seeds: 3}})
    assert Store.farm("Alice").seeds == 3
  end

  test "an illegal action is rejected" do
    Store.get_or_create_player("Alice")
    {_reply, socket} = join_farm("Alice", "Alice")

    ref =
      push(socket, "farmAction", %{"owner" => "Alice", "action" => %{"kind" => "convertTomato"}})

    assert_reply(ref, :error, reply)
    assert reply.error == "no tomatoes to convert"
  end

  test "a visitor can join read-only and cannot act" do
    Store.get_or_create_player("Alice")
    {_reply, socket} = join_farm("Alice", "Bob")

    assert Store.farm("Alice").visitors == ["Bob"]

    ref = push(socket, "farmAction", %{"owner" => "Alice", "action" => %{"kind" => "plantSeed"}})
    assert_reply(ref, :error, reply)
    assert reply.error == "not your farm"
  end

  test "joining a missing farm fails" do
    assert {:error, %{error: "Farm not found"}} =
             socket(GrangeWeb.UserSocket)
             |> subscribe_and_join(GrangeWeb.FarmChannel, "farm:Nobody", %{"username" => "Bob"})
  end

  test "leaving removes the visitor" do
    Store.get_or_create_player("Alice")
    {_reply, socket} = join_farm("Alice", "Bob")

    ref = push(socket, "leaveFarm", %{})
    assert_reply(ref, :ok, reply)
    assert reply.removed == true
  end
end
