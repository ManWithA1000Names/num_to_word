{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in rec {
        packages.num_to_word = pkgs.writeScriptBin "num_to_word" ''
          exec ${pkgs.deno}/bin/deno ${./main.ts} "$@"
        '';

        packages.default = packages.num_to_word;

        devShell = pkgs.mkShell { buildInputs = with pkgs; [ deno ]; };
      });
}
