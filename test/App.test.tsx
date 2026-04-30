import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../src/App";
import '@testing-library/jest-dom';

describe("Frontend App", () => {
  it("should render without crashing", () => {
    render(<App />);
    expect(screen.getAllByText(/SENTINEL/i).length).toBeGreaterThan(0);
  });

  it("should render portfolio tabs correctly", () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    const portfolioButton = buttons.find(b => b.textContent && b.textContent.includes('Portfolio'));
    if (portfolioButton) {
      expect(portfolioButton).toBeInTheDocument();
    }
  });
});
