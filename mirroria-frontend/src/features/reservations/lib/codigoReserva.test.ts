import { describe, expect, it } from "vitest";
import { codigoReserva, coincideCodigo } from "./codigoReserva";

const ID = "d6018924-5767-46a7-b6d6-4f6ff02db23a";

describe("codigoReserva", () => {
  it("son los primeros 8 caracteres en mayúsculas", () => {
    expect(codigoReserva(ID)).toBe("D6018924");
  });
});

describe("coincideCodigo", () => {
  it("acepta el código con #, espacios y minúsculas", () => {
    expect(coincideCodigo(ID, " #d601 8924 ")).toBe(true);
  });
  it("una búsqueda vacía no filtra nada", () => {
    expect(coincideCodigo(ID, "")).toBe(true);
  });
  it("un código distinto no coincide", () => {
    expect(coincideCodigo(ID, "1FE25265")).toBe(false);
  });
});
