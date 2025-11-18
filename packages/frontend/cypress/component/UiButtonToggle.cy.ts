import UiButtonToggle from "../../src/components/ui/UiButtonToggle.vue";

describe("UiButtonToggle Component", () => {
  it("should render all options", () => {
    const options = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
      { value: "option3", label: "Option 3" },
    ];

    cy.mount(UiButtonToggle, {
      props: {
        options,
      },
    });

    cy.contains("Option 1").should("be.visible");
    cy.contains("Option 2").should("be.visible");
    cy.contains("Option 3").should("be.visible");
  });

  it("should highlight the selected option with primary variant", () => {
    const options = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
    ];

    cy.mount(UiButtonToggle, {
      props: {
        options,
        modelValue: "option1",
      },
    });

    cy.contains("Option 1")
      .should("have.class", "bg-gradient-to-r")
      .and("have.class", "from-purple-500")
      .and("have.class", "to-pink-500");

    cy.contains("Option 2").should("have.class", "bg-white/10");
  });

  it("should emit update:modelValue when an option is clicked", () => {
    const onUpdate = cy.stub();
    const options = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
    ];

    cy.mount(UiButtonToggle, {
      props: {
        options,
        modelValue: "option1",
        "onUpdate:modelValue": onUpdate,
      },
    });

    cy.contains("Option 2").click();
    cy.wrap(null).then(() => {
      expect(onUpdate).to.have.been.calledWith("option2");
    });
  });

  it("should work with numeric values", () => {
    const onUpdate = cy.stub();
    const options = [
      { value: 1, label: "One" },
      { value: 2, label: "Two" },
      { value: 3, label: "Three" },
    ];

    cy.mount(UiButtonToggle, {
      props: {
        options,
        modelValue: 1,
        "onUpdate:modelValue": onUpdate,
      },
    });

    cy.contains("Two").click();
    cy.wrap(null).then(() => {
      expect(onUpdate).to.have.been.calledWith(2);
    });
  });

  it("should allow switching between options multiple times", () => {
    const onUpdate = cy.stub();
    const options = [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
      { value: "c", label: "C" },
    ];

    cy.mount(UiButtonToggle, {
      props: {
        options,
        modelValue: "a",
        "onUpdate:modelValue": onUpdate,
      },
    });

    cy.contains("B").click();
    cy.contains("C").click();
    cy.contains("A").click();

    cy.wrap(null).then(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(onUpdate).to.have.been.calledThrice;
      expect(onUpdate.firstCall).to.have.been.calledWith("b");
      expect(onUpdate.secondCall).to.have.been.calledWith("c");
      expect(onUpdate.thirdCall).to.have.been.calledWith("a");
    });
  });

  it("should render with empty options array", () => {
    cy.mount(UiButtonToggle, {
      props: {
        options: [],
      },
    });
    
    cy.get("button").should("not.exist");
  });
});
