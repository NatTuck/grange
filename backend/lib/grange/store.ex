defmodule Grange.Store do
  @moduledoc """
  The single source of truth for application state.

  Everything lives in one process, so mutations are serialized and the server
  needs no locks. State is in-memory only and never persisted.
  """

  use GenServer

  alias Grange.{Farm, Player}

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Returns `{player, farm}` for the name, creating both if needed."
  def get_or_create_player(name) do
    GenServer.call(__MODULE__, {:get_or_create_player, name})
  end

  def players, do: GenServer.call(__MODULE__, :players)

  def summaries, do: GenServer.call(__MODULE__, :summaries)

  def farm(owner), do: GenServer.call(__MODULE__, {:farm, owner})

  def visit_farm(owner, visitor) do
    GenServer.call(__MODULE__, {:visit_farm, owner, visitor})
  end

  def leave_farm(owner, visitor) do
    GenServer.call(__MODULE__, {:leave_farm, owner, visitor})
  end

  def apply_action(owner, action) do
    GenServer.call(__MODULE__, {:apply_action, owner, action})
  end

  def reset, do: GenServer.call(__MODULE__, :reset)

  @impl true
  def init(_opts), do: {:ok, %{players: %{}, farms: %{}}}

  @impl true
  def handle_call({:get_or_create_player, name}, _from, state) do
    {player, state} = ensure_player(state, name)
    {farm, state} = ensure_farm(state, name)
    {:reply, {player, farm}, state}
  end

  def handle_call(:players, _from, state) do
    {:reply, Map.values(state.players), state}
  end

  def handle_call(:summaries, _from, state) do
    {:reply, summarize(state), state}
  end

  def handle_call({:farm, owner}, _from, state) do
    {:reply, Map.get(state.farms, owner), state}
  end

  def handle_call({:visit_farm, owner, visitor}, _from, state) do
    case Map.fetch(state.farms, owner) do
      :error ->
        {:reply, {:error, "Farm not found"}, state}

      {:ok, farm} ->
        farm =
          if visitor != owner and visitor not in farm.visitors do
            %{farm | visitors: farm.visitors ++ [visitor]}
          else
            farm
          end

        {:reply, {:ok, farm}, put_farm(state, farm)}
    end
  end

  def handle_call({:leave_farm, owner, visitor}, _from, state) do
    case Map.fetch(state.farms, owner) do
      :error ->
        {:reply, nil, state}

      {:ok, farm} ->
        farm = %{farm | visitors: Enum.reject(farm.visitors, &(&1 == visitor))}
        {:reply, farm, put_farm(state, farm)}
    end
  end

  def handle_call({:apply_action, owner, action}, _from, state) do
    case Map.fetch(state.farms, owner) do
      :error ->
        {:reply, {:error, "farm not found"}, state}

      {:ok, farm} ->
        case Farm.apply_action(farm, action) do
          {:ok, updated} -> {:reply, :ok, put_farm(state, updated)}
          {:error, reason} -> {:reply, {:error, reason}, state}
        end
    end
  end

  def handle_call(:reset, _from, _state) do
    {:reply, :ok, %{players: %{}, farms: %{}}}
  end

  defp ensure_player(state, name) do
    case Map.fetch(state.players, name) do
      {:ok, player} ->
        {player, state}

      :error ->
        player = %Player{name: name}
        {player, %{state | players: Map.put(state.players, name, player)}}
    end
  end

  defp ensure_farm(state, owner) do
    case Map.fetch(state.farms, owner) do
      {:ok, farm} ->
        {farm, state}

      :error ->
        farm = Farm.create(owner)
        {farm, put_farm(state, farm)}
    end
  end

  defp put_farm(state, farm), do: %{state | farms: Map.put(state.farms, farm.owner, farm)}

  defp summarize(state) do
    state.farms
    |> Map.values()
    |> Enum.map(fn farm ->
      %{
        owner: farm.owner,
        fieldCount: length(farm.field),
        seedCount: farm.seeds,
        tomatoCount: farm.tomatoes,
        visitorCount: length(farm.visitors)
      }
    end)
    |> Enum.sort_by(& &1.owner)
  end
end
