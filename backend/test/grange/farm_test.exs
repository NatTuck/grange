defmodule Grange.FarmTest do
  use ExUnit.Case, async: true

  alias Grange.{Farm, Plant}

  defp plant(farm, count) do
    Enum.reduce(1..count, farm, fn _, acc ->
      assert {:ok, updated} = Farm.apply_action(acc, %{"kind" => "plantSeed"})
      updated
    end)
  end

  test "create/1 starts with 4 seeds, no tomatoes, and an empty field" do
    farm = Farm.create("Alice")

    assert farm.owner == "Alice"
    assert farm.field == []
    assert farm.seeds == 4
    assert farm.tomatoes == 0
    assert farm.visitors == []
  end

  test "plantSeed moves a seed into the field as a seedling" do
    farm = Farm.create("Alice")

    assert {:ok, farm} = Farm.apply_action(farm, %{"kind" => "plantSeed"})
    assert farm.seeds == 3
    assert [%Plant{stage: :seedling}] = farm.field
  end

  test "plantSeed rejects planting with no seeds" do
    farm = plant(Farm.create("Alice"), 4)

    assert {:error, "no seeds to plant"} =
             Farm.apply_action(farm, %{"kind" => "plantSeed"})

    assert length(farm.field) == 4
  end

  test "grow turns a seedling into a tomato plant" do
    farm = plant(Farm.create("Alice"), 1)
    [plant] = farm.field

    assert {:ok, farm} =
             Farm.apply_action(farm, %{"kind" => "grow", "plantId" => plant.id})

    assert [%Plant{stage: :tomato}] = farm.field
  end

  test "grow rejects an unknown plant and a plant that is already grown" do
    farm = plant(Farm.create("Alice"), 1)
    [plant] = farm.field

    assert {:error, "no such plant"} =
             Farm.apply_action(farm, %{"kind" => "grow", "plantId" => "nope"})

    assert {:ok, grown} =
             Farm.apply_action(farm, %{"kind" => "grow", "plantId" => plant.id})

    assert {:error, "already grown"} =
             Farm.apply_action(grown, %{"kind" => "grow", "plantId" => plant.id})
  end

  test "harvest removes a tomato plant and adds a tomato to the barn" do
    farm = plant(Farm.create("Alice"), 1)
    [plant] = farm.field
    assert {:ok, farm} = Farm.apply_action(farm, %{"kind" => "grow", "plantId" => plant.id})

    assert {:ok, farm} =
             Farm.apply_action(farm, %{"kind" => "harvest", "plantId" => plant.id})

    assert farm.field == []
    assert farm.tomatoes == 1
  end

  test "harvest rejects a seedling" do
    farm = plant(Farm.create("Alice"), 1)
    [plant] = farm.field

    assert {:error, "not ready to harvest"} =
             Farm.apply_action(farm, %{"kind" => "harvest", "plantId" => plant.id})
  end

  test "convertTomato turns one tomato into two seeds" do
    farm = %{Farm.create("Alice") | tomatoes: 1}

    assert {:ok, farm} = Farm.apply_action(farm, %{"kind" => "convertTomato"})
    assert farm.tomatoes == 0
    assert farm.seeds == 6
  end

  test "convertTomato rejects converting with no tomatoes" do
    assert {:error, "no tomatoes to convert"} =
             Farm.apply_action(Farm.create("Alice"), %{"kind" => "convertTomato"})
  end

  test "acceptance: ends with one tomato and four seeds" do
    farm = plant(Farm.create("Alice"), 2)
    assert farm.seeds == 2
    assert length(farm.field) == 2

    farm =
      Enum.reduce(farm.field, farm, fn plant, acc ->
        {:ok, updated} =
          Farm.apply_action(acc, %{"kind" => "grow", "plantId" => plant.id})

        updated
      end)

    assert Enum.all?(farm.field, &(&1.stage == :tomato))

    farm =
      Enum.reduce(Enum.map(farm.field, & &1.id), farm, fn id, acc ->
        {:ok, updated} =
          Farm.apply_action(acc, %{"kind" => "harvest", "plantId" => id})

        updated
      end)

    assert farm.tomatoes == 2
    assert farm.seeds == 2

    assert {:ok, farm} = Farm.apply_action(farm, %{"kind" => "convertTomato"})
    assert farm.tomatoes == 1
    assert farm.seeds == 4
  end
end
