defmodule Grange.Player do
  @moduledoc "A player's persistent identity (lobby-side)."

  @derive {Jason.Encoder, only: [:name]}
  defstruct [:name]

  @type t :: %__MODULE__{name: String.t()}
end
