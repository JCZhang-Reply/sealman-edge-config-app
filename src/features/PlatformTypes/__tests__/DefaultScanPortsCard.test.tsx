import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DefaultScanPortsCard from "../DefaultScanPortsCard";

const { postDefaultScanPort, deleteDefaultScanPort, refetch } = vi.hoisted(() => ({
  postDefaultScanPort: vi.fn(),
  deleteDefaultScanPort: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/generated/edge-administration/hooks/network/useGetDefaultScanPorts", () => ({
  default: () => ({ data: [502], isLoading: false, refetch }),
}));
vi.mock("@/generated/edge-administration/hooks/network/usePostDefaultScanPort", () => ({
  default: () => ({ postDefaultScanPort, isPending: false }),
}));
vi.mock("@/generated/edge-administration/hooks/network/useDeleteDefaultScanPort", () => ({
  default: () => ({ deleteDefaultScanPort }),
}));

describe("DefaultScanPortsCard permissions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("disables every editing control without write permission", async () => {
    render(<DefaultScanPortsCard canWrite={false} />);

    const input = screen.getByRole("spinbutton");
    expect(input).toBeDisabled();
    await userEvent.type(input, "443{Enter}");
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
      await userEvent.click(button);
    }
    expect(postDefaultScanPort).not.toHaveBeenCalled();
    expect(deleteDefaultScanPort).not.toHaveBeenCalled();
  });

  it("allows adding and removing ports with write permission", async () => {
    render(<DefaultScanPortsCard canWrite />);

    await userEvent.type(screen.getByRole("spinbutton"), "443{Enter}");
    expect(postDefaultScanPort).toHaveBeenCalledWith({ port: 443 });
    await userEvent.click(screen.getAllByRole("button")[1]);
    expect(deleteDefaultScanPort).toHaveBeenCalledWith(502);
  });
});