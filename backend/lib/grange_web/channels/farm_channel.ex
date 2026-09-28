defmodule GrangeWeb.FarmChannel do
  @moduledoc """
  A single farm's room: visiting it (read-only for non-owners) and acting on it.

  Replaces the socket.io `visitFarm` / `leaveFarm` / `farmAction` events and the
  `farmUpdate` broadcast.
  """

  use Phoenix.Channel

  alias Grange.Store

  @impl true
  def join("farm:" <> owner, payload, socket) do
    name = payload |> Map.get("username", "") |> to_string() |> String.trim()

    if name == "" do
      {:error, %{error: "not logged in"}}
    else
      case Store.visit_farm(owner, name) do
        {:ok, farm} ->
          socket = socket |> assign(:username, name) |> assign(:owner, owner)
          send(self(), :after_join)
          {:ok, %{farm: farm}, socket}

        {:error, reason} ->
          {:error, %{error: reason}}
      end
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    # Broadcasting isn't allowed until the join has finished.
    broadcast!(socket, "farms", %{farms: Store.summaries()})
    {:noreply, socket}
  end

  @impl true
  def handle_in("farmAction", %{"owner" => owner, "action" => action}, socket) do
    name = socket.assigns[:username]

    cond do
      is_nil(name) ->
        {:reply, {:error, %{error: "not logged in"}}, socket}

      owner != name ->
        {:reply, {:error, %{error: "not your farm"}}, socket}

      true ->
        case Store.apply_action(owner, action) do
          :ok ->
            broadcast!(socket, "farms", %{farms: Store.summaries()})
            broadcast!(socket, "farmUpdate", %{farm: Store.farm(owner)})
            {:reply, :ok, socket}

          {:error, reason} ->
            {:reply, {:error, %{error: reason}}, socket}
        end
    end
  end

  def handle_in("leaveFarm", _payload, socket) do
    owner = socket.assigns[:owner]
    name = socket.assigns[:username]
    Store.leave_farm(owner, name)
    broadcast!(socket, "farms", %{farms: Store.summaries()})
    if farm = Store.farm(owner), do: broadcast!(socket, "farmUpdate", %{farm: farm})
    {:reply, {:ok, %{removed: name != owner}}, socket}
  end

  # A visitor is removed when their socket leaves or disconnects.
  @impl true
  def terminate(_reason, socket) do
    owner = socket.assigns[:owner]
    name = socket.assigns[:username]

    if owner && name do
      Store.leave_farm(owner, name)
      broadcast!(socket, "farms", %{farms: Store.summaries()})
      if farm = Store.farm(owner), do: broadcast!(socket, "farmUpdate", %{farm: farm})
    end

    :ok
  end
end
