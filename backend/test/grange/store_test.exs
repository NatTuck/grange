defmodule Grange.StoreTest do
  use ExUnit.Case, async: false

  alias Grange.Store

  setup do
    Store.reset()
    :ok
  end

  test "starts empty" do
    assert Store.players() == []
    assert Store.summaries() == []
  end

  test "creates a player and their farm when new" do
    {player, farm} = Store.get_or_create_player("Alice")

    assert player.name == "Alice"
    assert Enum.any?(Store.players(), &(&1.name == "Alice"))
    assert farm.seeds == 4
    assert Store.farm("Alice").seeds == 4
  end

  test "returns the existing player and farm on repeat calls" do
    {first_player, first_farm} = Store.get_or_create_player("Alice")
    {second_player, second_farm} = Store.get_or_create_player("Alice")

    assert second_player == first_player
    assert second_farm == first_farm
    assert Enum.count(Store.players(), &(&1.name == "Alice")) == 1
  end

  test "records and removes visitors, never the owner" do
    Store.get_or_create_player("Alice")

    assert {:ok, _} = Store.visit_farm("Alice", "Bob")
    assert {:ok, _} = Store.visit_farm("Alice", "Bob")
    assert {:ok, _} = Store.visit_farm("Alice", "Alice")
    assert Store.farm("Alice").visitors == ["Bob"]

    assert %{visitors: []} = Store.leave_farm("Alice", "Bob")
  end

  test "reports a missing farm" do
    assert {:error, "Farm not found"} = Store.visit_farm("Nobody", "Bob")
    assert Store.farm("Nobody") == nil
  end

  test "summarizes farms for the lobby" do
    Store.get_or_create_player("Alice")
    {:ok, _} = Store.visit_farm("Alice", "Bob")

    assert [%{owner: "Alice", fieldCount: 0, seedCount: 4, tomatoCount: 0, visitorCount: 1}] =
             Store.summaries()
  end
end
