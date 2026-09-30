defmodule Grange.Plant do
  @moduledoc "A single plant growing in a farm's field."

  @derive {Jason.Encoder, only: [:id, :stage]}
  defstruct [:id, :stage]

  @type stage :: :seedling | :tomato
  @type t :: %__MODULE__{id: String.t(), stage: stage}
end
