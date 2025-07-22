import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReactionPicker } from "../ReactionPicker";

describe("ReactionPicker", () => {
  it("リアクションボタンが表示される", () => {
    render(<ReactionPicker todoId={1} onReactionAdd={() => {}} />);

    const button = screen.getByRole("button", { name: /リアクション/ });
    expect(button).toBeInTheDocument();
  });
});
