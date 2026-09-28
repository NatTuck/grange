defmodule Grange.Id do
  @moduledoc "Generates opaque unique ids for plants."

  @doc "Returns a random 32-character hex id."
  def generate do
    :crypto.strong_rand_bytes(16) |> Base.encode16(case: :lower)
  end
end
