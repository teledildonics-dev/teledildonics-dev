export enum Model {
  Nora = "Nora",
  Max = "Max",
  Lush = "Lush",
  Hush = "Hush",
  Domi = "Domi",
  Edge = "Edge",
  Osci = "Osci"
}

export const Nora = Model.Nora;
export const Max = Model.Max;
export const Lush = Model.Lush;
export const Hush = Model.Hush;
export const Domi = Model.Domi;
export const Edge = Model.Edge;
export const Osci = Model.Osci;

/// The capabilities of a given Lovense device.
export type DeviceCapabilities = {
  /// Whether this device supports the DeviceInfo command.
  readonly info: true;
  /// Whether this device support the Battery command.
  readonly battery: true;
  /// Whether this device supports the Vibrate:# command.
  readonly vibration?: void | true;
  /// Whether this device supports the Rotate:# and RotateChange commands.
  readonly rotation?: void | true;
  /// Whether this device supports the GetLevel and SetLevel:#:# commands.
  /// If defined, this will indicate the maximum supported index for SetLevel:#:#.
  readonly levels?: void | 3;
  /// Whether this device supports the GetPatten, GetPatten:#, and Preset:# commands.
  /// If defined, this will indicate the maximum supported index for Preset:#.
  readonly patterns?: void | 4 | 10;
};

/// The capabilities we expect from each model.
///
/// This assumes all generations and firmware versions of a model have the
/// same capabilities, which probably isn't always true.
export const modelCapabilities = new Map<Model, DeviceCapabilities>([
  [
    Nora,
    {
      info: true,
      battery: true,
      vibration: true,
      rotation: true
    }
  ],
  [
    Lush,
    {
      info: true,
      battery: true,
      vibration: true,
      patterns: 4
    }
  ],
  [
    Hush,
    {
      info: true,
      battery: true,
      vibration: true
    }
  ],
  [
    Domi,
    {
      info: true,
      battery: true,
      vibration: true,
      levels: 3,
      patterns: 10
    }
  ]
]);

/// Maps model identifiers used in DeviceType responses to Models.
export const modelsById = new Map<string, Model>([
  ["A", Nora],
  ["C", Nora],
  ["B", Max],
  ["S", Lush],
  ["Z", Hush],
  ["W", Domi],
  ["P", Edge],
  ["O", Osci]
]);
