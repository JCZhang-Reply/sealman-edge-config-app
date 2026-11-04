import { render } from "@/utils/test-utils"
import NatRules from "../NatRules"
import userEvent from "@testing-library/user-event"
import { ctx } from "../__mocks__/context"
import { DeviceNatConfigRulesContext } from "../context"

vi.mock("../NatRule")
vi.mock("../SaveNatConfig", () => ({ default: () => null }))

describe("Nat Rules", () => {
  it("should call addRules from the context on click on Add a new_rule_name button", async () => {
    const user = userEvent.setup()

    const { getByText }  = render(
      <DeviceNatConfigRulesContext.Provider value={ctx}>
        <NatRules />
      </DeviceNatConfigRulesContext.Provider>
    )

    await user.click(getByText("Add a rule"))
    expect(ctx.addNatRule).toHaveBeenCalledWith(
      {"extIp": "10.0.0.1", "intIp": "127.0.0.1", "name": "new_rule_name"}
    )
    vi.restoreAllMocks()
  })

  it("should mount the same amount of NatRules than the one received from the context", async () => {
    const { findByTestId } = render(
      <DeviceNatConfigRulesContext.Provider value={ctx}>
        <NatRules />
      </DeviceNatConfigRulesContext.Provider>
    )

    await findByTestId("nat-rule-mocked")
  })
})
