defmodule Grange.Farm do
  @moduledoc """
  A player's farm: a field of plants plus the owner's barn inventory.

  `seeds` and `tomatoes` are the owner's barn inventory. Farms are conceptually
  persistent, but only held in memory for now.
  """

  alias Grange.{Id, Plant}

  @starting_seeds 4
  @seeds_per_tomato 2

  @derive {Jason.Encoder, only: [:owner, :field, :seeds, :tomatoes, :visitors]}
  defstruct owner: nil, field: [], seeds: @starting_seeds, tomatoes: 0, visitors: []

  @type t :: %__MODULE__{
          owner: String.t(),
          field: [Plant.t()],
          seeds: non_neg_integer(),
          tomatoes: non_neg_integer(),
          visitors: [String.t()]
        }

  @doc "A brand new farm: four seeds and an empty field."
  def create(owner), do: %__MODULE__{owner: owner}

  def starting_seeds, do: @starting_seeds
  def seeds_per_tomato, do: @seeds_per_tomato

  @doc """
  Applies one action to a farm. Returns `{:ok, farm}` with the updated farm, or
  `{:error, reason}` for an illegal action.
  """
  @spec apply_action(t(), map()) :: {:ok, t()} | {:error, String.t()}
  def apply_action(farm, %{"kind" => "plantSeed"}), do: plant_seed(farm)

  def apply_action(farm, %{"kind" => "grow", "plantId" => plant_id}),
    do: grow(farm, plant_id)

  def apply_action(farm, %{"kind" => "harvest", "plantId" => plant_id}),
    do: harvest(farm, plant_id)

  def apply_action(farm, %{"kind" => "convertTomato"}), do: convert_tomato(farm)

  defp plant_seed(%{seeds: seeds}) when seeds <= 0, do: {:error, "no seeds to plant"}

  defp plant_seed(farm) do
    plant = %Plant{id: Id.generate(), stage: :seedling}
    {:ok, %{farm | seeds: farm.seeds - 1, field: farm.field ++ [plant]}}
  end

  defp grow(farm, plant_id) do
    case find_plant(farm, plant_id) do
      nil ->
        {:error, "no such plant"}

      %Plant{stage: :seedling} = plant ->
        {:ok, %{farm | field: replace_plant(farm.field, %{plant | stage: :tomato})}}

      %Plant{} ->
        {:error, "already grown"}
    end
  end

  defp harvest(farm, plant_id) do
    case find_plant(farm, plant_id) do
      nil ->
        {:error, "no such plant"}

      %Plant{stage: :tomato} ->
        field = Enum.reject(farm.field, &(&1.id == plant_id))
        {:ok, %{farm | field: field, tomatoes: farm.tomatoes + 1}}

      %Plant{} ->
        {:error, "not ready to harvest"}
    end
  end

  defp convert_tomato(%{tomatoes: tomatoes}) when tomatoes <= 0,
    do: {:error, "no tomatoes to convert"}

  defp convert_tomato(farm) do
    {:ok, %{farm | tomatoes: farm.tomatoes - 1, seeds: farm.seeds + @seeds_per_tomato}}
  end

  defp find_plant(farm, plant_id), do: Enum.find(farm.field, &(&1.id == plant_id))

  defp replace_plant(field, updated) do
    Enum.map(field, fn plant ->
      if plant.id == updated.id, do: updated, else: plant
    end)
  end
end
