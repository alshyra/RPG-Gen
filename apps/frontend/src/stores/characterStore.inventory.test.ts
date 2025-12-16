import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useCharacterStore } from "./characterStore";
import { characterApi } from "@rpg-gen/api-client";

describe("characterStore inventory persistence", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it("does nothing when no current character", async () => {
    const store = useCharacterStore();
    const spy = vi.spyOn(characterApi, "addInventoryItem");
    await store.addInventoryItem({ name: "Test" } as any);
    expect(spy).not.toHaveBeenCalled();
  });

  it("calls API and updates store on addInventoryItem", async () => {
    const store = useCharacterStore();
    store.currentCharacter = {
      characterId: "c1",
      name: "Hero",
      world: "dnd",
      portrait: "",
      isDeceased: false,
    } as any;

    const mockUpdated = {
      ...store.currentCharacter,
      inventory: [
        {
          _id: "i1",
          definitionId: "weapon-sword",
          name: "Sword",
          description: "",
          qty: 2,
          equipped: false,
        },
      ],
    } as any;
    const spy = vi.spyOn(characterApi, "addInventoryItem").mockResolvedValue(mockUpdated);

    await store.addInventoryItem({
      name: "Sword",
      quantity: 2,
    } as any);

    expect(spy).toHaveBeenCalledOnce();
    expect(store.currentCharacter?.value?.inventory?.[0].name).toBe("Sword");
    expect(store.currentCharacter?.value?.inventory?.[0].qty).toBe(2);
  });

  it("calls API and updates store on removeInventoryItem", async () => {
    const store = useCharacterStore();
    store.currentCharacter = {
      characterId: "c1",
      name: "Hero",
      world: "dnd",
      portrait: "",
      isDeceased: false,
      inventory: [
        {
          _id: "i1",
          definitionId: "weapon-sword",
          name: "Sword",
          description: "",
          qty: 2,
          equipped: false,
        },
      ],
    } as any;

    const mockUpdated = {
      ...store.currentCharacter,
      inventory: [],
    } as any;
    const spy = vi.spyOn(characterApi, "removeInventoryItem").mockResolvedValue(mockUpdated);

    await store.removeInventoryItem("weapon-sword", 2);

    expect(spy).toHaveBeenCalledOnce();
    expect(store.currentCharacter?.value?.inventory?.length).toBe(0);
  });

  it("uses inventory item only if it is usable (consumable)", async () => {
    const store = useCharacterStore();
    store.currentCharacter = {
      characterId: "c1",
      name: "Hero",
      world: "dnd",
      portrait: "",
      isDeceased: false,
      state: "created",
      inventory: [
        {
          _id: "i1",
          definitionId: "consumable-potion",
          name: "Potion",
          description: "",
          qty: 2,
          meta: {
            type: "consumable",
            usable: true,
          },
          equipped: false,
        },
        {
          _id: "i2",
          definitionId: "tool-tent",
          name: "Tent",
          description: "",
          qty: 1,
          meta: { type: "tool" },
          equipped: false,
        },
      ],
    };

    const spy = vi.spyOn(characterApi, "removeInventoryItem").mockResolvedValue({
      ...store.currentCharacter,
      inventory: [
        {
          _id: "i2",
          definitionId: "tool-tent",
          name: "Tent",
          description: "",
          qty: 1,
          meta: { type: "tool" },
          equipped: false,
        },
      ],
    });

    // Using Potion (consumable) should call remove
    await store.useInventoryItem("Potion");
    expect(spy).toHaveBeenCalled();

    spy.mockClear();

    // Using Tent (non-consumable) should NOT call remove
    await store.useInventoryItem("Tent");
    expect(spy).not.toHaveBeenCalled();
  });

  it("forwards definitionId when adding items", async () => {
    const store = useCharacterStore();
    store.currentCharacter = {
      characterId: "c1",
      name: "Hero",
      world: "dnd",
      portrait: "",
      isDeceased: false,
    } as any;

    const spy = vi
      .spyOn(characterApi, "addInventoryItem")
      .mockImplementation(async (_cid: string, payload: any) => {
        expect(payload.definitionId).toBe("weapon-sword");
        return {
          ...store.currentCharacter,
          inventory: [
            {
              _id: "i1",
              definitionId: "weapon-sword",
              name: "Épée",
              description: "",
              qty: 1,
              equipped: false,
            },
          ],
        } as any;
      });

    await store.addInventoryItem({
      name: "Épée",
      definitionId: "weapon-sword",
      qty: 1,
    } as any);
    expect(spy).toHaveBeenCalled();
  });
});
